// In-progress calculation state ("draft") for the Calculer tab: what she is
// typing, kept as raw strings so inputs never reformat under her thumb, and
// converted to QuoteLine[] for computePrice() / the API.

import type {
  CostItem, PriceQuote, PricingSettings, QuoteInput, QuoteLine,
} from "@/lib/pricing-types";
import { fixedLineKey } from "@/lib/pricing-templates";
import {
  compatibleUnits, isAmbiguousNumber, isUnitCode, parseDecimal, parseHours, UNITS, type UnitCode,
} from "@/lib/pricing-units";
import { numberToRaw } from "./format";

export interface DraftLine extends QuoteLine {
  qtyRaw: string;
  amountRaw: string; // extras only: the amount being typed
  included: boolean; // fixed lines can be unticked for one cake
}

export type CalcSettings = Pick<PricingSettings, "hourlyRate" | "marginPercent" | "roundTo">;

export interface CalcDraft {
  v: 2;
  quoteId: string | null; // saved quote being edited, null for a new calculation
  quoteUpdatedAt: string | null; // updatedAt of that quote when it was loaded / last saved
  name: string;
  note: string;
  hoursRaw: string;
  portionsRaw: string;
  lines: DraftLine[];
  // The settings the shown price is computed with: the current ones for a new
  // calculation, the quote's own for an opened devis (so its price doesn't move).
  settings: CalcSettings;
  dirty: boolean; // unsaved changes
  rev: number; // bumped by every edit, so a save response can tell she kept typing
}

export function pickSettings(s: CalcSettings): CalcSettings {
  return { hourlyRate: s.hourlyRate, marginPercent: s.marginPercent, roundTo: s.roundTo };
}

export function sameSettings(a: CalcSettings, b: CalcSettings): boolean {
  return a.hourlyRate === b.hourlyRate && a.marginPercent === b.marginPercent && a.roundTo === b.roundTo;
}

export function newKey(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** Smallest unit of the family: an item bought per kg is entered in grams. */
export function defaultQtyUnit(unit: UnitCode): UnitCode {
  return compatibleUnits(unit).reduce(
    (best, u) => (UNITS[u].toBase < UNITS[best].toBase ? u : best),
    unit
  );
}

/** A line snapshotting the item's current price. */
export function lineFromItem(item: CostItem, included = true): DraftLine {
  const fixed = item.kind === "fixed";
  return {
    // Fixed lines get a stable key (one per item) so server and client renders
    // match — the same key price sheets use, so their lines drop straight in.
    key: fixed ? fixedLineKey(item.id) : newKey("v"),
    costItemId: item.id,
    kind: item.kind,
    name: item.name,
    price: item.price,
    priceQty: item.priceQty,
    unit: item.unit,
    customUnit: item.customUnit,
    qty: fixed ? 1 : 0,
    qtyUnit: fixed ? item.unit : defaultQtyUnit(item.unit),
    qtyRaw: fixed ? "1" : "",
    amountRaw: "",
    included,
  };
}

export function extraLine(): DraftLine {
  return {
    key: newKey("x"),
    costItemId: null,
    kind: "extra",
    name: "",
    price: 0,
    priceQty: 1,
    unit: "forfait",
    qty: 1,
    qtyUnit: "forfait",
    qtyRaw: "1",
    amountRaw: "",
    included: true,
  };
}

/**
 * Lists every fixed cost of `items` that the draft doesn't have yet. Ticked
 * for a new calculation; unticked in a loaded quote, so opening an old devis
 * doesn't silently change what it contained.
 */
export function reconcileFixed(draft: CalcDraft, items: CostItem[]): CalcDraft {
  const present = new Set(draft.lines.map((l) => l.costItemId).filter(Boolean));
  const missing = items.filter((i) => i.kind === "fixed" && !present.has(i.id));
  if (!missing.length) return draft;
  return {
    ...draft,
    lines: [...draft.lines, ...missing.map((i) => lineFromItem(i, draft.quoteId === null))],
  };
}

export function newDraft(items: CostItem[], settings: CalcSettings): CalcDraft {
  return reconcileFixed(
    {
      v: 2,
      quoteId: null,
      quoteUpdatedAt: null,
      name: "",
      note: "",
      hoursRaw: "",
      portionsRaw: "",
      lines: [],
      settings: pickSettings(settings),
      dirty: false,
      rev: 0,
    },
    items
  );
}

/** Editable lines from priced ones (keys de-duplicated: they are React keys). */
function toDraftLines(lines: QuoteLine[]): DraftLine[] {
  const seen = new Set<string>();
  return lines.map((l) => {
    const key = l.key && !seen.has(l.key) ? l.key : newKey("q");
    seen.add(key);
    return {
      ...l,
      key,
      qtyRaw: numberToRaw(l.qty),
      amountRaw: l.kind === "extra" ? numberToRaw(l.price) : "",
      included: true,
    };
  });
}

/** `fallback`: current settings, only used for a quote saved before quotes stored theirs. */
export function draftFromQuote(q: PriceQuote, items: CostItem[], fallback: CalcSettings): CalcDraft {
  return reconcileFixed(
    {
      v: 2,
      quoteId: q.id,
      quoteUpdatedAt: q.updatedAt,
      name: q.name,
      note: q.note ?? "",
      hoursRaw: numberToRaw(q.hours),
      portionsRaw: numberToRaw(q.portions),
      lines: toDraftLines(q.lines),
      settings: pickSettings(q.settings ?? fallback),
      dirty: false,
      rev: 0,
    },
    items
  );
}

/**
 * A new, unsaved calculation from already priced lines (a size of a price
 * sheet). Fixed costs absent from `lines` were left out on purpose, so they
 * come unticked instead of being added back by reconcileFixed().
 */
export function draftFromLines(
  src: { name: string; hours: number; portions?: number; lines: QuoteLine[] },
  items: CostItem[],
  settings: CalcSettings
): CalcDraft {
  const lines = toDraftLines(src.lines);
  const present = new Set(lines.map((l) => l.costItemId).filter(Boolean));
  const leftOut = items.filter((i) => i.kind === "fixed" && !present.has(i.id)).map((i) => lineFromItem(i, false));
  return {
    v: 2,
    quoteId: null,
    quoteUpdatedAt: null,
    name: src.name,
    note: "",
    hoursRaw: numberToRaw(src.hours),
    portionsRaw: numberToRaw(src.portions),
    lines: [...lines, ...leftOut],
    settings: pickSettings(settings),
    // Not saved anywhere yet: survives a reload and asks before being replaced.
    dirty: true,
    rev: 0,
  };
}

// ---------- Input checks (each message is shown under the field) ----------

export const AMBIGUOUS_MSG = "Écrivez 1450 (sans point) ou 1,45";

export function numberError(raw: string): string | null {
  if (raw.trim() === "") return null;
  if (isAmbiguousNumber(raw)) return AMBIGUOUS_MSG;
  const n = parseDecimal(raw);
  if (n === null) return "Nombre non reconnu";
  return n < 0 ? "Pas de nombre négatif" : null;
}

export function hoursError(raw: string): string | null {
  if (raw.trim() === "") return null;
  if (isAmbiguousNumber(raw)) return AMBIGUOUS_MSG;
  const h = parseHours(raw);
  if (h === null) return "Nombre non reconnu (ex : 2,5 ou 2h30)";
  return h < 0 ? "Pas de nombre négatif" : null;
}

export function portionsError(raw: string): string | null {
  const err = numberError(raw);
  if (err || raw.trim() === "") return err;
  const p = parseDecimal(raw);
  return p !== null && p > 0 && Number.isInteger(p) ? null : "Un nombre entier, ex : 12";
}

/** Something typed that isn't a usable number (nothing in the calculator can be negative). */
export function isBadRaw(raw: string): boolean {
  return numberError(raw) !== null;
}

/** The input a line needs: the amount for an extra, the quantity otherwise. */
export function lineRaw(l: DraftLine): string {
  return l.kind === "extra" ? l.amountRaw : l.qtyRaw;
}

export interface DraftProblems {
  invalid: number; // fields shown in red
  missingQty: number; // included fixed/variable lines with an empty quantity
  missingAmount: number; // extras without an amount
}

/** The fields a calculation and a price-sheet size have in common. */
export type DraftFields = Pick<CalcDraft, "hoursRaw" | "portionsRaw" | "lines">;

export function draftProblems(d: DraftFields): DraftProblems {
  const p: DraftProblems = { invalid: 0, missingQty: 0, missingAmount: 0 };
  if (hoursError(d.hoursRaw)) p.invalid++;
  if (portionsError(d.portionsRaw)) p.invalid++;
  for (const l of d.lines) {
    if (!l.included) continue;
    const raw = lineRaw(l);
    if (numberError(raw)) p.invalid++;
    else if (raw.trim() === "") {
      if (l.kind === "extra") p.missingAmount++;
      else p.missingQty++;
    }
  }
  return p;
}

/**
 * Why the price can't be trusted yet, or null. `lineErrors` = lines that
 * computePrice() couldn't price (incompatible units…).
 */
export function problemsText(p: DraftProblems, lineErrors: number): string | null {
  const bad = p.invalid + lineErrors;
  if (bad) return bad > 1 ? "corrigez les champs en rouge" : "corrigez le champ en rouge";
  const parts: string[] = [];
  if (p.missingQty) {
    parts.push(p.missingQty === 1 ? "1 ligne sans quantité" : `${p.missingQty} lignes sans quantité`);
  }
  if (p.missingAmount) {
    parts.push(p.missingAmount === 1 ? "1 extra sans montant" : `${p.missingAmount} extras sans montant`);
  }
  return parts.length ? parts.join(" · ") : null;
}

/** Typed number, or 0 when empty / unreadable / negative (the input shows it in red). */
function rawToNumber(raw: string): number {
  const n = parseDecimal(raw);
  return n !== null && n > 0 ? n : 0;
}

/** The QuoteLine a draft line stands for (parsed quantity / amount, UI fields dropped). */
export function toQuoteLine(l: DraftLine): QuoteLine {
  const extra = l.kind === "extra";
  const out: QuoteLine = {
    key: l.key,
    costItemId: l.costItemId,
    kind: l.kind,
    name: extra ? l.name.trim() || "Extra" : l.name,
    price: extra ? rawToNumber(l.amountRaw) : l.price,
    priceQty: l.priceQty,
    unit: l.unit,
    qty: extra ? 1 : rawToNumber(l.qtyRaw),
    qtyUnit: l.qtyUnit,
  };
  if (l.customUnit) out.customUnit = l.customUnit;
  return out;
}

export function toQuoteLines(d: CalcDraft): QuoteLine[] {
  return d.lines.filter((l) => l.included).map(toQuoteLine);
}

export function draftHours(d: Pick<DraftFields, "hoursRaw">): number {
  const h = parseHours(d.hoursRaw);
  return h !== null && h > 0 ? h : 0;
}

/** Whole number of parts, or undefined (empty or not a whole number). */
export function draftPortions(d: Pick<DraftFields, "portionsRaw">): number | undefined {
  const p = parseDecimal(d.portionsRaw);
  return p !== null && p > 0 && Number.isInteger(p) ? p : undefined;
}

export function toQuoteInput(d: CalcDraft): QuoteInput {
  return {
    name: d.name.trim(),
    note: d.note.trim() || undefined,
    hours: draftHours(d),
    portions: draftPortions(d),
    lines: toQuoteLines(d),
    settings: pickSettings(d.settings),
  };
}

// ---------- Library prices that changed since the snapshot ----------

/** True when the library price differs from the line's snapshot. */
export function isStale(line: QuoteLine, item: CostItem): boolean {
  return (
    line.kind !== item.kind ||
    line.price !== item.price ||
    line.priceQty !== item.priceQty ||
    line.unit !== item.unit ||
    (line.customUnit ?? "") !== (item.customUnit ?? "")
  );
}

/** Included lines whose library price changed (unticked lines don't affect the price). */
export function staleLines(d: CalcDraft, items: CostItem[]): Array<{ line: DraftLine; item: CostItem }> {
  const byId = new Map(items.map((i) => [i.id, i]));
  const out: Array<{ line: DraftLine; item: CostItem }> = [];
  for (const line of d.lines) {
    const item = line.included && line.costItemId ? byId.get(line.costItemId) : undefined;
    if (item && isStale(line, item)) out.push({ line, item });
  }
  return out;
}

export function refreshLine(line: DraftLine, item: CostItem): DraftLine {
  const next: DraftLine = {
    ...line,
    kind: item.kind,
    name: item.name,
    price: item.price,
    priceQty: item.priceQty,
    unit: item.unit,
    customUnit: item.customUnit,
  };
  if (item.kind === "fixed") {
    next.qtyUnit = item.unit;
    if (line.kind !== "fixed") next.qtyRaw = "1";
  } else if (line.kind !== "variable" || !compatibleUnits(item.unit).includes(line.qtyUnit)) {
    // The old number meant something else ("× 1" for a fixed cost, 200 g for
    // an item now sold per piece): leave it empty so she types the real one.
    next.qtyUnit = defaultQtyUnit(item.unit);
    next.qtyRaw = "";
    next.included = true; // variable lines have no checkbox
  }
  return next;
}

/**
 * Refreshes every line whose item still exists and whose price changed.
 * An unticked fixed line whose item became variable is dropped: it wasn't
 * used in this cake and variable lines can't be unticked.
 */
export function refreshStale(d: CalcDraft, items: CostItem[]): CalcDraft {
  const byId = new Map(items.map((i) => [i.id, i]));
  return {
    ...d,
    lines: d.lines.flatMap((l) => {
      const item = l.costItemId ? byId.get(l.costItemId) : undefined;
      if (!item || !isStale(l, item)) return [l];
      if (!l.included && item.kind === "variable") return [];
      return [refreshLine(l, item)];
    }),
  };
}

// ---------- localStorage ----------

function parseSettings(raw: unknown): CalcSettings | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  const ok = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0;
  return ok(s.hourlyRate) && ok(s.marginPercent) && ok(s.roundTo)
    ? { hourlyRate: s.hourlyRate, marginPercent: s.marginPercent, roundTo: s.roundTo }
    : null;
}

/** Shape check for one stored line (also used for the price-sheet editor draft). */
export function parseStoredLine(raw: unknown): DraftLine | null {
  if (!raw || typeof raw !== "object") return null;
  const l = raw as Record<string, unknown>;
  const finite = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);
  if (
    typeof l.key !== "string" ||
    !l.key ||
    (l.kind !== "fixed" && l.kind !== "variable" && l.kind !== "extra") ||
    !(typeof l.costItemId === "string" || l.costItemId === null) ||
    typeof l.name !== "string" ||
    typeof l.qtyRaw !== "string" ||
    !finite(l.price) ||
    !finite(l.priceQty) ||
    !isUnitCode(l.unit) ||
    !isUnitCode(l.qtyUnit)
  ) {
    return null;
  }
  return {
    key: l.key,
    costItemId: l.costItemId,
    kind: l.kind,
    name: l.name,
    price: l.price,
    priceQty: l.priceQty,
    unit: l.unit,
    customUnit: typeof l.customUnit === "string" && l.customUnit ? l.customUnit : undefined,
    qty: finite(l.qty) ? l.qty : 0,
    qtyUnit: l.qtyUnit,
    qtyRaw: l.qtyRaw,
    amountRaw: typeof l.amountRaw === "string" ? l.amountRaw : "",
    included: l.included !== false,
  };
}

/**
 * Shape check for a draft read back from localStorage. Invalid or duplicate
 * lines are dropped; `fallback` settings fill in a draft saved before v2.
 */
export function parseStoredDraft(raw: unknown, fallback: CalcSettings): CalcDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  if (
    (d.v !== 1 && d.v !== 2) ||
    !Array.isArray(d.lines) ||
    typeof d.name !== "string" ||
    typeof d.hoursRaw !== "string" ||
    typeof d.portionsRaw !== "string"
  ) {
    return null;
  }
  const seen = new Set<string>();
  const lines: DraftLine[] = [];
  for (const x of d.lines) {
    const line = parseStoredLine(x);
    if (!line || seen.has(line.key)) continue;
    seen.add(line.key);
    lines.push(line);
  }
  return {
    v: 2,
    quoteId: typeof d.quoteId === "string" && d.quoteId ? d.quoteId : null,
    quoteUpdatedAt: typeof d.quoteUpdatedAt === "string" ? d.quoteUpdatedAt : null,
    name: d.name,
    note: typeof d.note === "string" ? d.note : "",
    hoursRaw: d.hoursRaw,
    portionsRaw: d.portionsRaw,
    lines,
    settings: parseSettings(d.settings) ?? pickSettings(fallback),
    dirty: d.dirty === true,
    rev: typeof d.rev === "number" && Number.isFinite(d.rev) ? d.rev : 0,
  };
}
