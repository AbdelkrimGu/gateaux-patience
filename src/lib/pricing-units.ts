// Units for the price calculator. A cost is bought in one unit (1 kg of almonds)
// and used in another of the same family (200 g in this cake), so every unit
// knows its family and its factor to the family's base unit.

export type UnitFamily = "mass" | "volume" | "length" | "count" | "flat" | "custom";

export const UNITS = {
  g: { family: "mass", toBase: 1, label: "g" },
  kg: { family: "mass", toBase: 1000, label: "kg" },
  ml: { family: "volume", toBase: 1, label: "ml" },
  cl: { family: "volume", toBase: 10, label: "cl" },
  l: { family: "volume", toBase: 1000, label: "L" },
  cm: { family: "length", toBase: 1, label: "cm" },
  m: { family: "length", toBase: 100, label: "m" },
  piece: { family: "count", toBase: 1, label: "pièce(s)" },
  forfait: { family: "flat", toBase: 1, label: "forfait" },
  custom: { family: "custom", toBase: 1, label: "autre" },
} as const satisfies Record<string, { family: UnitFamily; toBase: number; label: string }>;

export type UnitCode = keyof typeof UNITS;

export const UNIT_CODES = Object.keys(UNITS) as UnitCode[];

/** Units offered when creating a variable cost (not "forfait"). */
export const VARIABLE_UNIT_CODES = UNIT_CODES.filter((u) => u !== "forfait");

export function isUnitCode(v: unknown): v is UnitCode {
  return typeof v === "string" && Object.prototype.hasOwnProperty.call(UNITS, v);
}

/** Units a quantity can be entered in for an item priced in `unit`. */
export function compatibleUnits(unit: UnitCode): UnitCode[] {
  const family = UNITS[unit].family;
  if (family === "custom" || family === "flat") return [unit];
  return UNIT_CODES.filter((u) => UNITS[u].family === family);
}

/** Unit label; pass `qty` to get "pièce" / "pièces", "couche" / "couches". */
export function unitLabel(unit: UnitCode, customUnit?: string, qty?: number): string {
  const plural = qty !== undefined && Math.abs(qty) >= 2;
  if (unit === "piece") return qty === undefined ? "pièce(s)" : plural ? "pièces" : "pièce";
  if (unit !== "custom") return UNITS[unit].label;
  const label = customUnit?.trim() || "unité";
  return plural && !/[sxz]$/i.test(label) ? `${label}s` : label;
}

/**
 * Converts `qty` from one unit to another of the same family.
 * Returns null when the units are not compatible.
 */
export function convertQty(qty: number, from: UnitCode, to: UnitCode): number | null {
  if (from === to) return qty;
  const a = UNITS[from];
  const b = UNITS[to];
  if (a.family !== b.family || a.family === "custom" || a.family === "flat") return null;
  return (qty * a.toBase) / b.toBase;
}

/** Spaces removed, Arabic-Indic digits (١٢٣ / ۱۲۳) and separators made Latin, lowercased. */
function normalizeNumberText(raw: string): string {
  return raw
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/٫/g, ",")
    .replace(/[\s  ٬]/g, "")
    .toLowerCase();
}

const SUFFIX = /(da|dzd|%)$/;

/**
 * "1.450" or "2.500" — a dot used as a thousands separator, common in Algeria.
 * Reading it as 1,45 would silently underprice, so these are rejected and the
 * UI asks her to write 1450 or 1,45.
 */
export function isAmbiguousNumber(raw: string): boolean {
  return /^-?\d{1,3}(\.\d{3})+$/.test(normalizeNumberText(raw).replace(SUFFIX, ""));
}

/**
 * Accepts "1,5", "1.5", " 1 250 ", "1250 DA", "20 %" and Arabic-Indic digits.
 * Returns null for anything else, including the ambiguous "1.450".
 */
export function parseDecimal(raw: string): number | null {
  if (isAmbiguousNumber(raw)) return null;
  const s = normalizeNumberText(raw).replace(SUFFIX, "").replace(",", ".");
  if (s === "" || !/^-?\d*\.?\d+$|^-?\d+\.$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Hours of work: "2,5", "2h30", "2 h 30", "2:30", "2h", "45min" → decimal hours. */
export function parseHours(raw: string): number | null {
  const s = normalizeNumberText(raw);
  const hm = s.match(/^(\d+)(?:h|:)(\d{1,2})?(?:min|mn|m)?$/);
  if (hm) {
    const minutes = hm[2] ? Number(hm[2]) : 0;
    return minutes < 60 ? Number(hm[1]) + minutes / 60 : null;
  }
  const m = s.match(/^(\d+)(?:min|mn|m)$/);
  if (m) return Number(m[1]) / 60;
  return parseDecimal(s.replace(/h$/, ""));
}

const intFormat = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const centsFormat = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "1 450 DA", or "5 352,30 DA" when there are centimes (never "5 352,3"). */
export function formatDA(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return `${(Number.isInteger(rounded) ? intFormat : centsFormat).format(rounded)} DA`;
}

const qtyFormat = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 3 });

export function formatQty(n: number): string {
  return qtyFormat.format(n);
}
