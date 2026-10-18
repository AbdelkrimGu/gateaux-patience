"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, ChevronRight, CopyPlus, Layers, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { lineCost } from "@/lib/pricing-formula";
import type { CostItem, PriceTemplate, PricingSettings, TemplateInput, TemplateUpdate } from "@/lib/pricing-types";
import { emptyVariant, type PricedVariant } from "@/lib/pricing-templates";
import { formatDA } from "@/lib/pricing-units";
import { cn } from "@/lib/utils";
import { ApiError, apiJson, errorText, type ErrorInfo } from "./api";
import { draftHours, draftPortions, extraLine, lineFromItem, portionsError, toQuoteLine, type DraftLine } from "./draft";
import { quoted, searchKey } from "./format";
import { AddLineButton, ExtraLineRow, FixedLineRow, HoursField, VariableLineRow } from "./lines";
import PriceBreakdown from "./PriceBreakdown";
import { CakePicker, CakeThumb, SizeDialog, StandardSizesDialog, type NewSize } from "./SheetDialogs";
import {
  blockedReason, hasContent, isUnfinished, MAX_SIZES, partsFromLabel, priceDraft, reconcileSheetFixed,
  scaleDraft, SHEET_DRAFT_KEY, sheetDraftFrom, standardSizes, toTemplateInput, toVariantInput,
  variantDraftFrom, variantProblem, type CakeOption, type SheetDraft, type StoredSheetDraft,
  type VariantDraft,
} from "./sheet-draft";
import {
  ApiErrorBox, CARD_CLASS, ConfirmDialog, DecimalInput, EmptyHint, INPUT_CLASS, LABEL_CLASS, PRIMARY_BTN,
  SECONDARY_BTN, SectionHeader, Sheet, useBeforeUnload,
} from "./ui";
import VariablePicker from "./VariablePicker";

interface Props {
  template: PriceTemplate | null; // null = new sheet
  initialVariantId?: string;
  /** Unsaved editor kept on the phone (reload, expired session), resumed as is. */
  restored?: StoredSheetDraft;
  /** Opened from « Corriger »: go straight to the line to fix. */
  focusProblemOnOpen?: boolean;
  items: CostItem[];
  settings: PricingSettings;
  cakes: CakeOption[];
  onSaved: (t: PriceTemplate, created: boolean) => void;
  onDeleted: (id: string) => void;
  onClose: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

/** What a size shows in its pill and in the footer. */
type SizeInfo = { priced: PricedVariant; problem: string | null; unfinished: boolean; noHours: boolean };

function storeDraft(draft: SheetDraft, selectedId: string | null) {
  try {
    const stored: StoredSheetDraft = { v: 1, draft, selectedId, savedAt: new Date().toISOString() };
    window.localStorage.setItem(SHEET_DRAFT_KEY, JSON.stringify(stored));
  } catch {
    /* private mode / quota: the editor just won't survive a reload */
  }
}

export function clearStoredSheetDraft() {
  try {
    window.localStorage.removeItem(SHEET_DRAFT_KEY);
  } catch {
    /* nothing to clear */
  }
}

type Dialog =
  | { type: "picker" }
  | { type: "cake" }
  | { type: "size"; copyByDefault: boolean }
  | { type: "standard" }
  | { type: "deleteSize"; variant: VariantDraft }
  | { type: "deleteSheet"; loading: boolean };

const PROBLEM_SELECTOR = '[aria-invalid="true"], [data-missing="true"], [data-problem="true"]';

export default function SheetEditor({
  template, initialVariantId, restored, focusProblemOnOpen = false, items, settings, cakes, onSaved,
  onDeleted, onClose, onDirtyChange,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<SheetDraft>(() =>
    restored ? reconcileSheetFixed(restored.draft, items) : sheetDraftFrom(template, items)
  );
  const [dirty, setDirty] = useState(!!restored);
  const [selectedId, setSelectedId] = useState<string | null>(
    restored?.selectedId ?? initialVariantId ?? template?.variants[0]?.id ?? null
  );
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [triedSave, setTriedSave] = useState(false);
  const [notice, setNotice] = useState("");
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [focusProblem, setFocusProblem] = useState(focusProblemOnOpen);

  useBeforeUnload(dirty);

  // Kept on the phone while unsaved: a reload or an expired session loses nothing.
  useEffect(() => {
    if (dirty) storeDraft(draft, selectedId);
  }, [dirty, draft, selectedId]);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);

  /** Every way out of the editor: what's on the phone has been saved or given up. */
  function close() {
    clearStoredSheetDraft();
    onClose();
  }

  const itemsById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const selected = draft.variants.find((v) => v.id === selectedId) ?? draft.variants[0];
  const priced = new Map<string, SizeInfo>(
    draft.variants.map((v) => {
      const p = priceDraft(v, items, settings);
      const input = toVariantInput(v, items);
      return [
        v.id,
        { priced: p, problem: variantProblem(v, p), unfinished: isUnfinished(input), noHours: !(input.hours > 0) },
      ];
    })
  );
  const current = selected ? priced.get(selected.id) : undefined;
  const savedIds = new Set(template?.variants.map((v) => v.id) ?? []);
  const canAddSize = draft.variants.length < MAX_SIZES;
  const cake = draft.cakeId ? cakes.find((c) => c.id === draft.cakeId) : undefined;
  // A linked cake that left the catalog keeps the name stored with the sheet.
  const cakeTitle = cake?.title ?? (draft.cakeId && draft.cakeId === template?.cakeId ? template.cakeTitle : undefined);
  const cakeImage = cake?.image ?? (draft.cakeId && draft.cakeId === template?.cakeId ? template.cakeImage : undefined);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(t);
  }, [notice]);

  // Focus the line just added once the picker is closed (keyboard not behind it).
  useEffect(() => {
    if (!focusKey || dialog) return;
    const el = document.getElementById(`line-${focusKey}`);
    if (el) {
      el.focus({ preventScroll: true });
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    setFocusKey(null);
  }, [focusKey, dialog]);

  // After a refused save: take her to the first field to fix (rendered by then).
  useEffect(() => {
    if (!focusProblem) return;
    setFocusProblem(false);
    const el = rootRef.current?.querySelector<HTMLElement>(PROBLEM_SELECTOR);
    if (el) {
      el.focus({ preventScroll: true });
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [focusProblem]);

  // ---------- edits ----------

  function update(fn: (d: SheetDraft) => SheetDraft) {
    setDraft(fn);
    setDirty(true);
    setError(null);
  }
  function updateVariant(id: string, fn: (v: VariantDraft) => VariantDraft) {
    update((d) => ({ ...d, variants: d.variants.map((v) => (v.id === id ? fn(v) : v)) }));
  }
  function updateLine(vid: string, key: string, patch: Partial<DraftLine>) {
    updateVariant(vid, (v) => ({ ...v, lines: v.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)) }));
  }
  function removeLine(vid: string, key: string) {
    updateVariant(vid, (v) => ({ ...v, lines: v.lines.filter((l) => l.key !== key) }));
  }
  function addVariable(item: CostItem) {
    if (!selected) return;
    const line = lineFromItem(item);
    updateVariant(selected.id, (v) => ({ ...v, lines: [...v.lines, line] }));
    setFocusKey((k) => k ?? line.key);
  }
  function addExtra() {
    if (!selected) return;
    const line = extraLine();
    updateVariant(selected.id, (v) => ({ ...v, lines: [...v.lines, line] }));
    setFocusKey(line.key);
  }

  function selectVariant(id: string) {
    setSelectedId(id);
    // Bring the pill into view when it was added at the end of a long row.
    requestAnimationFrame(() => document.getElementById(`size-pill-${id}`)?.scrollIntoView({ block: "nearest", inline: "nearest" }));
  }

  function createSize(size: NewSize) {
    const v =
      size.kind === "copy" && selected
        ? scaleDraft(selected, items, size)
        : variantDraftFrom(emptyVariant(size.label, size.portions), items);
    update((d) => ({ ...d, variants: [...d.variants, v] }));
    setDialog(null);
    selectVariant(v.id);
    setNotice(size.kind === "copy" ? `Taille ${quoted(v.label)} créée. Vérifiez ses quantités.` : `Taille ${quoted(v.label)} créée.`);
  }

  function createStandard(scaleHours: boolean) {
    const source = draft.variants[0];
    const next = standardSizes(draft.variants, items, scaleHours);
    update((d) => ({ ...d, variants: next }));
    setDialog(null);
    selectVariant(source && next.includes(source) ? source.id : next[0].id);
    setNotice(
      source && hasContent(source)
        ? `${next.length - 1} tailles ajoutées à partir de ${quoted(source.label)}. Vérifiez les quantités de chaque taille.`
        : "Les 4 tailles standard sont prêtes : remplissez chacune d'elles."
    );
  }

  function deleteSize(v: VariantDraft) {
    const i = draft.variants.findIndex((x) => x.id === v.id);
    const rest = draft.variants.filter((x) => x.id !== v.id);
    update((d) => ({ ...d, variants: d.variants.filter((x) => x.id !== v.id) }));
    setDialog(null);
    const next = rest[Math.min(i, rest.length - 1)];
    setSelectedId(next ? next.id : null);
  }

  function pickCake(c: CakeOption | null) {
    // A new sheet is usually named after its cake.
    update((d) => ({ ...d, cakeId: c?.id ?? null, name: d.name.trim() || !c ? d.name : c.title }));
    setDialog(null);
  }

  // ---------- save / delete ----------

  function refuse(text: string, variantId?: string) {
    setError({ text, conflict: false });
    if (variantId) setSelectedId(variantId);
    setFocusProblem(true);
  }

  async function save() {
    setTriedSave(true);
    if (!draft.name.trim()) return refuse("Donnez un nom à la fiche (ex : Number cake).");
    if (draft.variants.length === 0) return refuse("Ajoutez au moins une taille.");
    const seen = new Set<string>();
    for (const v of draft.variants) {
      const problem = priced.get(v.id)?.problem;
      if (problem) {
        return refuse(`Taille ${quoted(v.label.trim() || "sans nom")} : ${problem}. Corrigez avant d'enregistrer.`, v.id);
      }
      const k = searchKey(v.label);
      if (seen.has(k)) return refuse(`Deux tailles s'appellent ${quoted(v.label.trim())}. Renommez l'une d'elles.`, v.id);
      seen.add(k);
    }
    setSaving(true);
    setError(null);
    try {
      const input: TemplateInput = toTemplateInput(draft, items);
      let t: PriceTemplate;
      if (draft.templateId) {
        const body: TemplateUpdate = { ...input, expectedUpdatedAt: draft.updatedAt ?? undefined };
        t = await apiJson<PriceTemplate>(`/api/admin/pricing/templates/${draft.templateId}`, "PUT", body, "L'enregistrement de la fiche a échoué.");
      } else {
        t = await apiJson<PriceTemplate>("/api/admin/pricing/templates", "POST", input, "La création de la fiche a échoué.");
      }
      clearStoredSheetDraft();
      onSaved(t, !draft.templateId);
    } catch (e) {
      setError(errorText(e));
      setSaving(false);
    }
  }

  async function deleteSheet() {
    if (!draft.templateId) return;
    setDialog({ type: "deleteSheet", loading: true });
    try {
      await apiJson<{ ok: true }>(`/api/admin/pricing/templates/${draft.templateId}`, "DELETE", undefined, "La suppression a échoué.");
      clearStoredSheetDraft();
      onDeleted(draft.templateId);
    } catch (e) {
      // Already deleted (other tab, laptop): that's what she wanted.
      if (e instanceof ApiError && e.status === 404) {
        clearStoredSheetDraft();
        return onDeleted(draft.templateId);
      }
      setError(errorText(e));
      setDialog(null);
    }
  }

  // ---------- render ----------

  const footer = (
    <div className="space-y-2">
      {error && (
        <div className="max-h-[30vh] overflow-y-auto">
          <ApiErrorBox error={error} />
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0" aria-live="polite">
          {selected && current && (
            <>
              <span className="block text-xs text-gray-500 truncate">
                Prix · {selected.label.trim() || "taille sans nom"}
              </span>
              {current.problem ? (
                <span className="block text-sm font-semibold text-amber-700">Prix incomplet</span>
              ) : current.unfinished ? (
                <span className="block text-sm font-semibold text-amber-700">À compléter : heures et ingrédients</span>
              ) : (
                <span className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-rose-600 tabular-nums leading-tight">
                    {formatDA(current.priced.breakdown.finalPrice)}
                  </span>
                  {current.noHours && <span className="text-xs font-medium text-amber-700">0 h de travail ?</span>}
                </span>
              )}
            </>
          )}
        </div>
        <button type="button" onClick={save} disabled={saving || dialog?.type === "deleteSheet"} className={PRIMARY_BTN}>
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Enregistrer
        </button>
      </div>
    </div>
  );

  return (
    <>
      <Sheet
        title={template ? `Fiche ${quoted(template.name)}` : "Nouvelle fiche prix"}
        size="full"
        dirty={dirty}
        guardCloseButton
        onClose={() => !saving && close()}
        footer={footer}
      >
        <div
          ref={rootRef}
          className="bg-gray-50 min-h-full p-4 sm:p-5 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-5 lg:items-start"
        >
          <div className="space-y-4 min-w-0">
            {/* ---------- The sheet ---------- */}
            <section className={cn(CARD_CLASS, "p-4 space-y-3")}>
              <div>
                <label htmlFor="sheet-name" className={LABEL_CLASS}>Nom de la fiche</label>
                <input
                  id="sheet-name"
                  type="text"
                  value={draft.name}
                  onChange={(e) => update((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Ex : Number cake"
                  maxLength={100}
                  data-missing={draft.name.trim() === "" ? "true" : undefined}
                  className={cn(INPUT_CLASS, triedSave && !draft.name.trim() && "border-amber-300")}
                />
              </div>
              <div>
                <p className={LABEL_CLASS}>Gâteau du catalogue (optionnel)</p>
                <button
                  type="button"
                  onClick={() => setDialog({ type: "cake" })}
                  className="w-full flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 min-h-[56px] text-left hover:bg-gray-50 transition"
                >
                  <CakeThumb image={draft.cakeId ? cakeImage : undefined} size="sm" />
                  <span className="flex-1 min-w-0">
                    <span className={cn("block text-sm truncate", draft.cakeId ? "font-medium text-gray-800" : "text-gray-400")}>
                      {draft.cakeId ? cakeTitle ?? "Gâteau introuvable" : "Aucun gâteau"}
                    </span>
                    {draft.cakeId && !cake && (
                      <span className="block text-xs text-amber-700">N&apos;est plus dans le catalogue</span>
                    )}
                  </span>
                  <span className="text-sm font-medium text-rose-600 shrink-0 inline-flex items-center gap-0.5">
                    {draft.cakeId ? "Changer" : "Choisir"} <ChevronRight size={15} />
                  </span>
                </button>
              </div>
              <div>
                <label htmlFor="sheet-note" className={LABEL_CLASS}>Note (optionnel)</label>
                <textarea
                  id="sheet-note"
                  value={draft.note}
                  onChange={(e) => update((d) => ({ ...d, note: e.target.value }))}
                  rows={2}
                  maxLength={500}
                  placeholder="Ex : décor fondant, 2 étages au-delà de 20 parts"
                  className={cn(INPUT_CLASS, "resize-y")}
                />
              </div>
            </section>

            {/* ---------- Sizes ---------- */}
            <section className={cn(CARD_CLASS, "p-4 space-y-3")}>
              <div>
                <h2 className="font-semibold text-gray-800">Tailles</h2>
                <p className="text-xs text-gray-500 mt-0.5">Chaque taille a ses quantités, ses heures et son prix.</p>
              </div>
              <div role="tablist" aria-label="Tailles" className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
                {draft.variants.map((v) => {
                  const info = priced.get(v.id);
                  const active = v.id === selected?.id;
                  return (
                    <button
                      key={v.id}
                      id={`size-pill-${v.id}`}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => selectVariant(v.id)}
                      className={cn(
                        "relative shrink-0 min-w-[7rem] max-w-[11rem] min-h-[56px] rounded-xl border px-3 py-1.5 text-left transition",
                        active ? "bg-rose-500 border-rose-500 text-white shadow-sm" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <span className="block text-xs font-medium truncate">{v.label.trim() || "Sans nom"}</span>
                      {!info || info.problem || info.unfinished ? (
                        <span className={cn("flex items-center gap-1 text-xs font-semibold", active ? "text-white" : "text-amber-700")}>
                          <AlertTriangle size={12} className="shrink-0" /> à compléter
                        </span>
                      ) : (
                        <>
                          <span className={cn("block text-base font-bold tabular-nums leading-tight", active ? "text-white" : "text-rose-600")}>
                            {formatDA(info.priced.breakdown.finalPrice)}
                          </span>
                          {info.noHours && (
                            <span className={cn("block text-[11px] font-medium", active ? "text-white/90" : "text-amber-700")}>
                              0 h de travail ?
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setDialog({ type: "size", copyByDefault: false })}
                  disabled={!canAddSize}
                  className="shrink-0 min-h-[56px] inline-flex items-center gap-1.5 rounded-xl border border-dashed border-rose-200 px-3 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-40 transition"
                >
                  <Plus size={15} /> Taille
                </button>
              </div>
              {!canAddSize && <p className="text-xs text-gray-400">{MAX_SIZES} tailles au maximum par fiche.</p>}
              {draft.variants.length <= 1 && (
                <button
                  type="button"
                  onClick={() =>
                    selected && hasContent(selected) ? setDialog({ type: "standard" }) : createStandard(false)
                  }
                  className={cn(SECONDARY_BTN, "w-full")}
                >
                  <Layers size={15} /> Créer les 4 tailles standard
                </button>
              )}
              {notice && (
                <p role="status" className="flex items-start gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2">
                  <Check size={15} className="mt-0.5 shrink-0" /> {notice}
                </p>
              )}
            </section>

            {!selected || !current ? (
              <div className={cn(CARD_CLASS, "p-6 text-center")}>
                <p className="font-medium text-gray-700">Aucune taille</p>
                <p className="text-sm text-gray-400 mt-1">Ajoutez une taille, ou les 4 tailles standard, pour calculer un prix.</p>
              </div>
            ) : (
              <VariantEditor
                key={selected.id}
                v={selected}
                priced={current.priced}
                problem={current.problem}
                triedSave={triedSave}
                saved={savedIds.has(selected.id)}
                itemsById={itemsById}
                settings={settings}
                onLabel={(label) => updateVariant(selected.id, (v) => ({ ...v, label }))}
                onLabelDone={() => {
                  // « 11 à 15 parts » with no parts yet: take 15 from the label.
                  const n = partsFromLabel(selected.label);
                  if (n && selected.portionsRaw.trim() === "") {
                    updateVariant(selected.id, (v) => ({ ...v, portionsRaw: String(n) }));
                  }
                }}
                onParts={(portionsRaw) => updateVariant(selected.id, (v) => ({ ...v, portionsRaw }))}
                onHours={(hoursRaw) => updateVariant(selected.id, (v) => ({ ...v, hoursRaw }))}
                onLine={(key, patch) => updateLine(selected.id, key, patch)}
                onRemoveLine={(key) => removeLine(selected.id, key)}
                onAddVariable={() => setDialog({ type: "picker" })}
                onAddExtra={addExtra}
                onDuplicate={canAddSize ? () => setDialog({ type: "size", copyByDefault: true }) : undefined}
                onDelete={() => setDialog({ type: "deleteSize", variant: selected })}
              />
            )}

            {draft.templateId && (
              <div className="pt-2 pb-1 text-center">
                <button
                  type="button"
                  onClick={() => setDialog({ type: "deleteSheet", loading: false })}
                  className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition"
                >
                  <Trash2 size={14} /> Supprimer cette fiche
                </button>
              </div>
            )}
          </div>

          {/* ---------- Computer: price of the selected size, always in view ---------- */}
          {selected && current && (
            <aside className="hidden lg:block lg:sticky lg:top-0">
              <div className={cn(CARD_CLASS, "p-4")}>
                <h2 className="font-semibold text-gray-800 mb-2 truncate">Prix · {selected.label.trim() || "sans nom"}</h2>
                <PriceBreakdown
                  breakdown={current.priced.breakdown}
                  settings={settings}
                  hours={draftHours(selected)}
                  portions={draftPortions(selected)}
                  incomplete={current.problem}
                />
              </div>
            </aside>
          )}
        </div>
      </Sheet>

      {dialog?.type === "picker" && selected && (
        <VariablePicker
          items={items.filter((i) => i.kind === "variable")}
          usedIds={new Set(selected.lines.filter((l) => l.kind === "variable").map((l) => l.costItemId ?? ""))}
          usedLabel="déjà dans cette taille"
          onPick={addVariable}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.type === "cake" && (
        <CakePicker cakes={cakes} selectedId={draft.cakeId} onPick={pickCake} onClose={() => setDialog(null)} />
      )}
      {dialog?.type === "size" && (
        <SizeDialog
          source={selected}
          copyByDefault={dialog.copyByDefault}
          takenLabels={draft.variants.map((v) => v.label)}
          items={items}
          settings={settings}
          onCreate={createSize}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.type === "standard" && (
        <StandardSizesDialog
          variants={draft.variants}
          items={items}
          settings={settings}
          onCreate={createStandard}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.type === "deleteSize" && (
        <ConfirmDialog
          title={`Supprimer la taille ${quoted(dialog.variant.label.trim() || "sans nom")} ?`}
          confirmLabel="Supprimer"
          onConfirm={() => deleteSize(dialog.variant)}
          onCancel={() => setDialog(null)}
        >
          <p>
            {savedIds.has(dialog.variant.id)
              ? "Elle sera retirée de la fiche, avec son historique de prix, quand vous enregistrerez."
              : "Elle n'est pas encore enregistrée."}
          </p>
        </ConfirmDialog>
      )}
      {dialog?.type === "deleteSheet" && template && (
        <ConfirmDialog
          title="Supprimer cette fiche ?"
          confirmLabel="Supprimer"
          loading={dialog.loading}
          onConfirm={deleteSheet}
          onCancel={() => setDialog(null)}
        >
          <p>{quoted(template.name)} et son historique des prix seront supprimés.</p>
          <p className="text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
            Les devis déjà enregistrés ne changent pas, ni le gâteau du catalogue.
          </p>
        </ConfirmDialog>
      )}
    </>
  );
}

/** One size: its name, parts and hours, then the same sections as Calculer. */
function VariantEditor({
  v,
  priced,
  problem,
  triedSave,
  saved,
  itemsById,
  settings,
  onLabel,
  onLabelDone,
  onParts,
  onHours,
  onLine,
  onRemoveLine,
  onAddVariable,
  onAddExtra,
  onDuplicate,
  onDelete,
}: {
  v: VariantDraft;
  priced: PricedVariant;
  problem: string | null;
  triedSave: boolean;
  saved: boolean;
  itemsById: Map<string, CostItem>;
  settings: PricingSettings;
  onLabel: (s: string) => void;
  onLabelDone: () => void;
  onParts: (raw: string) => void;
  onHours: (raw: string) => void;
  onLine: (key: string, patch: Partial<DraftLine>) => void;
  onRemoveLine: (key: string) => void;
  onAddVariable: () => void;
  onAddExtra: () => void;
  onDuplicate?: () => void; // absent when the sheet already has the maximum of sizes
  onDelete: () => void;
}) {
  const b = priced.breakdown;
  const costByKey = new Map(b.lines.map((l) => [l.key, l]));
  // Rows show today's library price (the draft keeps what was loaded).
  const live = (l: DraftLine): DraftLine => {
    const item = l.costItemId ? itemsById.get(l.costItemId) : undefined;
    return item && item.kind === l.kind
      ? { ...l, name: item.name, price: item.price, priceQty: item.priceQty, unit: item.unit, customUnit: item.customUnit }
      : l;
  };
  const fixed = v.lines.filter((l) => l.kind === "fixed" && l.costItemId && itemsById.get(l.costItemId)?.kind === "fixed").map(live);
  const variable = v.lines.filter((l) => l.kind === "variable").map(live);
  const extras = v.lines.filter((l) => l.kind === "extra");
  const labelMissing = v.label.trim() === "";

  return (
    <>
      <section className={cn(CARD_CLASS, "p-4 space-y-3")}>
        <div>
          <label htmlFor={`size-label-${v.id}`} className={LABEL_CLASS}>Nom de la taille</label>
          <input
            id={`size-label-${v.id}`}
            type="text"
            value={v.label}
            onChange={(e) => onLabel(e.target.value)}
            onBlur={onLabelDone}
            placeholder="Ex : 11 à 15 parts"
            maxLength={60}
            data-missing={labelMissing ? "true" : undefined}
            className={cn(INPUT_CLASS, (triedSave || saved) && labelMissing && "border-amber-300")}
          />
          {labelMissing && <p className="text-xs text-amber-700 mt-1">Donnez un nom à cette taille.</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={`size-parts-${v.id}`} className={LABEL_CLASS}>Nombre de parts</label>
            <DecimalInput
              id={`size-parts-${v.id}`}
              value={v.portionsRaw}
              onChange={onParts}
              inputMode="numeric"
              suffix="parts"
              placeholder="Ex : 15"
              error={portionsError(v.portionsRaw)}
              missing={v.portionsRaw.trim() === ""}
            />
            {v.portionsRaw.trim() === "" && <p className="text-xs text-amber-700 mt-1">Indiquez le nombre de parts.</p>}
          </div>
          <HoursField id={`size-hours-${v.id}`} value={v.hoursRaw} onChange={onHours} />
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={onDuplicate}
            disabled={!onDuplicate}
            aria-label="Dupliquer cette taille pour une autre taille"
            className={cn(SECONDARY_BTN, "flex-1 sm:flex-none whitespace-nowrap")}
          >
            <CopyPlus size={15} className="shrink-0" /> Dupliquer
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition whitespace-nowrap"
          >
            <Trash2 size={14} className="shrink-0" /> Supprimer la taille
          </button>
        </div>
      </section>

      {/* ---------- Fixed costs ---------- */}
      <section className={CARD_CLASS}>
        <SectionHeader
          title="Coûts fixes"
          subtitle="Comptés dans chaque gâteau. Décochez ce qui ne sert pas pour cette taille."
          total={b.fixedTotal}
        />
        {fixed.length === 0 ? (
          <EmptyHint>Aucun coût fixe dans votre liste (onglet « Mes coûts »).</EmptyHint>
        ) : (
          <ul className="divide-y divide-gray-100">
            {fixed.map((l) => (
              <FixedLineRow
                key={l.key}
                line={l}
                cost={l.included ? costByKey.get(l.key)?.cost ?? 0 : lineCost(toQuoteLine(l)).cost}
                onToggle={() => onLine(l.key, { included: !l.included })}
                onQtyChange={(qtyRaw) => onLine(l.key, { qtyRaw })}
              />
            ))}
          </ul>
        )}
      </section>

      {/* ---------- Variable costs ---------- */}
      <section className={CARD_CLASS}>
        <SectionHeader
          title="Coûts variables"
          subtitle="Ingrédients et fournitures pour cette taille, toujours au prix du jour."
          total={b.variableTotal}
        />
        {variable.length === 0 ? (
          <EmptyHint>Ajoutez ce que vous utilisez pour cette taille : amandes, chocolat, ruban…</EmptyHint>
        ) : (
          <ul className="divide-y divide-gray-100">
            {variable.map((l) => {
              const lc = costByKey.get(l.key);
              return (
                <VariableLineRow
                  key={l.key}
                  line={l}
                  cost={lc?.cost ?? 0}
                  error={lc?.error}
                  blocked={blockedReason(l, itemsById) ?? undefined}
                  onQtyChange={(qtyRaw) => onLine(l.key, { qtyRaw })}
                  onUnitChange={(qtyUnit) => onLine(l.key, { qtyUnit })}
                  onRemove={() => onRemoveLine(l.key)}
                />
              );
            })}
          </ul>
        )}
        <div className="p-3 border-t border-gray-100">
          <AddLineButton tone="rose" onClick={onAddVariable}>Ajouter un coût variable</AddLineButton>
        </div>
      </section>

      {/* ---------- Extras ---------- */}
      <section className={CARD_CLASS}>
        <SectionHeader
          title="Extras"
          subtitle="Un achat propre à ce gâteau (topper, fleurs fraîches…) : montant fixe, à mettre à jour vous-même."
          total={b.extrasTotal}
        />
        {extras.length > 0 && (
          <ul className="divide-y divide-gray-100">
            {extras.map((l) => (
              <ExtraLineRow
                key={l.key}
                line={l}
                onNameChange={(name) => onLine(l.key, { name })}
                onAmountChange={(amountRaw) => onLine(l.key, { amountRaw })}
                onRemove={() => onRemoveLine(l.key)}
              />
            ))}
          </ul>
        )}
        <div className={cn("p-3", extras.length > 0 && "border-t border-gray-100")}>
          <AddLineButton onClick={onAddExtra}>Ajouter un extra</AddLineButton>
        </div>
      </section>

      {/* ---------- Phone: detail of the price (the total is in the footer) ---------- */}
      <section className={cn(CARD_CLASS, "p-4 lg:hidden")}>
        <h2 className="font-semibold text-gray-800 mb-2 truncate">Prix · {v.label.trim() || "sans nom"}</h2>
        <PriceBreakdown
          breakdown={b}
          settings={settings}
          hours={draftHours(v)}
          portions={draftPortions(v)}
          incomplete={problem}
        />
      </section>
    </>
  );
}
