"use client";

import { AlertTriangle, Info } from "lucide-react";
import { FORMULA_STEPS, type PricingBreakdown } from "@/lib/pricing-formula";
import type { PricingSettings } from "@/lib/pricing-types";
import { formatDA, formatQty } from "@/lib/pricing-units";
import { cn } from "@/lib/utils";
import { formatHours } from "./format";

type SettingsLike = Pick<PricingSettings, "hourlyRate" | "marginPercent" | "roundTo">;

/** `provisional`: only on the Réglages tab, while the owner hasn't confirmed her formula. */
export function FormulaSteps({ settings, provisional = false }: { settings?: SettingsLike; provisional?: boolean }) {
  return (
    <div className="text-sm text-gp-ink/80 space-y-2">
      <ol className="list-decimal pl-5 space-y-1">
        {FORMULA_STEPS.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      {settings && (
        <p className="text-xs text-gp-ink/70">
          {settings.roundTo > 0
            ? `Arrondi : au multiple de ${formatDA(settings.roundTo)} supérieur.`
            : "Pas d'arrondi : le prix est gardé tel quel."}
        </p>
      )}
      {provisional && (
        <p className="text-xs text-gp-ink/65">
          Formule provisoire : elle pourra être ajustée selon votre propre méthode.
        </p>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  sub,
  strong,
  muted,
}: {
  label: string;
  value: string;
  sub?: string;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3 py-1", muted && "pl-3")}>
      <span className={cn("text-sm", strong ? "font-semibold text-gp-ink" : muted ? "text-gp-ink/65" : "text-gp-ink/80")}>
        {label}
        {sub && <span className="block text-xs font-normal text-gp-ink/65">{sub}</span>}
      </span>
      <span
        className={cn(
          "text-sm tabular-nums whitespace-nowrap",
          strong ? "font-semibold text-gp-ink" : muted ? "text-gp-ink/65" : "text-gp-ink/90"
        )}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * Detailed result of computePrice(). Shows numbers only — never computes.
 * `incomplete`: why the price can't be trusted yet; replaces the final price.
 */
export default function PriceBreakdown({
  breakdown: b,
  settings,
  hours,
  portions,
  savedPrice,
  showFinal = true,
  incomplete = null,
}: {
  breakdown: PricingBreakdown;
  settings: SettingsLike;
  hours: number;
  portions?: number;
  savedPrice?: number | null;
  showFinal?: boolean;
  incomplete?: string | null;
}) {
  const savedDiffering =
    typeof savedPrice === "number" && Math.abs(savedPrice - b.finalPrice) >= 0.01 ? savedPrice : null;
  return (
    <div>
      <Row label="Matières" value={formatDA(b.materialsTotal)} strong />
      <Row label="Coûts fixes" value={formatDA(b.fixedTotal)} muted />
      <Row label="Coûts variables" value={formatDA(b.variableTotal)} muted />
      <Row label="Extras" value={formatDA(b.extrasTotal)} muted />
      <Row
        label="Main d'œuvre"
        sub={`${formatHours(hours)} × ${formatDA(settings.hourlyRate)}/h`}
        value={formatDA(b.laborTotal)}
        strong
      />
      <div className="border-t border-dashed border-gp-ink/20 my-1.5" />
      <Row label="Coût de revient" value={formatDA(b.costTotal)} strong />
      <Row label={`Marge (${formatQty(settings.marginPercent)} %)`} value={`+ ${formatDA(b.marginAmount)}`} />
      {settings.roundTo > 0 && (
        <Row
          label="Prix avant arrondi"
          sub={`arrondi au-dessus à ${formatDA(settings.roundTo)} près`}
          value={formatDA(b.rawPrice)}
        />
      )}
      {showFinal &&
        (incomplete ? (
          <div className="mt-2 rounded-2xl bg-amber-50 border border-amber-200 px-3.5 py-3">
            <p className="font-display text-[17px] font-semibold text-amber-900">Prix incomplet</p>
            <p className="text-xs text-amber-800 mt-0.5 first-letter:uppercase">{incomplete}</p>
          </div>
        ) : (
          // The final price, printed like a ticket: ink, gold perforation, gold figure.
          <div data-surface="ink" className="mt-2 rounded-2xl bg-gp-ink text-gp-cream px-3.5 pt-2.5 pb-3">
            <div aria-hidden className="gpa-perf mb-2.5 opacity-80" />
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold text-gp-cream/85">Prix de vente</span>
              <span className="font-display text-[28px] font-semibold tracking-[-0.02em] text-gp-gold tabular-nums leading-none">
                {formatDA(b.finalPrice)}
              </span>
            </div>
          </div>
        ))}
      {!incomplete && b.pricePerPortion !== null && (
        <p className="text-sm text-gp-ink/80 text-right mt-1.5">
          soit <span className="font-semibold tabular-nums">{formatDA(b.pricePerPortion)}</span> par part
          {portions ? ` (${formatQty(portions)} ${portions > 1 ? "parts" : "part"})` : ""}
        </p>
      )}
      {!incomplete && savedDiffering !== null && (
        <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-2">
          Prix enregistré dans ce devis : <span className="font-semibold">{formatDA(savedDiffering)}</span>.
          La différence vient de vos modifications ou des prix mis à jour.
        </p>
      )}
      {b.hasErrors && (
        <p className="flex items-start gap-1.5 text-xs text-red-800 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mt-2">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
          Certaines lignes ont une erreur et comptent pour 0 DA.
        </p>
      )}
      <details className="mt-3 group">
        <summary className="cursor-pointer select-none text-sm font-medium text-gp-ink/80 hover:text-gp-raspberry min-h-[44px] list-none flex items-center gap-1.5 rounded-lg">
          <Info size={14} />
          Comment le prix est calculé
        </summary>
        <div className="pt-1 pb-1">
          <FormulaSteps settings={settings} />
        </div>
      </details>
    </div>
  );
}
