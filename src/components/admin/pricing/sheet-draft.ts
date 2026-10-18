// Editor state for price sheets ("fiches prix"). Each size is edited with the
// same DraftLine rows as the calculator (raw strings, fixed costs as ticked
// lines) and converted to the API shape for pricing and saving. All pricing
// goes through priceVariant(), the function the server uses.

import type {
  CostItem, PricingSettings, PriceTemplate, TemplateInput, TemplateLine, TemplateVariant,
  TemplateVariantInput,
} from "@/lib/pricing-types";
import {
  emptyVariant, fixedLineKey, priceVariant, scaleVariant, SIZE_PRESETS, type PricedVariant,
} from "@/lib/pricing-templates";
import { compatibleUnits } from "@/lib/pricing-units";
import {
  draftHours, draftPortions, draftProblems, lineFromItem, parseStoredLine, problemsText, toQuoteLine,
  type DraftLine,
} from "./draft";
import { numberToRaw, quoted } from "./format";

/** What the page passes down about a catalog cake (the full Cake stays on the server). */
export interface CakeOption {
  id: string;
  title: string;
  image?: string;
  published: boolean;
}

export interface VariantDraft {
  id: string;
  label: string;
  portionsRaw: string;
  hoursRaw: string;
  lines: DraftLine[]; // one fixed line per library fixed cost, then variable lines and extras
}

export interface SheetDraft {
  templateId: string | null;
  updatedAt: string | null;
  name: string;
  cakeId: string | null;
  note: string;
  variants: VariantDraft[];
}

const DELETED_MSG = "Coût supprimé de la liste — retirez la ligne";
const BECAME_FIXED_MSG = "Devenu un coût fixe — retirez la ligne";

// ---------- API shape → editor ----------

function draftLineFrom(l: TemplateLine, item: CostItem | undefined): DraftLine {
  if (l.kind === "extra") {
    return {
      key: l.key,
      costItemId: null,
      kind: "extra",
      name: l.name,
      price: l.amount ?? 0,
      priceQty: 1,
      unit: "forfait",
      qty: 1,
      qtyUnit: "forfait",
      qtyRaw: "1",
      amountRaw: numberToRaw(l.amount),
      included: true,
    };
  }
  const live = item && item.kind === "variable" ? item : undefined;
  return {
    key: l.key,
    costItemId: l.costItemId,
    kind: "variable",
    name: live?.name ?? l.name,
    // A deleted cost has no price any more; the row only offers to remove it.
    price: live?.price ?? 0,
    priceQty: live?.priceQty ?? 1,
    unit: live?.unit ?? l.qtyUnit,
    customUnit: live?.customUnit,
    qty: l.qty,
    qtyUnit: l.qtyUnit,
    qtyRaw: numberToRaw(l.qty),
    amountRaw: "",
    included: true,
  };
}

export function variantDraftFrom(v: TemplateVariantInput, items: CostItem[]): VariantDraft {
  const overrides = new Map(v.fixedOverrides.map((o) => [o.costItemId, o.qty]));
  const byId = new Map(items.map((i) => [i.id, i]));
  const fixed = items
    .filter((i) => i.kind === "fixed")
    .map((i) => {
      const qty = overrides.get(i.id) ?? 1;
      const included = qty > 0;
      return { ...lineFromItem(i, included), key: fixedLineKey(i.id), qtyRaw: included ? numberToRaw(qty) : "1" };
    });
  return {
    id: v.id,
    label: v.label,
    // Parts are required now: a size saved without them gets them from its label.
    portionsRaw: numberToRaw(v.portions ?? partsFromLabel(v.label)),
    hoursRaw: v.hours > 0 ? numberToRaw(v.hours) : "",
    lines: [...fixed, ...v.lines.map((l) => draftLineFrom(l, l.costItemId ? byId.get(l.costItemId) : undefined))],
  };
}

/** A new sheet starts with the first standard size, to fill in before the others. */
export function sheetDraftFrom(t: PriceTemplate | null, items: CostItem[]): SheetDraft {
  if (!t) {
    const first = SIZE_PRESETS[0];
    return {
      templateId: null,
      updatedAt: null,
      name: "",
      cakeId: null,
      note: "",
      variants: [variantDraftFrom(emptyVariant(first.label, first.portions), items)],
    };
  }
  return {
    templateId: t.id,
    updatedAt: t.updatedAt,
    name: t.name,
    cakeId: t.cakeId ?? null,
    note: t.note ?? "",
    variants: t.variants.map((v) => variantDraftFrom(v, items)),
  };
}

// ---------- Editor → API shape ----------

export function toVariantInput(v: VariantDraft, items: CostItem[]): TemplateVariantInput {
  const fixedIds = new Set(items.filter((i) => i.kind === "fixed").map((i) => i.id));
  const fixedOverrides: TemplateVariantInput["fixedOverrides"] = [];
  const lines: TemplateLine[] = [];
  for (const l of v.lines) {
    const q = toQuoteLine(l); // parsed numbers (empty / unreadable = 0)
    if (l.kind === "fixed") {
      if (!l.costItemId || !fixedIds.has(l.costItemId)) continue;
      const qty = l.included ? q.qty : 0;
      // Only what differs from "× 1": a new fixed cost then applies to every sheet.
      if (qty !== 1) fixedOverrides.push({ costItemId: l.costItemId, qty });
    } else if (l.kind === "variable") {
      lines.push({ key: l.key, kind: "variable", costItemId: l.costItemId, name: l.name, qty: q.qty, qtyUnit: l.qtyUnit });
    } else {
      lines.push({ key: l.key, kind: "extra", costItemId: null, name: q.name, qty: 1, qtyUnit: "forfait", amount: q.price });
    }
  }
  return {
    id: v.id,
    label: v.label.trim(),
    portions: draftPortions(v),
    hours: draftHours(v),
    lines,
    fixedOverrides,
  };
}

export function toTemplateInput(d: SheetDraft, items: CostItem[]): TemplateInput {
  return {
    name: d.name.trim(),
    cakeId: d.cakeId ?? undefined,
    note: d.note.trim() || undefined,
    variants: d.variants.map((v) => toVariantInput(v, items)),
  };
}

// ---------- Live price and checks ----------

export function priceDraft(v: VariantDraft, items: CostItem[], settings: PricingSettings): PricedVariant {
  return priceVariant(toVariantInput(v, items), items, settings, "");
}

/** Why a variable line can't be priced any more, or null. */
export function blockedReason(l: DraftLine, itemsById: Map<string, CostItem>): string | null {
  if (l.kind !== "variable") return null;
  const item = l.costItemId ? itemsById.get(l.costItemId) : undefined;
  if (!item) return DELETED_MSG;
  return item.kind === "variable" ? null : BECAME_FIXED_MSG;
}

/** What keeps this size from being saved, in a few words, or null. */
export function variantProblem(v: VariantDraft, priced: PricedVariant): string | null {
  const parts: string[] = [];
  if (!v.label.trim()) parts.push("donnez un nom à cette taille");
  if (v.portionsRaw.trim() === "") parts.push("indiquez le nombre de parts");
  const missing = priced.missing.length;
  if (missing) parts.push(missing > 1 ? `${missing} coûts supprimés à retirer` : "1 coût supprimé à retirer");
  const lineErrors = priced.breakdown.lines.filter((l) => l.error).length;
  const fields = problemsText(draftProblems(v), lineErrors);
  if (fields) parts.push(fields);
  // "0" reads fine as a number, but an ingredient used at 0 is a line to remove.
  const zero = v.lines.filter((l) => l.kind === "variable" && l.qtyRaw.trim() !== "" && toQuoteLine(l).qty === 0).length;
  if (!fields && zero) parts.push(zero > 1 ? `${zero} quantités à 0 (retirez ces lignes)` : "1 quantité à 0 (retirez la ligne)");
  return parts.length ? parts.join(" · ") : null;
}

/** The server keeps at most this many sizes per sheet. */
export const MAX_SIZES = 12;

/** Something worth copying to another size (not just the default fixed costs). */
export function hasContent(v: VariantDraft): boolean {
  return (
    v.hoursRaw.trim() !== "" ||
    v.lines.some((l) => l.kind !== "fixed" || !l.included || l.qtyRaw.trim() !== "1")
  );
}

// ---------- Building sizes ----------

/**
 * Copy of `source` for another size via scaleVariant(). Quantities she hadn't
 * typed yet stay empty (scaleVariant would turn them into 1).
 */
export function scaleDraft(
  source: VariantDraft,
  items: CostItem[],
  opts: { label: string; portions?: number; factor: number; scaleHours: boolean }
): VariantDraft {
  const scaled = variantDraftFrom(scaleVariant(toVariantInput(source, items) as TemplateVariant, opts), items);
  const srcOthers = source.lines.filter((l) => l.kind !== "fixed");
  let i = 0;
  const lines = scaled.lines.map((l) => {
    if (l.kind === "fixed") return l;
    const src = srcOthers[i++];
    if (!src) return l;
    if (l.kind === "extra") return src.amountRaw.trim() === "" ? { ...l, amountRaw: "" } : l;
    return src.qtyRaw.trim() === "" ? { ...l, qtyRaw: "" } : l;
  });
  return { ...scaled, lines, hoursRaw: source.hoursRaw.trim() === "" ? "" : scaled.hoursRaw };
}

/**
 * The 4 standard sizes. Her current size is kept as it is (same id, so its
 * price history continues) — in the slot of the preset with the same number of
 * parts, or first when none matches. The others copy it, quantities scaled by
 * the parts ratio, or start empty when there is nothing to copy.
 */
export function standardSizes(
  current: VariantDraft[],
  items: CostItem[],
  scaleHours: boolean
): VariantDraft[] {
  const blank = (p: (typeof SIZE_PRESETS)[number]) => variantDraftFrom(emptyVariant(p.label, p.portions), items);
  const source = current[0];
  if (!source) return SIZE_PRESETS.map(blank);
  const base = draftPortions(source);
  const content = hasContent(source);
  const out: VariantDraft[] = [];
  let kept = false;
  for (const p of SIZE_PRESETS) {
    if (!kept && base === p.portions) {
      out.push(source);
      kept = true;
    } else if (content) {
      const factor = base ? p.portions / base : 1;
      out.push(scaleDraft(source, items, { label: p.label, portions: p.portions, factor, scaleHours }));
    } else {
      out.push(blank(p));
    }
  }
  if (!kept && content) out.unshift(source);
  return out;
}

/** Factor to go from `from` parts to `to` parts, rounded for display (15 / 10 → 1,5). */
export function portionsRatio(from: number | undefined, to: number | undefined): number | null {
  if (!from || !to) return null;
  return Math.round((to / from) * 100) / 100;
}

// ---------- Texts ----------

/**
 * Label for a size, with its parts only when the label has no number at all
 * (« 11 à 15 parts » stays as it is, « Grand modèle » → « Grand modèle (20 parts) »).
 */
export function sizeTitle(v: { label: string; portions?: number }): string {
  const label = v.label.trim() || "Sans nom";
  if (!v.portions || /\d/.test(label)) return label;
  return `${label} (${v.portions} parts)`;
}

/** Parts read from a size label: its last whole number (« 11 à 15 parts » → 15). */
export function partsFromLabel(label: string): number | undefined {
  const nums = label.match(/\d+/g);
  const n = nums ? Number(nums[nums.length - 1]) : NaN;
  return Number.isInteger(n) && n > 0 && n <= 1000 ? n : undefined;
}

// ---------- State of a saved size (list, tabs, banners) ----------

export type SizeState =
  | { kind: "broken"; culprits: string[] } // can't be priced right: a cost was deleted, units no longer match…
  | { kind: "unfinished" } // nothing in it yet: no hours, no ingredient, no extra
  | { kind: "ok"; noHours: boolean };

/** Hours and lines are what she fills in; fixed costs alone are not a price. */
export function isUnfinished(v: { hours: number; lines: unknown[] }): boolean {
  return !(v.hours > 0) && v.lines.length === 0;
}

export function sizeState(
  v: { hours: number; lines: TemplateLine[] },
  priced: PricedVariant,
  itemsById: Map<string, CostItem>
): SizeState {
  const culprits: string[] = [];
  for (const l of priced.missing) {
    const item = l.costItemId ? itemsById.get(l.costItemId) : undefined;
    culprits.push(`${item?.name ?? l.name ?? "Un coût"} (${item ? "devenu coût fixe" : "supprimé de la liste"})`);
  }
  for (const l of priced.breakdown.lines) {
    if (l.error) culprits.push(`${l.name} (${l.error.toLowerCase()})`);
  }
  if (culprits.length) return { kind: "broken", culprits };
  if (isUnfinished(v)) return { kind: "unfinished" };
  return { kind: "ok", noHours: !(v.hours > 0) };
}

export interface LiveSize {
  priced: PricedVariant;
  state: SizeState;
}

export const liveKey = (templateId: string, variantId: string) => `${templateId}:${variantId}`;

/** Every saved size priced with today's costs and settings (same function as the server). */
export function liveSizes(
  templates: PriceTemplate[],
  items: CostItem[],
  settings: PricingSettings
): Map<string, LiveSize> {
  const itemsById = new Map(items.map((i) => [i.id, i]));
  const out = new Map<string, LiveSize>();
  for (const t of templates) {
    for (const v of t.variants) {
      const priced = priceVariant(v, items, settings, "");
      out.set(liveKey(t.id, v.id), { priced, state: sizeState(v, priced, itemsById) });
    }
  }
  return out;
}

/** Sheets with at least one size that can't be priced right any more. */
export function brokenSheets(templates: PriceTemplate[], live: Map<string, LiveSize>): PriceTemplate[] {
  return templates.filter((t) => t.variants.some((v) => live.get(liveKey(t.id, v.id))?.state.kind === "broken"));
}

/**
 * The sheets (and sizes) whose lines would no longer be priceable if this cost
 * became `next`: turned into a fixed cost, or a unit of another family
 * (bought per kg → per pièce, while the sheet says 200 g).
 */
export function sheetsBrokenBy(
  templates: PriceTemplate[],
  costItemId: string,
  next: { kind: CostItem["kind"]; unit: CostItem["unit"] }
): Array<{ name: string; sizes: string[] }> {
  const ok = (qtyUnit: TemplateLine["qtyUnit"]) => next.kind === "variable" && compatibleUnits(next.unit).includes(qtyUnit);
  const out: Array<{ name: string; sizes: string[] }> = [];
  for (const t of templates) {
    const sizes = t.variants
      .filter((v) => v.lines.some((l) => l.kind === "variable" && l.costItemId === costItemId && !ok(l.qtyUnit)))
      .map((v) => v.label);
    if (sizes.length) out.push({ name: t.name, sizes });
  }
  return out;
}

// ---------- Unsaved editor kept on the phone (reload, expired session…) ----------

export const SHEET_DRAFT_KEY = "gp-admin-pricing-sheet-draft-v1";

export interface StoredSheetDraft {
  v: 1;
  draft: SheetDraft;
  selectedId: string | null;
  savedAt: string;
}

/** Shape check for what was read back from localStorage; null when unusable. */
export function parseStoredSheetDraft(raw: unknown): StoredSheetDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  const d = s.draft as Record<string, unknown> | undefined;
  if (s.v !== 1 || !d || typeof d !== "object" || !Array.isArray(d.variants) || typeof d.name !== "string") return null;
  const str = (x: unknown) => (typeof x === "string" ? x : "");
  const variants: VariantDraft[] = [];
  for (const x of d.variants as unknown[]) {
    if (!x || typeof x !== "object") return null;
    const v = x as Record<string, unknown>;
    if (typeof v.id !== "string" || !v.id || !Array.isArray(v.lines)) return null;
    const lines: DraftLine[] = [];
    const seen = new Set<string>();
    for (const l of v.lines as unknown[]) {
      const line = parseStoredLine(l);
      if (line && !seen.has(line.key)) {
        seen.add(line.key);
        lines.push(line);
      }
    }
    variants.push({ id: v.id, label: str(v.label), portionsRaw: str(v.portionsRaw), hoursRaw: str(v.hoursRaw), lines });
  }
  return {
    v: 1,
    draft: {
      templateId: typeof d.templateId === "string" && d.templateId ? d.templateId : null,
      updatedAt: typeof d.updatedAt === "string" && d.updatedAt ? d.updatedAt : null,
      name: d.name,
      cakeId: typeof d.cakeId === "string" && d.cakeId ? d.cakeId : null,
      note: str(d.note),
      variants,
    },
    selectedId: typeof s.selectedId === "string" ? s.selectedId : null,
    savedAt: str(s.savedAt),
  };
}

/** Fixed-cost lines matching today's library (one was added or removed since the draft was kept). */
export function reconcileSheetFixed(d: SheetDraft, items: CostItem[]): SheetDraft {
  const fixed = items.filter((i) => i.kind === "fixed");
  const fixedIds = new Set(fixed.map((i) => i.id));
  return {
    ...d,
    variants: d.variants.map((v) => {
      const kept = v.lines.filter((l) => l.kind !== "fixed" || (l.costItemId && fixedIds.has(l.costItemId)));
      const present = new Set(kept.filter((l) => l.kind === "fixed").map((l) => l.costItemId));
      const added = fixed
        .filter((i) => !present.has(i.id))
        .map((i) => ({ ...lineFromItem(i, true), key: fixedLineKey(i.id) }));
      return { ...v, lines: [...added, ...kept] };
    }),
  };
}

/** The sheets (and their sizes) whose variable lines use this cost. */
export function sheetsUsing(templates: PriceTemplate[], costItemId: string): Array<{ name: string; sizes: string[] }> {
  const out: Array<{ name: string; sizes: string[] }> = [];
  for (const t of templates) {
    const sizes = t.variants
      .filter((v) => v.lines.some((l) => l.kind === "variable" && l.costItemId === costItemId))
      .map((v) => v.label);
    if (sizes.length) out.push({ name: t.name, sizes });
  }
  return out;
}

/** « Number cake (10 parts, 15 parts), Layer cake (Grand modèle) » */
export function usageText(usage: Array<{ name: string; sizes: string[] }>): string {
  return usage.map((u) => `${quoted(u.name)} (${u.sizes.join(", ")})`).join(", ");
}
