"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, Check, ClipboardList, Copy, FilePlus2, History, MoreHorizontal, Pencil, Plus, RotateCcw,
  Search, Settings2, Wrench,
} from "lucide-react";
import type { CostItem, PriceTemplate, PricingSettings, TemplatePriceChange, TemplateVariant } from "@/lib/pricing-types";
import { formatDA } from "@/lib/pricing-units";
import { cn } from "@/lib/utils";
import { apiJson, errorText } from "./api";
import { formatDateTime, quoted, searchKey } from "./format";
import { CakeThumb } from "./SheetDialogs";
import SheetEditor, { clearStoredSheetDraft } from "./SheetEditor";
import SheetHistory, { changeSentence, LatestChangeHint, type ChangeSummary, type HistoryState } from "./SheetHistory";
import {
  brokenSheets, liveKey, parseStoredSheetDraft, SHEET_DRAFT_KEY, sizeTitle, unfinishedText, type CakeOption,
  type LiveSize, type StoredSheetDraft,
} from "./sheet-draft";
import { Banner, CARD_CLASS, ConfirmDialog, ErrorBox, INPUT_CLASS, PRIMARY_BTN, SECONDARY_BTN, Sheet } from "./ui";

interface Props {
  templates: PriceTemplate[];
  templatesRev: number; // bumped whenever the server may have repriced the sheets
  live: Map<string, LiveSize>; // every size priced with today's costs (see liveSizes)
  items: CostItem[];
  settings: PricingSettings;
  cakes: CakeOption[];
  onSaved: (t: PriceTemplate) => void;
  onDeleted: (id: string) => void;
  onUseForQuote: (t: PriceTemplate, v: TemplateVariant) => void;
  onEditorDirtyChange: (dirty: boolean) => void;
  goTo: (tab: "costs" | "settings") => void;
}

type EditorState = {
  template: PriceTemplate | null;
  variantId?: string;
  restored?: StoredSheetDraft;
  focusProblem?: boolean;
};

/** Clipboard API when allowed (https / localhost), the old textarea trick otherwise. */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* refused: try the fallback */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export default function PriceSheets({
  templates, templatesRev, live, items, settings, cakes, onSaved, onDeleted, onUseForQuote,
  onEditorDirtyChange, goTo,
}: Props) {
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [historyFor, setHistoryFor] = useState<{ templateId: string; variantId?: string } | null>(null);
  const [histories, setHistories] = useState<Record<string, HistoryState>>({});
  const [actionsFor, setActionsFor] = useState<{ templateId: string; variantId: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [copyFailed, setCopyFailed] = useState<string | null>(null);
  const [flash, setFlash] = useState("");
  const [highlight, setHighlight] = useState<string | null>(null);
  const [stored, setStored] = useState<StoredSheetDraft | null>(null);
  const [confirmDropStored, setConfirmDropStored] = useState(false);
  const requests = useRef(new Map<string, number>());

  const cakesById = useMemo(() => new Map(cakes.map((c) => [c.id, c])), [cakes]);
  const broken = useMemo(() => brokenSheets(templates, live), [templates, live]);

  // An editor left unsaved (reload, expired session): offer to pick it up again.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SHEET_DRAFT_KEY);
      setStored(raw ? parseStoredSheetDraft(JSON.parse(raw)) : null);
    } catch {
      /* storage unavailable or corrupt: nothing to offer */
    }
  }, []);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(null), 2500);
    return () => clearTimeout(t);
  }, [copied]);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(""), 5000);
    return () => clearTimeout(t);
  }, [flash]);

  useEffect(() => {
    if (!highlight) return;
    const raf = requestAnimationFrame(() =>
      document.getElementById(`sheet-${highlight}`)?.scrollIntoView({ block: "center", behavior: "smooth" })
    );
    const t = setTimeout(() => setHighlight(null), 2500);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [highlight]);

  async function loadHistory(id: string) {
    const n = (requests.current.get(id) ?? 0) + 1;
    requests.current.set(id, n);
    setHistories((h) => ({ ...h, [id]: { status: "loading" } }));
    let next: HistoryState;
    try {
      const entries = await apiJson<TemplatePriceChange[]>(
        `/api/admin/pricing/templates/${id}/history`,
        "GET",
        undefined,
        "Impossible de charger l'historique."
      );
      next = { status: "ok", entries };
    } catch (e) {
      next = { status: "error", text: errorText(e).text };
    }
    // A newer request (after a save or a cost change) wins.
    if (requests.current.get(id) === n) setHistories((h) => ({ ...h, [id]: next }));
  }

  // Sheets were repriced on the server: the histories we have are out of date.
  const firstRev = useRef(templatesRev);
  useEffect(() => {
    if (templatesRev === firstRev.current) return;
    firstRev.current = templatesRev;
    setHistories({});
    if (historyFor) void loadHistory(historyFor.templateId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templatesRev]);

  function openHistory(templateId: string, variantId?: string) {
    setActionsFor(null);
    setHistoryFor({ templateId, variantId });
    if (histories[templateId]?.status !== "ok") void loadHistory(templateId);
  }

  async function copy(t: PriceTemplate, v: TemplateVariant, price: number) {
    const text = `${t.name} — ${sizeTitle(v)} : ${formatDA(price)}`;
    if (await copyText(text)) {
      setCopied(liveKey(t.id, v.id));
      setCopyFailed(null);
    } else {
      setCopyFailed(text);
    }
  }

  /** Last change of a size: from the server listing, or the history if it's newer. */
  function lastChange(t: PriceTemplate, v: TemplateVariant): ChangeSummary | undefined {
    const h = histories[t.id];
    const fromHistory = h?.status === "ok" ? h.entries.find((e) => e.variantId === v.id) : undefined;
    if (!fromHistory) return v.lastChange;
    if (!v.lastChange) return fromHistory;
    return fromHistory.at > v.lastChange.at ? fromHistory : v.lastChange;
  }

  function resumeStored() {
    if (!stored) return;
    const template = stored.draft.templateId ? templates.find((t) => t.id === stored.draft.templateId) : undefined;
    const draft = {
      ...stored.draft,
      // Deleted meanwhile: saved as a new sheet. Changed meanwhile: her version wins.
      templateId: template ? template.id : null,
      updatedAt: template ? template.updatedAt : null,
    };
    setEditor({ template: template ?? null, restored: { ...stored, draft } });
    setStored(null);
  }

  function openEditor(state: EditorState) {
    setActionsFor(null);
    // Only one unsaved sheet is kept on the phone: opening another replaces it.
    setStored(null);
    setEditor(state);
  }

  const q = searchKey(query);
  const list = templates
    .filter((t) => {
      if (!q) return true;
      const cake = t.cakeId ? cakesById.get(t.cakeId)?.title ?? t.cakeTitle : t.cakeTitle;
      return searchKey(`${t.name} ${cake ?? ""} ${t.note ?? ""} ${t.variants.map((v) => v.label).join(" ")}`).includes(q);
    })
    .sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base", numeric: true }));

  const historyTemplate = historyFor ? templates.find((t) => t.id === historyFor.templateId) : undefined;
  const actionTemplate = actionsFor ? templates.find((t) => t.id === actionsFor.templateId) : undefined;
  const actionVariant = actionTemplate?.variants.find((v) => v.id === actionsFor?.variantId);
  const storedTemplate = stored?.draft.templateId ? templates.find((t) => t.id === stored.draft.templateId) : undefined;

  return (
    <div className="space-y-4">
      {/* Search first: at the WhatsApp moment she's looking for one cake. */}
      {templates.length > 2 && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une fiche…"
              aria-label="Rechercher une fiche"
              className={cn(INPUT_CLASS, "pl-9")}
            />
          </div>
          <button type="button" onClick={() => openEditor({ template: null })} className={PRIMARY_BTN} aria-label="Nouvelle fiche">
            <Plus size={15} className="shrink-0" /> <span className="hidden sm:inline">Nouvelle fiche</span>
          </button>
        </div>
      )}

      {stored && (
        <Banner tone="rose" icon={<RotateCcw size={16} />}>
          <p className="font-medium">
            Fiche non enregistrée : {quoted(stored.draft.name.trim() || "sans nom")}
          </p>
          <p className="text-xs mt-0.5">
            Modifiée le {formatDateTime(stored.savedAt)}, avant un rechargement de la page ou une déconnexion.
            {storedTemplate && storedTemplate.updatedAt !== stored.draft.updatedAt &&
              " La fiche a changé depuis : vos modifications la remplaceront."}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={resumeStored} className={PRIMARY_BTN}>
              Reprendre
            </button>
            <button type="button" onClick={() => setConfirmDropStored(true)} className={SECONDARY_BTN}>
              Abandonner
            </button>
          </div>
        </Banner>
      )}

      {broken.length > 0 && (
        <Banner tone="amber" icon={<AlertTriangle size={16} />}>
          <p className="font-medium">
            {broken.length > 1 ? `${broken.length} fiches à corriger` : "1 fiche à corriger"}
          </p>
          <p className="text-xs mt-0.5">
            {broken.map((t) => t.name).join(", ")} : un coût utilisé a été supprimé ou a changé d&apos;unité. Touchez
            « Corriger » sur la taille concernée.
          </p>
        </Banner>
      )}

      {settings.hourlyRate <= 0 && templates.length > 0 && (
        <Banner tone="amber" icon={<Settings2 size={16} />}>
          <p className="font-medium">Votre taux horaire n&apos;est pas défini</p>
          <p className="text-xs mt-0.5">Les prix des fiches ne comptent pas encore votre temps de travail.</p>
          <button type="button" onClick={() => goTo("settings")} className="mt-2 text-sm font-semibold underline underline-offset-2 min-h-[40px]">
            Aller aux réglages
          </button>
        </Banner>
      )}

      {templates.length === 0 ? (
        <div className={cn(CARD_CLASS, "text-center py-10 px-5")}>
          <ClipboardList size={28} className="mx-auto text-gray-300 mb-2" />
          <p className="font-semibold text-gray-700">Aucune fiche prix pour l&apos;instant</p>
          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
            Une fiche, c&apos;est le calcul d&apos;un gâteau que vous faites souvent, en plusieurs tailles
            (10 parts, 15 parts…).
          </p>
          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
            Son prix se met à jour tout seul quand vos coûts ou vos réglages changent. Quand une cliente
            demande « combien pour 15 parts ? », la réponse est prête : un geste pour la copier.
          </p>
          <button type="button" onClick={() => openEditor({ template: null })} className={cn(PRIMARY_BTN, "mt-5")}>
            <Plus size={15} /> Créer ma première fiche
          </button>
          {items.length === 0 && (
            <p className="text-xs text-gray-400 mt-3">
              Conseil : ajoutez d&apos;abord vos coûts dans{" "}
              <button type="button" onClick={() => goTo("costs")} className="text-rose-600 font-medium underline underline-offset-2">
                Mes coûts
              </button>
              .
            </p>
          )}
        </div>
      ) : (
        <>
          {templates.length <= 2 && (
            <div className="flex justify-end">
              <button type="button" onClick={() => openEditor({ template: null })} className={PRIMARY_BTN}>
                <Plus size={15} /> Nouvelle fiche
              </button>
            </div>
          )}

          {flash && (
            <p role="status" className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3">
              <Check size={15} /> {flash}
            </p>
          )}
          {copyFailed && (
            <ErrorBox>
              <p>La copie automatique n&apos;a pas marché. Appuyez longuement sur le texte pour le copier :</p>
              <p className="mt-2 select-all rounded-lg bg-white px-3 py-2 text-gray-800">{copyFailed}</p>
            </ErrorBox>
          )}

          {list.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-6">Aucune fiche ne correspond à {quoted(query)}.</p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
              {list.map((t) => {
                const cake = t.cakeId ? cakesById.get(t.cakeId) : undefined;
                return (
                  <article
                    key={t.id}
                    id={`sheet-${t.id}`}
                    className={cn(CARD_CLASS, "overflow-hidden transition-colors duration-700", highlight === t.id && "bg-emerald-50")}
                  >
                    <div className="flex items-center gap-3 pl-4 pr-2 pt-3 pb-2">
                      <CakeThumb image={cake?.image ?? t.cakeImage} />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate">{t.name}</h3>
                        {(cake?.title ?? t.cakeTitle) && (
                          <p className="text-xs text-gray-400 truncate">{cake?.title ?? t.cakeTitle}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => openEditor({ template: t })}
                        className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition shrink-0"
                      >
                        <Pencil size={14} className="shrink-0" /> Modifier
                      </button>
                    </div>
                    {t.note && <p className="px-4 pb-1 text-xs text-gray-500 italic">{t.note}</p>}

                    <ul className="divide-y divide-gray-100 border-t border-gray-100">
                      {t.variants.map((v) => (
                        <SizeRow
                          key={v.id}
                          v={v}
                          size={live.get(liveKey(t.id, v.id))}
                          change={lastChange(t, v)}
                          copied={copied === liveKey(t.id, v.id)}
                          onCopy={(price) => void copy(t, v, price)}
                          onMore={() => setActionsFor({ templateId: t.id, variantId: v.id })}
                          onHistory={() => openHistory(t.id, v.id)}
                          onFix={(focusProblem) => openEditor({ template: t, variantId: v.id, focusProblem })}
                        />
                      ))}
                    </ul>

                    <div className="border-t border-gray-100 px-2 py-1">
                      <button
                        type="button"
                        onClick={() => openHistory(t.id)}
                        className="inline-flex items-center gap-1.5 min-h-[40px] px-2 text-sm font-medium text-gray-500 hover:text-rose-600"
                      >
                        <History size={14} /> Historique des prix
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {editor && (
        <SheetEditor
          template={editor.template}
          initialVariantId={editor.variantId}
          restored={editor.restored}
          focusProblemOnOpen={editor.focusProblem}
          items={items}
          settings={settings}
          cakes={cakes}
          onDirtyChange={onEditorDirtyChange}
          onSaved={(t, created) => {
            onSaved(t);
            setEditor(null);
            setFlash(created ? `Fiche ${quoted(t.name)} créée.` : `Fiche ${quoted(t.name)} enregistrée.`);
            setHighlight(t.id);
            if (q && !searchKey(t.name).includes(q)) setQuery("");
          }}
          onDeleted={(id) => {
            onDeleted(id);
            setEditor(null);
            setFlash("Fiche supprimée.");
          }}
          onClose={() => setEditor(null)}
        />
      )}

      {actionTemplate && actionVariant && (
        <SizeActions
          template={actionTemplate}
          v={actionVariant}
          size={live.get(liveKey(actionTemplate.id, actionVariant.id))}
          change={lastChange(actionTemplate, actionVariant)}
          copied={copied === liveKey(actionTemplate.id, actionVariant.id)}
          onCopy={(price) => void copy(actionTemplate, actionVariant, price)}
          onQuote={() => {
            setActionsFor(null);
            onUseForQuote(actionTemplate, actionVariant);
          }}
          onHistory={() => openHistory(actionTemplate.id, actionVariant.id)}
          onEdit={() => openEditor({ template: actionTemplate, variantId: actionVariant.id })}
          onClose={() => setActionsFor(null)}
        />
      )}

      {historyFor && historyTemplate && (
        <SheetHistory
          template={historyTemplate}
          state={histories[historyTemplate.id] ?? { status: "loading" }}
          initialVariantId={historyFor.variantId}
          onRetry={() => void loadHistory(historyTemplate.id)}
          onClose={() => setHistoryFor(null)}
        />
      )}

      {confirmDropStored && stored && (
        <ConfirmDialog
          title="Abandonner cette fiche non enregistrée ?"
          confirmLabel="Abandonner"
          onConfirm={() => {
            clearStoredSheetDraft();
            setStored(null);
            setConfirmDropStored(false);
          }}
          onCancel={() => setConfirmDropStored(false)}
        >
          <p>Les modifications de {quoted(stored.draft.name.trim() || "cette fiche")} seront perdues.</p>
        </ConfirmDialog>
      )}
    </div>
  );
}

/** One size in the list, one line: label left, price + copy right (≈ 56 px). */
function SizeRow({
  v,
  size,
  change,
  copied,
  onCopy,
  onMore,
  onHistory,
  onFix,
}: {
  v: TemplateVariant;
  size: LiveSize | undefined;
  change: ChangeSummary | undefined;
  copied: boolean;
  onCopy: (price: number) => void;
  onMore: () => void;
  onHistory: () => void;
  onFix: (focusProblem: boolean) => void;
}) {
  const parts = v.portions && !/\d/.test(v.label) ? ` · ${v.portions} parts` : "";
  const state = size?.state;
  const b = size?.priced.breakdown;

  if (!size || !state || state.kind !== "ok" || !b) {
    const brokenState = state?.kind === "broken" ? state : null;
    return (
      <li className="flex items-center gap-2 pl-4 pr-2 py-1.5 min-h-[56px]">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">
            {v.label}
            {parts}
          </p>
          <p className={cn("text-xs truncate", brokenState ? "text-amber-700" : "text-gray-400")}>
            {brokenState ? `À corriger : ${brokenState.culprits.join(", ")}` : `À compléter : ${unfinishedText(v)}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onFix(!!brokenState)}
          className={cn(
            "inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-xl text-sm font-medium transition shrink-0",
            brokenState ? "bg-amber-500 text-white hover:bg-amber-600" : "border border-gray-200 text-gray-600 hover:bg-gray-50"
          )}
        >
          {brokenState ? <Wrench size={14} className="shrink-0" /> : <Pencil size={14} className="shrink-0" />}
          {brokenState ? "Corriger" : "Compléter"}
        </button>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-1 pl-4 pr-1 py-1.5 min-h-[56px]">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">
          {v.label}
          {parts}
        </p>
        <div className="flex items-center gap-2 min-w-0">
          {state.noHours && <span className="text-xs font-medium text-amber-700 whitespace-nowrap">0 h de travail ?</span>}
          {change && (
            <button
              type="button"
              onClick={onHistory}
              aria-label={`Historique des prix : ${v.label}. ${changeSentence(change)}`}
              className="min-w-0 truncate text-left py-2 -my-2 hover:opacity-80"
            >
              <LatestChangeHint entry={change} />
            </button>
          )}
        </div>
      </div>
      <div className="text-right shrink-0 pr-1">
        <p className="text-lg font-bold text-rose-600 tabular-nums leading-tight">{formatDA(b.finalPrice)}</p>
        {b.pricePerPortion !== null && (
          <p className="text-[11px] text-gray-400 tabular-nums">{formatDA(b.pricePerPortion)} / part</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onCopy(b.finalPrice)}
        aria-label={copied ? "Prix copié" : `Copier le prix : ${v.label}`}
        className={cn(
          "inline-flex items-center justify-center w-10 h-10 rounded-xl transition shrink-0",
          copied ? "bg-emerald-500 text-white" : "bg-rose-50 text-rose-600 hover:bg-rose-100"
        )}
      >
        {copied ? <Check size={17} /> : <Copy size={17} />}
      </button>
      <button
        type="button"
        onClick={onMore}
        aria-label={`Plus d'actions : ${v.label}`}
        className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition shrink-0"
      >
        <MoreHorizontal size={18} />
      </button>
    </li>
  );
}

/** « ⋯ » of a size: what doesn't fit in the row, as big thumb-sized buttons. */
function SizeActions({
  template,
  v,
  size,
  change,
  copied,
  onCopy,
  onQuote,
  onHistory,
  onEdit,
  onClose,
}: {
  template: PriceTemplate;
  v: TemplateVariant;
  size: LiveSize | undefined;
  change: ChangeSummary | undefined;
  copied: boolean;
  onCopy: (price: number) => void;
  onQuote: () => void;
  onHistory: () => void;
  onEdit: () => void;
  onClose: () => void;
}) {
  const b = size?.state.kind === "ok" ? size.priced.breakdown : null;
  const action = "w-full flex items-center gap-3 px-5 min-h-[52px] text-left text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition";
  return (
    <Sheet title={`${template.name} — ${sizeTitle(v)}`} onClose={onClose}>
      {b && (
        <div className="px-5 pt-4 pb-2">
          <p className="text-2xl font-bold text-rose-600 tabular-nums">{formatDA(b.finalPrice)}</p>
          <p className="text-xs text-gray-500">
            {b.pricePerPortion !== null && `${formatDA(b.pricePerPortion)} / part`}
            {size?.state.kind === "ok" && size.state.noHours && (
              <span className="text-amber-700"> · 0 h de travail ?</span>
            )}
          </p>
          {change && <p className="text-xs text-gray-400 mt-0.5">{changeSentence(change)}</p>}
        </div>
      )}
      <ul className="py-2">
        {b && (
          <li>
            <button type="button" onClick={() => onCopy(b.finalPrice)} className={action}>
              {copied ? <Check size={17} className="text-emerald-600 shrink-0" /> : <Copy size={17} className="text-rose-500 shrink-0" />}
              {copied ? "Copié ✓" : "Copier le prix"}
            </button>
          </li>
        )}
        {b && (
          <li>
            <button type="button" onClick={onQuote} className={action}>
              <FilePlus2 size={17} className="text-gray-400 shrink-0" /> Faire un devis
            </button>
          </li>
        )}
        <li>
          <button type="button" onClick={onHistory} className={action}>
            <History size={17} className="text-gray-400 shrink-0" /> Historique des prix
          </button>
        </li>
        <li>
          <button type="button" onClick={onEdit} className={action}>
            <Pencil size={17} className="text-gray-400 shrink-0" /> Modifier cette taille
          </button>
        </li>
      </ul>
    </Sheet>
  );
}
