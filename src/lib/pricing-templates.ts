// Price sheets ("fiches prix"): resolve a sheet variant against the LIVE cost
// library and settings, and explain in plain French why its price moved.
// Pure — shared by the server (which records the history) and the UI (which
// shows the live price).

import { computePrice, lineCost, type PricingBreakdown } from "./pricing-formula";
import type {
  CostItem,
  FixedOverride,
  PriceChangeReason,
  PricedSnapshot,
  PricingSettings,
  QuoteLine,
  TemplateLine,
  TemplateVariant,
} from "./pricing-types";
import { UNITS, convertQty, formatDA, formatQty, unitLabel } from "./pricing-units";

/** Starting sizes offered when creating a sheet — to be refined with the owner. */
export const SIZE_PRESETS = [
  { label: "Jusqu'à 10 parts", portions: 10 },
  { label: "11 à 15 parts", portions: 15 },
  { label: "16 à 20 parts", portions: 20 },
  { label: "21 parts et plus", portions: 25 },
] as const;

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export const fixedLineKey = (costItemId: string) => `fixed:${costItemId}`;

export interface ResolvedVariant {
  lines: QuoteLine[];
  /** Variable lines whose cost item no longer exists (or became a fixed cost). */
  missing: TemplateLine[];
}

/**
 * Turns a variant into calculator lines priced with today's library:
 * every fixed cost (× its override, skipped when 0), the variable lines, the extras.
 */
export function resolveVariant(
  variant: Pick<TemplateVariant, "lines" | "fixedOverrides">,
  costItems: CostItem[]
): ResolvedVariant {
  const byId = new Map(costItems.map((c) => [c.id, c]));
  const overrides = new Map(variant.fixedOverrides.map((o) => [o.costItemId, o.qty]));
  const lines: QuoteLine[] = [];
  const missing: TemplateLine[] = [];

  for (const item of costItems) {
    if (item.kind !== "fixed") continue;
    const qty = overrides.get(item.id) ?? 1;
    if (!(qty > 0)) continue;
    lines.push({
      key: fixedLineKey(item.id),
      costItemId: item.id,
      kind: "fixed",
      name: item.name,
      price: item.price,
      priceQty: 1,
      unit: "forfait",
      qty,
      qtyUnit: "forfait",
    });
  }

  for (const l of variant.lines) {
    if (l.kind === "extra") {
      lines.push({
        key: l.key,
        costItemId: null,
        kind: "extra",
        name: l.name,
        price: l.amount ?? 0,
        priceQty: 1,
        unit: "forfait",
        qty: 1,
        qtyUnit: "forfait",
      });
      continue;
    }
    const item = l.costItemId ? byId.get(l.costItemId) : undefined;
    if (!item || item.kind !== "variable") {
      missing.push(l);
      continue;
    }
    lines.push({
      key: l.key,
      costItemId: item.id,
      kind: "variable",
      name: item.name,
      price: item.price,
      priceQty: item.priceQty,
      unit: item.unit,
      customUnit: item.customUnit,
      qty: l.qty,
      qtyUnit: l.qtyUnit,
    });
  }
  return { lines, missing };
}

export interface PricedVariant extends ResolvedVariant {
  snapshot: PricedSnapshot;
  breakdown: PricingBreakdown;
}

export function priceVariant(
  variant: Pick<TemplateVariant, "lines" | "fixedOverrides" | "hours" | "portions">,
  costItems: CostItem[],
  settings: PricingSettings,
  at: string
): PricedVariant {
  const resolved = resolveVariant(variant, costItems);
  const breakdown = computePrice({
    lines: resolved.lines,
    hours: variant.hours,
    portions: variant.portions,
    settings,
  });
  const { hourlyRate, marginPercent, roundTo } = settings;
  return {
    ...resolved,
    breakdown,
    snapshot: {
      at,
      finalPrice: breakdown.finalPrice,
      costTotal: breakdown.costTotal,
      hours: variant.hours,
      settings: { hourlyRate, marginPercent, roundTo },
      lines: resolved.lines,
    },
  };
}

/** Is this change worth an entry in the price history? */
export function priceMoved(prev: PricedSnapshot | undefined, next: PricedSnapshot): boolean {
  return !prev || prev.finalPrice !== next.finalPrice || prev.costTotal !== next.costTotal;
}

// ---------------------------------------------------------------------------
// Explaining a change
// ---------------------------------------------------------------------------

function priceLabel(l: QuoteLine): string {
  if (l.kind !== "variable") return formatDA(l.price);
  const qty = l.priceQty === 1 ? "" : `${formatQty(l.priceQty)} `;
  return `${formatDA(l.price)} / ${qty}${unitLabel(l.unit, l.customUnit, l.priceQty === 1 ? undefined : l.priceQty)}`;
}

function qtyLabel(l: QuoteLine): string {
  if (l.kind !== "variable") return `×${formatQty(l.qty)}`;
  return `${formatQty(l.qty)} ${unitLabel(l.qtyUnit, l.customUnit, l.qty)}`;
}

/** Price per base unit (DA per g, per ml, per pièce…), to compare prices written differently. */
function unitPrice(l: QuoteLine): number {
  if (l.kind !== "variable") return l.price;
  return l.price / (l.priceQty * UNITS[l.unit].toBase);
}

function sameUnitPrice(a: QuoteLine, b: QuoteLine): boolean {
  const pa = unitPrice(a);
  const pb = unitPrice(b);
  const sameFamily = UNITS[a.unit].family === UNITS[b.unit].family;
  const sameCustom =
    a.unit !== "custom" ||
    (a.customUnit ?? "").trim().toLowerCase() === (b.customUnit ?? "").trim().toLowerCase();
  return sameFamily && sameCustom && Math.abs(pa - pb) <= Math.abs(pb) * 1e-9;
}

function sameQty(a: QuoteLine, b: QuoteLine): boolean {
  if (a.qtyUnit === b.qtyUnit) return a.qty === b.qty;
  const converted = convertQty(a.qty, a.qtyUnit, b.qtyUnit);
  return converted !== null && Math.abs(converted - b.qty) <= Math.abs(b.qty) * 1e-9;
}

// Rounded like computePrice rounds each line, so impacts add up to the cost change.
const cost = (l: QuoteLine) => round2(lineCost(l).cost);

/**
 * What only the server knows, to word a change precisely. Optional: without
 * it the generic wording is used (« Coût fixe retiré », « Nouveau coût fixe »).
 */
export interface ExplainContext {
  /** Today's cost library. */
  itemsById: Map<string, CostItem>;
  /** The variant's fixed-cost multipliers at the previous pricing (spots a cost ticked again). */
  prevOverrides?: FixedOverride[];
}

/** A line of the previous pricing that is gone from the new one. */
function removedText(a: QuoteLine, ctx?: ExplainContext): string {
  if (a.kind === "extra") return `Extra retiré : ${a.name}`;
  if (ctx && a.costItemId) {
    const item = ctx.itemsById.get(a.costItemId);
    if (!item) return `${a.name} supprimé de la liste des coûts`;
    if (a.kind === "fixed") {
      return item.kind === "variable" ? `${a.name} est devenu un coût variable` : `${a.name} : retiré de cette taille`;
    }
  }
  return a.kind === "fixed" ? `Coût fixe retiré : ${a.name}` : `Retiré : ${a.name}`;
}

/** A line of the new pricing that wasn't in the previous one. */
function addedText(b: QuoteLine, prev: PricedSnapshot, ctx?: ExplainContext): string {
  if (b.kind === "extra") return `Nouvel extra : ${b.name}`;
  if (b.kind === "variable") return `Ajouté : ${b.name} (${qtyLabel(b)})`;
  const item = ctx && b.costItemId ? ctx.itemsById.get(b.costItemId) : undefined;
  if (item) {
    const wasExcluded = ctx?.prevOverrides?.some((o) => o.costItemId === item.id && !(o.qty > 0));
    if (wasExcluded) return `${b.name} : de nouveau dans cette taille`;
    // Already in the library at the previous pricing, yet not counted: it was a variable cost.
    if (item.createdAt <= prev.at) return `${b.name} est devenu un coût fixe`;
  }
  return `Nouveau coût fixe : ${b.name}`;
}

/**
 * Lists, in plain French, what differs between two pricings of the same
 * variant, each with its effect on the cost price. The impacts add up to the
 * change of the cost price; margin and rounding only move the selling price.
 */
export function explainChange(
  prev: PricedSnapshot,
  next: PricedSnapshot,
  ctx?: ExplainContext
): PriceChangeReason[] {
  const reasons: PriceChangeReason[] = [];
  const push = (text: string, impact?: number) =>
    reasons.push(impact === undefined ? { text } : { text, impact: round2(impact) });

  const before = new Map(prev.lines.map((l) => [l.key, l]));
  const after = new Map(next.lines.map((l) => [l.key, l]));

  for (const [key, a] of Array.from(before)) {
    if (after.has(key)) continue;
    push(removedText(a, ctx), -cost(a));
  }

  for (const [key, b] of Array.from(after)) {
    const a = before.get(key);
    if (!a) {
      push(addedText(b, prev, ctx), cost(b));
      continue;
    }
    const priceChanged = !sameUnitPrice(a, b);
    const qtyChanged = !sameQty(a, b);
    if (!priceChanged && !qtyChanged) continue;
    // Split the effect: new price on the old quantity, then the new quantity.
    const midCost = cost({ ...b, qty: a.qty, qtyUnit: a.qtyUnit });
    if (priceChanged) {
      // A fixed cost counted twice moves the price twice as much: say so.
      const name = b.kind === "fixed" && a.qty !== 1 ? `${b.name} (×${formatQty(a.qty)})` : b.name;
      const suffix = b.kind === "fixed" ? " par gâteau" : "";
      push(`${name} : ${priceLabel(a)} → ${priceLabel(b)}${suffix}`, (qtyChanged ? midCost : cost(b)) - cost(a));
    }
    if (qtyChanged) {
      push(`${b.name} : ${qtyLabel(a)} → ${qtyLabel(b)}`, cost(b) - (priceChanged ? midCost : cost(a)));
    }
  }

  const oldRate = prev.settings.hourlyRate;
  const newRate = next.settings.hourlyRate;
  if (prev.hours !== next.hours) {
    push(
      `Heures de travail : ${formatQty(prev.hours)} → ${formatQty(next.hours)} h`,
      (next.hours - prev.hours) * oldRate
    );
  }
  if (oldRate !== newRate) {
    push(`Taux horaire : ${formatQty(oldRate)} → ${formatQty(newRate)} DA/h`, next.hours * (newRate - oldRate));
  }
  if (prev.settings.marginPercent !== next.settings.marginPercent) {
    push(`Marge : ${formatQty(prev.settings.marginPercent)} → ${formatQty(next.settings.marginPercent)} %`);
  }
  if (prev.settings.roundTo !== next.settings.roundTo) {
    const r = (n: number) => (n > 0 ? formatDA(n) : "aucun");
    push(`Arrondi : ${r(prev.settings.roundTo)} → ${r(next.settings.roundTo)}`);
  }

  if (reasons.length === 0 && priceMoved(prev, next)) push("Recalcul");
  return reasons;
}

// ---------------------------------------------------------------------------
// Building sizes
// ---------------------------------------------------------------------------

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

/**
 * Readable scaled quantity: whole number from 100 up (233,33 g → 233 g),
 * 3 significant digits below (0,125 kg × 1,5 → 0,188 kg; 0,5 pièce × 2,5 → 1,25).
 * Never rounds a small quantity up to 1.
 */
function roundQty(qty: number): number {
  return qty >= 100 ? Math.round(qty) : Number(qty.toPrecision(3));
}

/**
 * Copy of a variant for another size: variable quantities (and optionally the
 * hours) multiplied by `factor`. Extras and fixed costs are kept as they are.
 */
export function scaleVariant(
  source: TemplateVariant,
  opts: { label: string; portions?: number; factor: number; scaleHours: boolean }
): TemplateVariant {
  const f = opts.factor > 0 ? opts.factor : 1;
  return {
    id: newId(),
    label: opts.label,
    portions: opts.portions,
    hours: opts.scaleHours ? Math.round(source.hours * f * 4) / 4 : source.hours, // quarter hours
    fixedOverrides: source.fixedOverrides.map((o) => ({ ...o })),
    lines: source.lines.map((l) => ({
      ...l,
      key: newId(),
      qty: l.kind === "variable" && f !== 1 ? roundQty(l.qty * f) : l.qty,
    })),
  };
}

export function emptyVariant(label: string, portions?: number): TemplateVariant {
  return { id: newId(), label, portions, hours: 0, lines: [], fixedOverrides: [] };
}
