"use client";

import {
  useEffect, useMemo, useRef, useState, type Dispatch, type FocusEvent, type SetStateAction,
} from "react";
import {
  AlertTriangle, Check, ChevronDown, ChevronUp, FilePlus2, FolderOpen, Loader2,
  RefreshCw, Save, Settings2, Undo2, Wallet,
} from "lucide-react";
import { computePrice, lineCost } from "@/lib/pricing-formula";
import type { CostItem, PriceQuote, PricingSettings, QuoteInput, QuoteUpdate } from "@/lib/pricing-types";
import { formatDA } from "@/lib/pricing-units";
import { cn } from "@/lib/utils";
import { apiJson, errorText } from "./api";
import {
  draftFromQuote, draftHours, draftPortions, draftProblems, extraLine, hoursError, lineFromItem,
  newDraft, pickSettings, portionsError, problemsText, refreshStale, sameSettings,
  staleLines, toQuoteInput, toQuoteLine, toQuoteLines, type CalcDraft, type DraftLine,
} from "./draft";
import { formatDate, formatDateTime, priceChangeLabel, priceLabel, quoted, settingsChanges } from "./format";
import { AddLineButton, ExtraLineRow, FixedLineRow, HoursField, VariableLineRow } from "./lines";
import PriceBreakdown from "./PriceBreakdown";
import {
  ApiErrorBox, Banner, CARD_CLASS, ConfirmDialog, DecimalInput, EmptyHint, INPUT_CLASS,
  LABEL_CLASS, PRIMARY_BTN, SECONDARY_BTN, SectionHeader, Sheet,
} from "./ui";
import VariablePicker from "./VariablePicker";

interface Props {
  items: CostItem[];
  settings: PricingSettings; // current settings (Réglages)
  quotes: PriceQuote[];
  draft: CalcDraft;
  setDraft: Dispatch<SetStateAction<CalcDraft>>;
  onQuoteSaved: (q: PriceQuote) => void;
  goTo: (tab: "costs" | "quotes" | "settings") => void;
  /** Bumped to start the save flow from outside (« Enregistrer d'abord » in Fiches). */
  saveRequest?: number;
}

type SaveMode = "update" | "create";

const NAME_PLACEHOLDER = "Ex : Number cake Lina — 2 chiffres";

function scrollMainToTop() {
  document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
}

/** Text fields that pop the phone keyboard (not the checkbox-like buttons). */
function isTypingField(el: EventTarget | null): boolean {
  return el instanceof HTMLElement && el.matches("input:not([type=checkbox]):not([type=radio]), textarea, select");
}

export default function PriceCalculator({
  items, settings, quotes, draft, setDraft, onQuoteSaved, goTo, saveRequest = 0,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [barOpen, setBarOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [confirmLoadSaved, setConfirmLoadSaved] = useState(false);
  const [namePrompt, setNamePrompt] = useState<{ mode: SaveMode; value: string; initial: string } | null>(null);
  const [saving, setSaving] = useState<SaveMode | null>(null);
  const [saveError, setSaveError] = useState<{ text: string; conflict: boolean } | null>(null);
  const [saveMsg, setSaveMsg] = useState("");
  const [staleUndo, setStaleUndo] = useState<DraftLine[] | null>(null);

  useEffect(() => {
    if (!saveMsg) return;
    const t = setTimeout(() => setSaveMsg(""), 4000);
    return () => clearTimeout(t);
  }, [saveMsg]);

  useEffect(() => {
    if (!staleUndo) return;
    const t = setTimeout(() => setStaleUndo(null), 20000);
    return () => clearTimeout(t);
  }, [staleUndo]);

  // Focus the line just added — once the picker is closed, so the keyboard
  // doesn't pop up behind the sheet.
  useEffect(() => {
    if (!focusKey || pickerOpen) return;
    const el = document.getElementById(`line-${focusKey}`);
    if (el) {
      el.focus({ preventScroll: true });
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    setFocusKey(null);
  }, [focusKey, pickerOpen]);

  const itemsById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const hours = draftHours(draft);
  const portions = draftPortions(draft);
  const breakdown = computePrice({ lines: toQuoteLines(draft), hours, portions, settings: draft.settings });
  const costByKey = new Map(breakdown.lines.map((l) => [l.key, l]));
  const lineErrorCount = breakdown.lines.filter((l) => l.error).length;
  const incomplete = problemsText(draftProblems(draft), lineErrorCount);

  /** Final price of `d` with these settings, or null when it would be incomplete. */
  function priceOf(d: CalcDraft, s: CalcDraft["settings"]): number | null {
    const b = computePrice({ lines: toQuoteLines(d), hours: draftHours(d), portions: draftPortions(d), settings: s });
    const errors = b.lines.filter((l) => l.error).length;
    return problemsText(draftProblems(d), errors) ? null : b.finalPrice;
  }

  const loadedQuote = draft.quoteId ? quotes.find((q) => q.id === draft.quoteId) : undefined;
  const savedPrice = loadedQuote?.result.finalPrice;
  const savedDiffers = savedPrice !== undefined && Math.abs(savedPrice - breakdown.finalPrice) >= 0.01;
  const newerOnServer =
    !!loadedQuote &&
    !!draft.quoteUpdatedAt &&
    Date.parse(loadedQuote.updatedAt) > Date.parse(draft.quoteUpdatedAt);

  const fixedLines = draft.lines.filter((l) => l.kind === "fixed");
  const variableLines = draft.lines.filter((l) => l.kind === "variable");
  const extraLines = draft.lines.filter((l) => l.kind === "extra");
  const variableItems = items.filter((i) => i.kind === "variable");

  const settingsDiffs = sameSettings(draft.settings, settings) ? [] : settingsChanges(draft.settings, settings);
  const priceWithCurrentSettings = settingsDiffs.length ? priceOf(draft, pickSettings(settings)) : null;

  const stale = staleLines(draft, items);
  const staleNewPrice = new Map(stale.map(({ line, item }) => [line.key, item]));
  const refreshedPrice = stale.length ? priceOf(refreshStale(draft, items), draft.settings) : null;

  const isDeleted = (l: DraftLine) => !!l.costItemId && !itemsById.has(l.costItemId);

  // Every user edit goes through here so "unsaved changes" stays accurate.
  function update(fn: (d: CalcDraft) => CalcDraft) {
    setDraft((d) => ({ ...fn(d), dirty: true, rev: d.rev + 1 }));
    setSaveMsg("");
    setStaleUndo(null);
  }
  function updateLine(key: string, patch: Partial<DraftLine>) {
    update((d) => ({ ...d, lines: d.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)) }));
  }
  function removeLine(key: string) {
    update((d) => ({ ...d, lines: d.lines.filter((l) => l.key !== key) }));
  }
  function addVariable(item: CostItem) {
    const line = lineFromItem(item);
    update((d) => ({ ...d, lines: [...d.lines, line] }));
    setFocusKey((k) => k ?? line.key); // the first one picked gets the focus
  }
  function addExtra() {
    const line = extraLine();
    update((d) => ({ ...d, lines: [...d.lines, line] }));
    setFocusKey(line.key);
  }
  function applyStale() {
    const previous = draft.lines;
    update((d) => refreshStale(d, items));
    setStaleUndo(previous);
  }
  function undoStale() {
    if (!staleUndo) return;
    const previous = staleUndo;
    update((d) => ({ ...d, lines: previous }));
  }

  function resetUi() {
    setSaveError(null);
    setSaveMsg("");
    setStaleUndo(null);
    setBarOpen(false);
  }

  function startNew() {
    setDraft(newDraft(items, settings));
    setConfirmNew(false);
    resetUi();
    scrollMainToTop();
  }

  function loadSavedVersion() {
    if (loadedQuote) setDraft(draftFromQuote(loadedQuote, items, settings));
    setConfirmLoadSaved(false);
    resetUi();
    scrollMainToTop();
  }

  /** Save refused: say why and take her to the first field to fix. */
  function explainIncomplete() {
    setNamePrompt(null);
    setSaveError({ text: `Prix incomplet : ${incomplete}. Corrigez avant d'enregistrer.`, conflict: false });
    const el = rootRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [data-missing="true"]');
    if (el) {
      el.focus({ preventScroll: true });
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }

  function saveAsNew() {
    if (incomplete) return explainIncomplete();
    const base = draft.name.trim() || loadedQuote?.name || "";
    const value = base ? `${base} (copie)` : "";
    setNamePrompt({ mode: "create", value, initial: value });
  }

  async function save(mode: SaveMode, name: string) {
    if (incomplete) return explainIncomplete();
    const trimmed = name.trim();
    if (!trimmed) {
      setNamePrompt({ mode, value: "", initial: "" });
      return;
    }
    setNamePrompt(null);
    setSaving(mode);
    setSaveError(null);
    setSaveMsg("");
    // If she edits while the request is in flight, those edits stay "unsaved".
    const startRev = draft.rev;
    try {
      const input: QuoteInput = toQuoteInput({ ...draft, name: trimmed });
      let q: PriceQuote;
      if (mode === "update" && draft.quoteId) {
        const body: QuoteUpdate = { ...input, expectedUpdatedAt: draft.quoteUpdatedAt ?? undefined };
        q = await apiJson<PriceQuote>(`/api/admin/pricing/quotes/${draft.quoteId}`, "PUT", body, "La mise à jour du devis a échoué.");
      } else {
        q = await apiJson<PriceQuote>("/api/admin/pricing/quotes", "POST", input, "L'enregistrement du devis a échoué.");
      }
      onQuoteSaved(q);
      setDraft((d) =>
        d.rev === startRev
          ? { ...d, name: q.name, quoteId: q.id, quoteUpdatedAt: q.updatedAt, dirty: false }
          : { ...d, name: d.name.trim() ? d.name : q.name, quoteId: q.id, quoteUpdatedAt: q.updatedAt }
      );
      setSaveMsg(mode === "update" ? "Devis mis à jour." : "Devis enregistré.");
    } catch (e) {
      setSaveError(errorText(e));
      // Keep the name she typed in the prompt for the next try.
      setDraft((d) => (d.name.trim() || mode !== "create" || d.quoteId ? d : { ...d, name: trimmed }));
    } finally {
      setSaving(null);
    }
  }

  // Same as touching « Enregistrer » (asks for a name, or says what to fix first).
  const handledSaveRequest = useRef(saveRequest);
  useEffect(() => {
    if (saveRequest === handledSaveRequest.current) return;
    handledSaveRequest.current = saveRequest;
    void save(draft.quoteId ? "update" : "create", draft.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveRequest]);

  const hoursErr = hoursError(draft.hoursRaw);

  const barExtras: Array<{ text: string; tone: "gray" | "amber" | "red" }> = [];
  if (!incomplete) barExtras.push({ text: `Coût de revient ${formatDA(breakdown.costTotal)}`, tone: "gray" });
  if (savedDiffers && savedPrice !== undefined) barExtras.push({ text: `Enregistré : ${formatDA(savedPrice)}`, tone: "amber" });
  if (hours === 0 && !hoursErr) barExtras.push({ text: "0 h de travail ?", tone: "amber" });

  return (
    <div
      ref={rootRef}
      className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-5 lg:items-start"
      onFocus={(e: FocusEvent) => isTypingField(e.target) && setTyping(true)}
      onBlur={(e: FocusEvent) => !isTypingField(e.relatedTarget) && setTyping(false)}
    >
      <div className="space-y-4 min-w-0">
        {/* ---------- Banners ---------- */}
        {settings.hourlyRate <= 0 && (
          <Banner tone="amber" icon={<Settings2 size={16} />}>
            <p className="font-medium">Définissez votre taux horaire</p>
            <p className="text-xs mt-0.5">Sans lui, votre temps de travail n&apos;est pas compté dans le prix.</p>
            <button type="button" onClick={() => goTo("settings")} className="mt-2 text-sm font-semibold underline underline-offset-2 min-h-[40px]">
              Aller aux réglages
            </button>
          </Banner>
        )}
        {items.length === 0 && (
          <Banner tone="rose" icon={<Wallet size={16} />}>
            <p className="font-medium">Commencez par lister vos coûts</p>
            <p className="text-xs mt-0.5">
              Boîte, support, amandes, chocolat… Une fois enregistrés, il suffira de les cocher ici.
            </p>
            <button type="button" onClick={() => goTo("costs")} className="mt-2 text-sm font-semibold underline underline-offset-2 min-h-[40px]">
              Ajouter mes coûts
            </button>
          </Banner>
        )}
        {draft.quoteId && (
          <Banner tone="gray" icon={<FolderOpen size={16} />}>
            <p>
              Devis ouvert : <span className="font-semibold">{quoted(loadedQuote?.name ?? draft.name)}</span>
              {loadedQuote && (
                <span className="text-gray-500"> · enregistré le {formatDate(loadedQuote.updatedAt)}</span>
              )}
            </p>
            {draft.dirty && <p className="text-xs text-amber-700 mt-0.5">Modifications non enregistrées</p>}
          </Banner>
        )}
        {newerOnServer && loadedQuote && (
          <Banner tone="amber" icon={<AlertTriangle size={16} />}>
            <p className="font-medium">Ce devis a été modifié ailleurs depuis que vous l&apos;avez ouvert</p>
            <p className="text-xs mt-0.5">
              Version enregistrée le {formatDateTime(loadedQuote.updatedAt)} ({formatDA(loadedQuote.result.finalPrice)}).
              Ce qui est affiché ici n&apos;en tient pas compte.
            </p>
            <button
              type="button"
              onClick={() => setConfirmLoadSaved(true)}
              className="mt-2 inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition"
            >
              <FolderOpen size={14} /> Charger la version enregistrée
            </button>
          </Banner>
        )}
        {settingsDiffs.length > 0 && (
          <Banner tone="amber" icon={<Settings2 size={16} />}>
            <p className="font-medium">
              {draft.quoteId
                ? "Ce devis a été calculé avec d'anciens réglages"
                : "Vos réglages ont changé depuis le début de ce calcul"}
            </p>
            <ul className="text-xs mt-1 space-y-0.5">
              {settingsDiffs.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            {priceWithCurrentSettings !== null && !incomplete && (
              <p className="text-xs mt-1.5">
                Prix : {formatDA(breakdown.finalPrice)} → <span className="font-semibold">{formatDA(priceWithCurrentSettings)}</span>
              </p>
            )}
            <button
              type="button"
              onClick={() => update((d) => ({ ...d, settings: pickSettings(settings) }))}
              className="mt-2 inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition"
            >
              <Settings2 size={14} /> Appliquer les réglages actuels
            </button>
          </Banner>
        )}
        {stale.length > 0 && (
          <Banner tone="amber" icon={<RefreshCw size={16} />}>
            <p className="font-medium">
              {stale.length === 1 ? "Le prix d'un élément a changé" : `Les prix de ${stale.length} éléments ont changé`}
              {draft.quoteId ? " depuis ce devis" : " depuis le début de ce calcul"}
            </p>
            <ul className="text-xs mt-1 space-y-0.5">
              {stale.map(({ line, item }) => (
                <li key={line.key}>
                  {line.name}&nbsp;: {priceChangeLabel(line, item)}
                  {line.kind !== item.kind && (item.kind === "variable" ? " (devient coût variable)" : " (devient coût fixe)")}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={applyStale}
              className="mt-2 inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-medium text-left hover:bg-amber-600 transition"
            >
              <RefreshCw size={14} className="shrink-0" />
              {refreshedPrice !== null
                ? `Mettre à jour (nouveau prix : ${formatDA(refreshedPrice)})`
                : "Mettre à jour aux prix actuels"}
            </button>
          </Banner>
        )}
        {staleUndo && (
          <div role="status" className="flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-2 text-sm text-emerald-800">
            <span className="flex items-center gap-2">
              <Check size={15} /> Prix mis à jour.
            </span>
            <button type="button" onClick={undoStale} className="inline-flex items-center gap-1.5 min-h-[40px] px-2 font-semibold underline underline-offset-2">
              <Undo2 size={14} /> Annuler
            </button>
          </div>
        )}

        {/* ---------- The cake ---------- */}
        <section className={cn(CARD_CLASS, "p-4 space-y-3")}>
          <div>
            <label htmlFor="calc-name" className={LABEL_CLASS}>Nom du devis</label>
            <input
              id="calc-name"
              type="text"
              value={draft.name}
              onChange={(e) => update((d) => ({ ...d, name: e.target.value }))}
              placeholder={NAME_PLACEHOLDER}
              maxLength={100}
              className={INPUT_CLASS}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <HoursField id="calc-hours" value={draft.hoursRaw} onChange={(v) => update((d) => ({ ...d, hoursRaw: v }))} />
            <div>
              <label htmlFor="calc-parts" className={LABEL_CLASS}>Nombre de parts (optionnel)</label>
              <DecimalInput
                id="calc-parts"
                value={draft.portionsRaw}
                onChange={(v) => update((d) => ({ ...d, portionsRaw: v }))}
                inputMode="numeric"
                suffix="parts"
                placeholder="—"
                error={portionsError(draft.portionsRaw)}
              />
            </div>
          </div>
        </section>

        {/* ---------- Fixed costs ---------- */}
        <section className={CARD_CLASS}>
          <SectionHeader
            title="Coûts fixes"
            subtitle="Inclus dans chaque gâteau. Décochez ce qui ne sert pas pour celui-ci."
            total={breakdown.fixedTotal}
          />
          {fixedLines.length === 0 ? (
            <EmptyHint>
              Aucun coût fixe pour l&apos;instant.{" "}
              <button type="button" onClick={() => goTo("costs")} className="text-rose-600 font-medium underline underline-offset-2">
                En ajouter dans Mes coûts
              </button>
            </EmptyHint>
          ) : (
            <ul className="divide-y divide-gray-100">
              {fixedLines.map((l) => {
                const newPrice = staleNewPrice.get(l.key);
                return (
                  <FixedLineRow
                    key={l.key}
                    line={l}
                    cost={l.included ? costByKey.get(l.key)?.cost ?? 0 : lineCost(toQuoteLine(l)).cost}
                    flag={isDeleted(l) && <span className="text-amber-600"> · (supprimé de la liste)</span>}
                    hint={newPrice && <p className="pl-10 text-xs text-amber-700">nouveau prix : {priceLabel(newPrice)}</p>}
                    onToggle={() => updateLine(l.key, { included: !l.included })}
                    onQtyChange={(v) => updateLine(l.key, { qtyRaw: v })}
                  />
                );
              })}
            </ul>
          )}
        </section>

        {/* ---------- Variable costs ---------- */}
        <section className={CARD_CLASS}>
          <SectionHeader
            title="Coûts variables"
            subtitle="Ingrédients et fournitures selon la quantité utilisée."
            total={breakdown.variableTotal}
          />
          {variableLines.length === 0 ? (
            <EmptyHint>Ajoutez ce que vous utilisez pour ce gâteau : amandes, chocolat, ruban…</EmptyHint>
          ) : (
            <ul className="divide-y divide-gray-100">
              {variableLines.map((l) => {
                const lc = costByKey.get(l.key);
                const newPrice = staleNewPrice.get(l.key);
                return (
                  <VariableLineRow
                    key={l.key}
                    line={l}
                    cost={lc?.cost ?? 0}
                    error={lc?.error}
                    flag={isDeleted(l) && <span className="text-xs font-normal text-amber-600"> (supprimé de la liste)</span>}
                    hint={newPrice && <p className="text-xs text-amber-700">nouveau prix : {priceLabel(newPrice)}</p>}
                    onQtyChange={(v) => updateLine(l.key, { qtyRaw: v })}
                    onUnitChange={(u) => updateLine(l.key, { qtyUnit: u })}
                    onRemove={() => removeLine(l.key)}
                  />
                );
              })}
            </ul>
          )}
          <div className="p-3 border-t border-gray-100">
            <AddLineButton tone="rose" onClick={() => setPickerOpen(true)}>Ajouter un coût variable</AddLineButton>
          </div>
        </section>

        {/* ---------- Extras ---------- */}
        <section className={CARD_CLASS}>
          <SectionHeader
            title="Extras ponctuels"
            subtitle="Un achat spécial pour ce gâteau uniquement (topper, fleurs fraîches…)."
            total={breakdown.extrasTotal}
          />
          {extraLines.length > 0 && (
            <ul className="divide-y divide-gray-100">
              {extraLines.map((l) => (
                <ExtraLineRow
                  key={l.key}
                  line={l}
                  onNameChange={(name) => updateLine(l.key, { name })}
                  onAmountChange={(v) => updateLine(l.key, { amountRaw: v })}
                  onRemove={() => removeLine(l.key)}
                />
              ))}
            </ul>
          )}
          <div className={cn("p-3", extraLines.length > 0 && "border-t border-gray-100")}>
            <AddLineButton onClick={addExtra}>Ajouter un extra</AddLineButton>
          </div>
        </section>

        {/* ---------- Note + save ---------- */}
        <section className={cn(CARD_CLASS, "p-4 space-y-3")}>
          <div>
            <label htmlFor="calc-note" className={LABEL_CLASS}>Note (optionnel)</label>
            <textarea
              id="calc-note"
              value={draft.note}
              onChange={(e) => update((d) => ({ ...d, note: e.target.value }))}
              rows={2}
              maxLength={500}
              placeholder="Ex : commande de Mme B., livraison samedi"
              className={cn(INPUT_CLASS, "resize-y")}
            />
          </div>
          {saveError && <ApiErrorBox error={saveError} />}
          {!saveError && incomplete && (
            <p className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 rounded-xl px-4 py-3">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <span>Prix incomplet : {incomplete}. Le devis pourra être enregistré ensuite.</span>
            </p>
          )}
          {saveMsg && (
            <p role="status" className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3">
              <Check size={15} /> {saveMsg}{" "}
              <button type="button" onClick={() => goTo("quotes")} className="underline underline-offset-2 font-medium min-h-[32px]">
                Voir mes devis
              </button>
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            {draft.quoteId ? (
              <>
                <button type="button" onClick={() => save("update", draft.name)} disabled={saving !== null} className={cn(PRIMARY_BTN, "sm:flex-1")}>
                  {saving === "update" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  Mettre à jour
                </button>
                <button type="button" onClick={saveAsNew} disabled={saving !== null} className={cn(SECONDARY_BTN, "sm:flex-1")}>
                  {saving === "create" ? <Loader2 size={15} className="animate-spin" /> : <FilePlus2 size={15} />}
                  Enregistrer comme nouveau
                </button>
              </>
            ) : (
              <button type="button" onClick={() => save("create", draft.name)} disabled={saving !== null} className={cn(PRIMARY_BTN, "sm:flex-1")}>
                {saving === "create" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Enregistrer le devis
              </button>
            )}
            <button
              type="button"
              onClick={() => (draft.dirty ? setConfirmNew(true) : startNew())}
              disabled={saving !== null}
              className={cn(SECONDARY_BTN, "sm:w-auto")}
            >
              <RefreshCw size={15} /> Nouveau calcul
            </button>
          </div>
        </section>

        {/* ---------- Phone: sticky result bar (one slim line while typing) ---------- */}
        <div className="lg:hidden sticky bottom-0 z-20 pt-1">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] overflow-hidden">
            {typing ? (
              <div className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                <span className="text-gray-500">Prix de vente</span>
                {incomplete ? (
                  <span className="font-semibold text-amber-700">Prix incomplet</span>
                ) : (
                  <span className="font-bold text-rose-600 tabular-nums">{formatDA(breakdown.finalPrice)}</span>
                )}
              </div>
            ) : (
              <>
                {barOpen && (
                  <div className="max-h-[55vh] overflow-y-auto overscroll-contain px-4 pt-3 border-b border-gray-100">
                    <PriceBreakdown
                      breakdown={breakdown}
                      settings={draft.settings}
                      hours={hours}
                      portions={portions}
                      savedPrice={savedPrice}
                      showFinal={false}
                      incomplete={incomplete}
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setBarOpen((o) => !o)}
                  aria-expanded={barOpen}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                >
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs text-gray-500">
                      Prix de vente
                      {!incomplete && breakdown.pricePerPortion !== null && ` · ${formatDA(breakdown.pricePerPortion)} / part`}
                    </span>
                    {incomplete ? (
                      <>
                        <span className="block text-xl font-bold text-amber-700 leading-tight">Prix incomplet</span>
                        <span className="block text-xs text-amber-700 first-letter:uppercase">{incomplete}</span>
                      </>
                    ) : (
                      <span className="block text-2xl font-bold text-rose-600 tabular-nums leading-tight">
                        {formatDA(breakdown.finalPrice)}
                      </span>
                    )}
                    {barExtras.length > 0 && (
                      <span className="flex flex-wrap gap-x-2 text-xs">
                        {barExtras.map((x) => (
                          <span
                            key={x.text}
                            className={cn(x.tone === "gray" ? "text-gray-400" : x.tone === "amber" ? "text-amber-700" : "text-red-600")}
                          >
                            {x.text}
                          </span>
                        ))}
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-medium text-gray-600 shrink-0 min-h-[40px]">
                    {barOpen ? <>Masquer <ChevronDown size={16} /></> : <>Détail <ChevronUp size={16} /></>}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ---------- Desktop: result column ---------- */}
      <aside className="hidden lg:block lg:sticky lg:top-0">
        <div className={cn(CARD_CLASS, "p-4")}>
          <h2 className="font-semibold text-gray-800 mb-2">Résultat</h2>
          <PriceBreakdown
            breakdown={breakdown}
            settings={draft.settings}
            hours={hours}
            portions={portions}
            savedPrice={savedPrice}
            incomplete={incomplete}
          />
          {hours === 0 && !hoursErr && <p className="text-xs text-amber-700 mt-1">0 h de travail ?</p>}
        </div>
      </aside>

      {/* ---------- Dialogs ---------- */}
      {pickerOpen && (
        <VariablePicker
          items={variableItems}
          usedIds={new Set(variableLines.map((l) => l.costItemId ?? ""))}
          onPick={addVariable}
          onClose={() => setPickerOpen(false)}
          onGoToCosts={() => {
            setPickerOpen(false);
            goTo("costs");
          }}
        />
      )}

      {confirmNew && (
        <ConfirmDialog
          title="Commencer un nouveau calcul ?"
          confirmLabel="Nouveau calcul"
          tone="primary"
          onConfirm={startNew}
          onCancel={() => setConfirmNew(false)}
        >
          <p>Les modifications non enregistrées de ce calcul seront perdues.</p>
        </ConfirmDialog>
      )}

      {confirmLoadSaved && (
        <ConfirmDialog
          title="Charger la version enregistrée ?"
          confirmLabel="Charger"
          tone="primary"
          onConfirm={loadSavedVersion}
          onCancel={() => setConfirmLoadSaved(false)}
        >
          <p>Les modifications non enregistrées sur cet écran seront remplacées.</p>
        </ConfirmDialog>
      )}

      {namePrompt && (
        <Sheet
          title={namePrompt.mode === "create" && draft.quoteId ? "Enregistrer comme nouveau devis" : "Nom du devis"}
          onClose={() => setNamePrompt(null)}
          dirty={namePrompt.value !== namePrompt.initial}
          footer={
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setNamePrompt(null)} className={SECONDARY_BTN}>
                Annuler
              </button>
              <button
                type="submit"
                form="quote-name-form"
                disabled={!namePrompt.value.trim()}
                className={PRIMARY_BTN}
              >
                <Save size={15} /> Enregistrer
              </button>
            </div>
          }
        >
          <form
            id="quote-name-form"
            className="p-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!namePrompt.value.trim()) return;
              void save(namePrompt.mode, namePrompt.value);
            }}
          >
            <label htmlFor="quote-name" className={LABEL_CLASS}>Nom du devis</label>
            <input
              id="quote-name"
              type="text"
              autoFocus
              value={namePrompt.value}
              onChange={(e) => setNamePrompt({ ...namePrompt, value: e.target.value })}
              placeholder={NAME_PLACEHOLDER}
              maxLength={100}
              className={INPUT_CLASS}
            />
            <p className="text-xs text-gray-400 mt-1">Pour le retrouver dans l&apos;onglet Devis.</p>
          </form>
        </Sheet>
      )}
    </div>
  );
}
