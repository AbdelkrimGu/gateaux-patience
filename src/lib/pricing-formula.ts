// THE price formula — the single place to change when the owner gives us hers.
//
// PROVISIONAL formula (to be confirmed with the owner):
//   materials = Σ fixed costs + Σ variable costs (qty × unit price) + Σ extras
//   labor     = hours × hourly rate
//   cost      = materials + labor
//   price     = cost × (1 + margin %), rounded UP to the nearest `roundTo` DA
//
// Keep this module pure (no I/O) so the calculator UI and the server compute
// exactly the same numbers. FORMULA_STEPS is shown to the owner in the UI —
// update it together with computePrice().

import type { PricingSettings, QuoteLine } from "./pricing-types";
import { convertQty } from "./pricing-units";

export const FORMULA_STEPS = [
  "Matières = coûts fixes + coûts variables (quantité × prix unitaire) + extras",
  "Main d'œuvre = heures × taux horaire",
  "Coût de revient = matières + main d'œuvre",
  "Prix de vente = coût de revient + marge %, arrondi au-dessus",
] as const;

export interface LineCost {
  key: string;
  name: string;
  kind: QuoteLine["kind"];
  cost: number; // 0 when the line can't be computed (see `error`)
  error?: string;
}

export interface PricingBreakdown {
  lines: LineCost[];
  fixedTotal: number;
  variableTotal: number;
  extrasTotal: number;
  materialsTotal: number;
  laborTotal: number;
  costTotal: number;
  marginAmount: number;
  rawPrice: number; // before rounding
  finalPrice: number;
  pricePerPortion: number | null;
  hasErrors: boolean;
}

// EPSILON so 1.005 rounds to 1.01, not 1.
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Cost of one line in DA, or an error when its quantity can't be priced. */
export function lineCost(line: QuoteLine): { cost: number; error?: string } {
  const qty = Number.isFinite(line.qty) && line.qty > 0 ? line.qty : 0;
  if (line.kind !== "variable") {
    return { cost: line.price * qty };
  }
  if (!(line.priceQty > 0)) return { cost: 0, error: "Quantité d'achat invalide" };
  const qtyInPriceUnit = convertQty(qty, line.qtyUnit, line.unit);
  if (qtyInPriceUnit === null) return { cost: 0, error: "Unités incompatibles" };
  return { cost: (qtyInPriceUnit / line.priceQty) * line.price };
}

export function computePrice(input: {
  lines: QuoteLine[];
  hours: number;
  portions?: number;
  settings: PricingSettings;
}): PricingBreakdown {
  const { settings } = input;
  const lines: LineCost[] = input.lines.map((l) => {
    const { cost, error } = lineCost(l);
    return { key: l.key, name: l.name, kind: l.kind, cost: round2(cost), error };
  });

  const sum = (kind: QuoteLine["kind"]) =>
    round2(lines.filter((l) => l.kind === kind).reduce((s, l) => s + l.cost, 0));

  const fixedTotal = sum("fixed");
  const variableTotal = sum("variable");
  const extrasTotal = sum("extra");
  const materialsTotal = round2(fixedTotal + variableTotal + extrasTotal);

  const hours = Number.isFinite(input.hours) && input.hours > 0 ? input.hours : 0;
  const laborTotal = round2(hours * Math.max(0, settings.hourlyRate));
  const costTotal = round2(materialsTotal + laborTotal);

  const marginAmount = round2(costTotal * (Math.max(0, settings.marginPercent) / 100));
  const rawPrice = round2(costTotal + marginAmount);
  const step = settings.roundTo > 0 ? settings.roundTo : 0;
  const finalPrice = step ? round2(Math.ceil(rawPrice / step) * step) : rawPrice;

  const portions = input.portions && input.portions > 0 ? input.portions : 0;

  return {
    lines,
    fixedTotal,
    variableTotal,
    extrasTotal,
    materialsTotal,
    laborTotal,
    costTotal,
    marginAmount,
    rawPrice,
    finalPrice,
    // whole DA: nobody quotes 216,67 DA a part
    pricePerPortion: portions ? Math.round(finalPrice / portions) : null,
    hasErrors: lines.some((l) => l.error),
  };
}
