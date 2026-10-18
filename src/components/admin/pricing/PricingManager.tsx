"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Calculator, Check, ClipboardList, FileText, Settings2, Wallet, X, type LucideIcon } from "lucide-react";
import { computePrice } from "@/lib/pricing-formula";
import type { CostItem, PriceQuote, PriceTemplate, PricingSettings, TemplateVariant } from "@/lib/pricing-types";
import { priceVariant } from "@/lib/pricing-templates";
import { formatDA } from "@/lib/pricing-units";
import { cn } from "@/lib/utils";
import { apiJson } from "./api";
import CostLibrary from "./CostLibrary";
import {
  draftFromLines, draftFromQuote, draftHours, draftPortions, draftProblems, isStale, newDraft,
  parseStoredDraft, pickSettings, problemsText, reconcileFixed, refreshLine, refreshStale, sameSettings,
  toQuoteLines, type CalcDraft,
} from "./draft";
import { quoted } from "./format";
import PriceCalculator from "./PriceCalculator";
import PriceSheets from "./PriceSheets";
import PricingSettingsForm from "./PricingSettingsForm";
import SavedQuotes from "./SavedQuotes";
import { brokenSheets, liveSizes, type CakeOption } from "./sheet-draft";
import { ConfirmDialog, useBeforeUnload } from "./ui";

export type PricingTab = "calc" | "sheets" | "costs" | "quotes" | "settings";
type Tab = PricingTab;

const TABS: Array<{ id: Tab; label: string; icon: LucideIcon }> = [
  { id: "calc", label: "Calculer", icon: Calculator },
  { id: "sheets", label: "Fiches", icon: ClipboardList },
  { id: "costs", label: "Mes coûts", icon: Wallet },
  { id: "quotes", label: "Devis", icon: FileText },
  { id: "settings", label: "Réglages", icon: Settings2 },
];

export const isPricingTab = (v: unknown): v is Tab => TABS.some((t) => t.id === v);

// Survives a phone tab reload so an in-progress calculation isn't lost.
const STORAGE_KEY = "gp-admin-pricing-draft-v1";
// Last tab, for a reload or a login in the middle of something. Older than
// this, the page opens on its default (Fiches) again.
const TAB_KEY = "gp-admin-pricing-tab-v1";
const TAB_MEMORY_MS = 30 * 60 * 1000;
// Coming back to the tab (phone unlocked, app switched): reload prices if older than this.
const SYNC_EVERY_MS = 30 * 1000;
const QUOTE_NAME_MAX = 100; // server limit for a devis name

interface Props {
  initialItems: CostItem[];
  initialSettings: PricingSettings;
  initialQuotes: PriceQuote[];
  initialTemplates: PriceTemplate[];
  cakes: CakeOption[];
  /** From ?tab= or the default chosen by the page (Fiches when there are sheets). */
  initialTab: Tab;
  /** True when the URL named the tab: then the remembered tab doesn't override it. */
  tabFromUrl: boolean;
}

/** Sheets whose stored price moved between two listings (the server repriced them). */
function countRepriced(before: PriceTemplate[], after: PriceTemplate[]): number {
  const old = new Map(before.flatMap((t) => t.variants.map((v) => [`${t.id}:${v.id}`, v.priced?.finalPrice])));
  return after.filter((t) =>
    t.variants.some((v) => {
      const prev = old.get(`${t.id}:${v.id}`);
      return prev !== undefined && v.priced !== undefined && prev !== v.priced.finalPrice;
    })
  ).length;
}

export default function PricingManager({
  initialItems, initialSettings, initialQuotes, initialTemplates, cakes, initialTab, tabFromUrl,
}: Props) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [items, setItems] = useState(initialItems);
  const [settings, setSettings] = useState(initialSettings);
  const [quotes, setQuotes] = useState(initialQuotes);
  const [templates, setTemplates] = useState(initialTemplates);
  const [templatesRev, setTemplatesRev] = useState(0);
  const [draft, setDraft] = useState<CalcDraft>(() => newDraft(initialItems, initialSettings));
  const [restored, setRestored] = useState(false);
  const [pendingOpen, setPendingOpen] = useState<PriceQuote | null>(null);
  const [pendingSheet, setPendingSheet] = useState<{ template: PriceTemplate; variant: TemplateVariant } | null>(null);
  const [repricedNotice, setRepricedNotice] = useState<number | null>(null);
  const [sheetEditorDirty, setSheetEditorDirty] = useState(false);
  const [saveRequest, setSaveRequest] = useState(0);
  const templatesReq = useRef(0);
  const lastSync = useRef(Date.now());

  // Every size priced with today's costs: the list, the tab dot and the banners use it.
  const live = useMemo(() => liveSizes(templates, items, settings), [templates, items, settings]);
  const brokenCount = useMemo(() => brokenSheets(templates, live).length, [templates, live]);

  // Reload / closing the tab with an unsaved calculation: the browser asks first.
  useBeforeUnload(restored && draft.dirty);

  // Restore after mount (localStorage doesn't exist during the server render).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const saved = raw ? parseStoredDraft(JSON.parse(raw), initialSettings) : null;
      const quote = saved?.quoteId ? initialQuotes.find((q) => q.id === saved.quoteId) : undefined;
      if (!saved) {
        /* nothing stored: keep the fresh calculation */
      } else if (saved.quoteId && quote) {
        setDraft(
          saved.dirty
            ? // Her unsaved edits win; the "modifié ailleurs" banner compares
              // quoteUpdatedAt with the server's copy.
              reconcileFixed({ ...saved, quoteUpdatedAt: saved.quoteUpdatedAt ?? quote.updatedAt }, initialItems)
            : // Nothing to keep: show the devis as it is now on the server.
              draftFromQuote(quote, initialItems, initialSettings)
        );
      } else if (saved.quoteId) {
        // Deleted meanwhile: keep what was on screen as an unsaved calculation.
        setDraft(reconcileFixed({ ...saved, quoteId: null, quoteUpdatedAt: null, dirty: true }, initialItems));
      } else if (saved.dirty) {
        // A new calculation always uses the current settings.
        setDraft(reconcileFixed({ ...saved, settings: pickSettings(initialSettings) }, initialItems));
      }
      // An untouched new calculation is simply rebuilt from today's prices.
    } catch {
      /* storage unavailable or corrupt: start fresh */
    }
    // Back on the tab she was using a moment ago (reload, new login).
    if (!tabFromUrl) {
      try {
        const raw = window.localStorage.getItem(TAB_KEY);
        const t = raw ? (JSON.parse(raw) as { tab?: unknown; at?: unknown }) : null;
        if (t && isPricingTab(t.tab) && typeof t.at === "number" && Date.now() - t.at < TAB_MEMORY_MS) {
          setTab(t.tab);
        }
      } catch {
        /* keep the default tab */
      }
    }
    setRestored(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* private mode / quota: the calculation just won't survive a reload */
    }
  }, [draft, restored]);

  // The tab lives in the URL (?tab=) and in localStorage, so a reload or a
  // login comes back to it.
  useEffect(() => {
    if (!restored) return;
    try {
      window.localStorage.setItem(TAB_KEY, JSON.stringify({ tab, at: Date.now() }));
    } catch {
      /* not remembered */
    }
    const url = new URL(window.location.href);
    if (url.searchParams.get("tab") !== tab) {
      url.searchParams.set("tab", tab);
      // Same history entry: switching tabs doesn't fill the back button.
      window.history.replaceState(window.history.state, "", url);
    }
  }, [tab, restored]);

  useEffect(() => {
    if (repricedNotice === null) return;
    const t = setTimeout(() => setRepricedNotice(null), 10000);
    return () => clearTimeout(t);
  }, [repricedNotice]);

  function goTo(next: Tab) {
    setTab(next);
    document.querySelector("main")?.scrollTo({ top: 0 });
  }

  function openQuote(q: PriceQuote) {
    setPendingOpen(null);
    setDraft(draftFromQuote(q, items, settings));
    goTo("calc");
  }

  /**
   * The server reprices the sheets when a cost or the settings change, and
   * records why: reload them so their snapshots and histories are current.
   * (Live prices already follow `items` / `settings`.) `announce`: say how
   * many sheets moved, after one of her own changes.
   */
  async function refreshTemplates(announce: boolean) {
    const n = ++templatesReq.current;
    const before = templates;
    try {
      const next = await apiJson<PriceTemplate[]>("/api/admin/pricing/templates", "GET", undefined, "");
      if (n !== templatesReq.current) return; // a newer refresh is on its way
      setTemplates(next);
      setTemplatesRev((r) => r + 1);
      if (announce) {
        const count = countRepriced(before, next);
        setRepricedNotice(count > 0 ? count : null);
      }
    } catch (e) {
      // Not worth an error on screen: prices shown are computed live anyway.
      console.error("[pricing] refresh templates", e);
    }
  }

  function handleTemplateSaved(t: PriceTemplate) {
    templatesReq.current++; // an older refresh must not bring back the previous version
    setTemplates((prev) => (prev.some((x) => x.id === t.id) ? prev.map((x) => (x.id === t.id ? t : x)) : [...prev, t]));
    setTemplatesRev((r) => r + 1);
  }

  function handleTemplateDeleted(id: string) {
    templatesReq.current++;
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  /** A size of a sheet becomes a new, unsaved calculation in Calculer. */
  function startQuoteFromSheet(template: PriceTemplate, variant: TemplateVariant) {
    setPendingSheet(null);
    const priced = priceVariant(variant, items, settings, "");
    setDraft(
      draftFromLines(
        {
          name: `${template.name} — ${variant.label}`.slice(0, QUOTE_NAME_MAX),
          hours: variant.hours,
          portions: variant.portions,
          lines: priced.lines,
        },
        items,
        settings
      )
    );
    goTo("calc");
  }

  /** A new (unsaved) calculation follows the library; an opened devis keeps its snapshot. */
  function followLibrary(next: CostItem[]) {
    setDraft((d) => {
      if (d.quoteId !== null) return d;
      const byId = new Map(next.map((i) => [i.id, i]));
      const lines = d.lines.filter((l) => !(l.kind === "fixed" && l.costItemId && !byId.has(l.costItemId)));
      const stale = lines.some((l) => {
        const item = l.costItemId ? byId.get(l.costItemId) : undefined;
        return !!item && isStale(l, item);
      });
      let out: CalcDraft = lines.length !== d.lines.length || stale ? refreshStale({ ...d, lines }, next) : d;
      out = reconcileFixed(out, next);
      return out === d ? d : { ...out, rev: d.rev + 1 };
    });
  }

  function followSettings(next: PricingSettings) {
    // A new calculation follows the settings; an opened devis keeps its own
    // and offers « Appliquer les réglages actuels ».
    setDraft((d) =>
      d.quoteId === null && !sameSettings(d.settings, next) ? { ...d, settings: pickSettings(next), rev: d.rev + 1 } : d
    );
  }

  function handleItemSaved(item: CostItem, created: boolean) {
    setItems((prev) => (created ? [...prev, item] : prev.map((i) => (i.id === item.id ? item : i))));
    setDraft((d) => {
      const next =
        d.quoteId === null
          ? {
              ...d,
              rev: d.rev + 1,
              lines: d.lines
                // unticked fixed cost that became variable: not used in this cake
                .filter((l) => !(l.costItemId === item.id && !l.included && item.kind === "variable" && l.kind !== "variable"))
                .map((l) => (l.costItemId === item.id ? refreshLine(l, item) : l)),
            }
          : d;
      return reconcileFixed(next, [item]);
    });
    if (templates.length) void refreshTemplates(true);
  }

  function handleItemDeleted(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    // In a new calculation the fixed list mirrors the library. Variable lines
    // she added herself stay, flagged "(supprimé de la liste)".
    setDraft((d) =>
      d.quoteId === null
        ? { ...d, rev: d.rev + 1, lines: d.lines.filter((l) => !(l.kind === "fixed" && l.costItemId === id)) }
        : d
    );
    if (templates.length) void refreshTemplates(true);
  }

  function handleSettingsSaved(next: PricingSettings) {
    setSettings(next);
    followSettings(next);
    if (templates.length) void refreshTemplates(true);
  }

  function handleQuoteSaved(q: PriceQuote) {
    setQuotes((prev) => (prev.some((x) => x.id === q.id) ? prev.map((x) => (x.id === q.id ? q : x)) : [q, ...prev]));
  }

  function handleQuoteDeleted(id: string) {
    setQuotes((prev) => prev.filter((q) => q.id !== id));
    // Keep what's on screen, but it's no longer attached to a saved devis.
    setDraft((d) =>
      d.quoteId === id ? { ...d, quoteId: null, quoteUpdatedAt: null, dirty: true, rev: d.rev + 1 } : d
    );
  }

  /**
   * The page stayed open on the phone for hours: prices may have changed on the
   * laptop. Reload costs, settings and sheets — not while she is editing a sheet.
   */
  async function syncFromServer() {
    if (sheetEditorDirty || Date.now() - lastSync.current < SYNC_EVERY_MS) return;
    lastSync.current = Date.now();
    const n = ++templatesReq.current;
    try {
      const [nextItems, nextSettings, nextTemplates] = await Promise.all([
        apiJson<CostItem[]>("/api/admin/pricing/costs", "GET", undefined, ""),
        apiJson<PricingSettings>("/api/admin/pricing/settings", "GET", undefined, ""),
        apiJson<PriceTemplate[]>("/api/admin/pricing/templates", "GET", undefined, ""),
      ]);
      if (JSON.stringify(nextItems) !== JSON.stringify(items)) {
        setItems(nextItems);
        followLibrary(nextItems);
      }
      if (!sameSettings(nextSettings, settings) || nextSettings.updatedAt !== settings.updatedAt) {
        setSettings(nextSettings);
        followSettings(nextSettings);
      }
      if (n === templatesReq.current && JSON.stringify(nextTemplates) !== JSON.stringify(templates)) {
        setTemplates(nextTemplates);
        setTemplatesRev((r) => r + 1);
      }
    } catch (e) {
      // Offline or session expired: the next action she takes will say so.
      console.error("[pricing] sync on focus", e);
    }
  }

  const syncRef = useRef(syncFromServer);
  useEffect(() => {
    syncRef.current = syncFromServer;
  });
  useEffect(() => {
    const onBack = () => {
      if (document.visibilityState === "visible") void syncRef.current();
    };
    window.addEventListener("focus", onBack);
    document.addEventListener("visibilitychange", onBack);
    return () => {
      window.removeEventListener("focus", onBack);
      document.removeEventListener("visibilitychange", onBack);
    };
  }, []);

  const onEditorDirtyChange = useCallback((dirty: boolean) => setSheetEditorDirty(dirty), []);

  /** What « Faire un devis » would throw away: the calculation's name and price. */
  function calcSummary(): string {
    const b = computePrice({ lines: toQuoteLines(draft), hours: draftHours(draft), portions: draftPortions(draft), settings: draft.settings });
    const incomplete = problemsText(draftProblems(draft), b.lines.filter((l) => l.error).length);
    const name = draft.name.trim() ? quoted(draft.name.trim()) : "Le calcul en cours (sans nom)";
    return incomplete ? `${name}, prix incomplet,` : `${name} (${formatDA(b.finalPrice)})`;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Calcul des prix</h1>
        <p className="text-sm text-gray-500">Le juste prix de chaque gâteau, à partir de vos coûts et de votre temps.</p>
      </div>

      <nav
        role="tablist"
        aria-label="Sections du calcul des prix"
        className="grid grid-cols-5 gap-0.5 sm:gap-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-1"
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          const count = t.id === "quotes" ? quotes.length : t.id === "sheets" ? templates.length : 0;
          const alert = t.id === "sheets" && brokenCount > 0;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={alert ? `${t.label} (${brokenCount} à corriger)` : undefined}
              onClick={() => goTo(t.id)}
              className={cn(
                // 5 tabs on a 390px phone: ~66px each, so a slightly smaller label there.
                "relative flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 min-h-[52px] sm:min-h-[44px] px-0.5 sm:px-1 rounded-xl text-[11px] leading-tight sm:text-sm font-medium transition",
                active ? "bg-rose-500 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              )}
            >
              <t.icon size={17} />
              <span className="whitespace-nowrap">
                {t.label}
                {count > 0 && (
                  <span className={cn("ml-1 tabular-nums", active ? "text-white/80" : "text-gray-400")}>{count}</span>
                )}
              </span>
              {alert && (
                <span
                  aria-hidden
                  className="absolute top-1.5 right-2 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white"
                />
              )}
            </button>
          );
        })}
      </nav>

      {repricedNotice !== null && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-100 pl-4 pr-1 py-1 text-sm text-emerald-800"
        >
          <Check size={15} className="shrink-0" />
          <span className="flex-1">
            {repricedNotice > 1 ? `${repricedNotice} fiches recalculées.` : "1 fiche recalculée."}
          </span>
          {tab !== "sheets" && (
            <button
              type="button"
              onClick={() => {
                setRepricedNotice(null);
                goTo("sheets");
              }}
              className="min-h-[40px] px-3 font-semibold underline underline-offset-2"
            >
              Voir
            </button>
          )}
          <button
            type="button"
            onClick={() => setRepricedNotice(null)}
            aria-label="Fermer"
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-emerald-700 hover:bg-emerald-100"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* All tabs stay mounted so switching never loses what she was typing. */}
      <div className={tab === "calc" ? "" : "hidden"}>
        <PriceCalculator
          items={items}
          settings={settings}
          quotes={quotes}
          draft={draft}
          setDraft={setDraft}
          onQuoteSaved={handleQuoteSaved}
          goTo={goTo}
          saveRequest={saveRequest}
        />
      </div>
      <div className={tab === "sheets" ? "" : "hidden"}>
        <PriceSheets
          templates={templates}
          templatesRev={templatesRev}
          live={live}
          items={items}
          settings={settings}
          cakes={cakes}
          onSaved={handleTemplateSaved}
          onDeleted={handleTemplateDeleted}
          onUseForQuote={(template, variant) =>
            draft.dirty ? setPendingSheet({ template, variant }) : startQuoteFromSheet(template, variant)
          }
          onEditorDirtyChange={onEditorDirtyChange}
          goTo={goTo}
        />
      </div>
      <div className={tab === "costs" ? "" : "hidden"}>
        <CostLibrary items={items} templates={templates} onSaved={handleItemSaved} onDeleted={handleItemDeleted} />
      </div>
      <div className={tab === "quotes" ? "" : "hidden"}>
        <SavedQuotes
          quotes={quotes}
          activeQuoteId={draft.quoteId}
          onOpen={(q) => (draft.dirty ? setPendingOpen(q) : openQuote(q))}
          onDeleted={handleQuoteDeleted}
          onGoToCalc={() => goTo("calc")}
        />
      </div>
      <div className={tab === "settings" ? "" : "hidden"}>
        <PricingSettingsForm settings={settings} onSaved={handleSettingsSaved} />
      </div>

      {pendingOpen && (
        <ConfirmDialog
          title="Ouvrir ce devis ?"
          confirmLabel="Ouvrir"
          tone="primary"
          onConfirm={() => openQuote(pendingOpen)}
          onCancel={() => setPendingOpen(null)}
        >
          <p>Le calcul en cours n&apos;est pas enregistré. Il sera remplacé par {quoted(pendingOpen.name)}.</p>
        </ConfirmDialog>
      )}

      {pendingSheet && (
        <ConfirmDialog
          title="Remplacer le calcul en cours ?"
          confirmLabel="Remplacer"
          tone="primary"
          onConfirm={() => startQuoteFromSheet(pendingSheet.template, pendingSheet.variant)}
          onCancel={() => setPendingSheet(null)}
          extraAction={{
            label: "Enregistrer d'abord",
            onClick: () => {
              setPendingSheet(null);
              goTo("calc");
              setSaveRequest((r) => r + 1);
            },
          }}
        >
          <p>
            {calcSummary()} n&apos;est pas enregistré : il sera remplacé par{" "}
            {quoted(`${pendingSheet.template.name} — ${pendingSheet.variant.label}`)}.
          </p>
          <p className="text-gray-500">
            « Enregistrer d&apos;abord » le garde dans vos devis ; revenez ensuite à la fiche.
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}
