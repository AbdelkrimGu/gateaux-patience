"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, History, Loader2, RotateCw } from "lucide-react";
import type { PriceChangeTrigger, PriceTemplate, TemplatePriceChange } from "@/lib/pricing-types";
import { formatDA } from "@/lib/pricing-units";
import { cn } from "@/lib/utils";
import { formatDateTime, formatShortDate } from "./format";
import { ErrorBox, Sheet } from "./ui";

export type HistoryState =
  | { status: "loading" }
  | { status: "error"; text: string }
  | { status: "ok"; entries: TemplatePriceChange[] };

export const TRIGGER_LABEL: Record<PriceChangeTrigger, string> = {
  created: "Création",
  template: "Fiche modifiée",
  cost: "Coût modifié",
  settings: "Réglages modifiés",
};

const signed = (n: number) => `${n > 0 ? "+" : "−"}${formatDA(Math.abs(n))}`;

/** "+300 DA" in red (dearer) / "−200 DA" in green (cheaper). */
export function PriceDelta({ from, to, className }: { from: number; to: number; className?: string }) {
  const d = Math.round((to - from) * 100) / 100;
  if (d === 0) return <span className={cn("text-xs text-gray-400", className)}>prix inchangé</span>;
  const up = d > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
        up ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700",
        className
      )}
    >
      {up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
      {signed(d)}
    </span>
  );
}

/** Same, in one word, for a one-line hint in the list. */
export const TRIGGER_SHORT: Record<PriceChangeTrigger, string> = {
  created: "création",
  template: "fiche",
  cost: "coût",
  settings: "réglages",
};

export type ChangeSummary = Pick<TemplatePriceChange, "at" | "trigger" | "oldPrice" | "newPrice">;

/** The last change as a sentence (screen readers, the size's action sheet). */
export function changeSentence(entry: ChangeSummary): string {
  if (entry.trigger === "created" || entry.oldPrice === null) return `Prix de départ le ${formatShortDate(entry.at)}`;
  const d = Math.round((entry.newPrice - entry.oldPrice) * 100) / 100;
  return `${d === 0 ? "Prix inchangé" : signed(d)} le ${formatShortDate(entry.at)} · ${TRIGGER_LABEL[entry.trigger]}`;
}

/** One short line under a price: « +50 DA · 18/10 · coût » (`full`: « Coût modifié »). */
export function LatestChangeHint({ entry, full = false }: { entry: ChangeSummary; full?: boolean }) {
  if (entry.trigger === "created" || entry.oldPrice === null) {
    return <span className="text-xs text-gray-400">depuis le {formatShortDate(entry.at)}</span>;
  }
  const d = Math.round((entry.newPrice - entry.oldPrice) * 100) / 100;
  return (
    <span className="text-xs text-gray-400 whitespace-nowrap">
      <span className={cn("font-semibold tabular-nums", d > 0 ? "text-red-600" : d < 0 ? "text-emerald-700" : "text-gray-500")}>
        {d === 0 ? "=" : signed(d)}
      </span>
      {` · ${formatShortDate(entry.at)} · ${full ? TRIGGER_LABEL[entry.trigger] : TRIGGER_SHORT[entry.trigger]}`}
    </span>
  );
}

function Entry({ e, sizeLabel }: { e: TemplatePriceChange; sizeLabel?: string }) {
  const created = e.trigger === "created" || e.oldPrice === null;
  return (
    <li className="px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-gray-400">{formatDateTime(e.at)}</p>
          {sizeLabel !== undefined && <p className="text-sm font-medium text-gray-800 truncate">{sizeLabel}</p>}
        </div>
        <span className="shrink-0 text-[11px] font-medium text-gray-600 bg-gray-100 rounded-full px-2 py-0.5">
          {TRIGGER_LABEL[e.trigger]}
        </span>
      </div>

      {created ? (
        <p className="mt-1 text-sm text-gray-700">
          Prix de départ : <span className="font-semibold tabular-nums">{formatDA(e.newPrice)}</span>
        </p>
      ) : (
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm tabular-nums text-gray-500">
            {formatDA(e.oldPrice as number)} → <span className="font-bold text-gray-800">{formatDA(e.newPrice)}</span>
          </span>
          <PriceDelta from={e.oldPrice as number} to={e.newPrice} />
        </div>
      )}

      {!created && e.oldPrice === e.newPrice && e.oldCost !== null && e.oldCost !== e.newCost && (
        // Rounding can absorb a small cost change: say what moved underneath.
        <p className="text-xs text-gray-400 mt-0.5">
          Coût de revient : {formatDA(e.oldCost)} → {formatDA(e.newCost)} ; le prix arrondi reste le même.
        </p>
      )}

      {!created && e.reasons.length > 0 && (
        <ul className="mt-2 space-y-1.5 rounded-lg bg-gray-50 px-3 py-2">
          {e.reasons.map((r, i) => (
            <li key={i} className="text-xs text-gray-600">
              <span className="block">{r.text}</span>
              {r.impact !== undefined && r.impact !== 0 && (
                <span className={cn("block font-medium tabular-nums", r.impact > 0 ? "text-red-600" : "text-emerald-700")}>
                  {signed(r.impact)} sur le coût
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default function SheetHistory({
  template,
  state,
  initialVariantId,
  onRetry,
  onClose,
}: {
  template: PriceTemplate;
  state: HistoryState;
  initialVariantId?: string;
  onRetry: () => void;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState<string | null>(initialVariantId ?? null);
  const labels = new Map(template.variants.map((v) => [v.id, v.label]));
  const entries = state.status === "ok" ? state.entries : [];
  const shown = filter ? entries.filter((e) => e.variantId === filter) : entries;
  const hasRemoved = entries.some((e) => !labels.has(e.variantId));

  const pill = (active: boolean) =>
    cn(
      "shrink-0 min-h-[40px] px-3 rounded-full text-sm font-medium border transition whitespace-nowrap",
      active ? "bg-rose-500 border-rose-500 text-white" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
    );

  return (
    <Sheet title={`Historique des prix · ${template.name}`} onClose={onClose}>
      {template.variants.length > 1 && (
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
          <div role="tablist" aria-label="Filtrer par taille" className="flex gap-2 overflow-x-auto px-4 py-2.5">
            <button type="button" role="tab" aria-selected={filter === null} onClick={() => setFilter(null)} className={pill(filter === null)}>
              Toutes
            </button>
            {template.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={filter === v.id}
                onClick={() => setFilter(v.id)}
                className={pill(filter === v.id)}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {state.status === "loading" && (
        <p className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-gray-400">
          <Loader2 size={16} className="animate-spin" /> Chargement…
        </p>
      )}

      {state.status === "error" && (
        <div className="p-4">
          <ErrorBox>
            <p>{state.text}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-lg bg-white border border-red-200 text-red-700 text-sm font-medium hover:bg-red-50 transition"
            >
              <RotateCw size={14} /> Réessayer
            </button>
          </ErrorBox>
        </div>
      )}

      {state.status === "ok" &&
        (shown.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <History size={24} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">Aucun changement de prix enregistré{filter ? " pour cette taille" : ""}.</p>
          </div>
        ) : (
          <>
            <p className="px-4 pt-3 text-xs text-gray-400">
              Du plus récent au plus ancien. « sur le coût » = effet sur le coût de revient, avant marge et arrondi.
            </p>
            <ul className="divide-y divide-gray-100 pb-2">
              {shown.map((e) => (
                <Entry
                  key={e.id}
                  e={e}
                  sizeLabel={
                    filter || (template.variants.length === 1 && labels.has(e.variantId))
                      ? undefined
                      : labels.get(e.variantId) ?? "Taille supprimée"
                  }
                />
              ))}
            </ul>
            {hasRemoved && !filter && (
              <p className="px-4 pb-4 text-xs text-gray-400">« Taille supprimée » : une taille retirée de la fiche depuis.</p>
            )}
          </>
        ))}
    </Sheet>
  );
}
