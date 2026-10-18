// Validation + normalisation of everything the pricing API accepts.
// Zod strips unknown keys, so only whitelisted fields survive a parse.
// Error messages are French: the admin UI shows them as-is to the owner.

import { z, type ZodErrorMap, type ZodIssue } from "zod";
import { computePrice } from "./pricing-formula";
import type {
  CostItem,
  CostItemInput,
  FixedOverride,
  PricingSettings,
  QuoteInput,
  QuoteLine,
  TemplateInput,
  TemplateLine,
  TemplateVariantInput,
} from "./pricing-types";
import { UNIT_CODES, compatibleUnits, formatQty, type UnitCode } from "./pricing-units";

export type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

// ---------------------------------------------------------------------------
// French error messages
// ---------------------------------------------------------------------------

const FIELD_LABELS: Record<string, string> = {
  name: "Nom",
  kind: "Type",
  group: "Groupe",
  price: "Prix",
  priceQty: "Quantité d'achat",
  unit: "Unité",
  customUnit: "Nom de l'unité",
  note: "Note",
  hourlyRate: "Taux horaire",
  marginPercent: "Marge",
  roundTo: "Arrondi",
  settings: "Réglages",
  hours: "Heures de travail",
  portions: "Nombre de parts",
  lines: "Lignes",
  key: "Identifiant de ligne",
  costItemId: "Article",
  qty: "Quantité",
  qtyUnit: "Unité de la quantité",
  amount: "Montant",
  label: "Nom de la taille",
  cakeId: "Gâteau",
  variants: "Tailles",
  fixedOverrides: "Coûts fixes",
  id: "Identifiant",
};

function pathLabel(path: (string | number)[]): string {
  if (path[0] === "lines" && typeof path[1] === "number") {
    const field = typeof path[2] === "string" ? FIELD_LABELS[path[2]] ?? path[2] : null;
    return field ? `Ligne ${path[1] + 1}, ${field.toLowerCase()}` : `Ligne ${path[1] + 1}`;
  }
  const last = [...path].reverse().find((p): p is string => typeof p === "string");
  return last ? FIELD_LABELS[last] ?? last : "";
}

const n = (v: number | bigint) => formatQty(Number(v));

// Returns only the reason; the field label is prepended by formatIssue().
const frErrorMap: ZodErrorMap = (issue) => {
  switch (issue.code) {
    case "invalid_type":
      if (issue.received === "undefined" || issue.received === "null") return { message: "obligatoire" };
      if (issue.expected === "integer") return { message: "doit être un nombre entier" };
      if (issue.expected === "number") return { message: "doit être un nombre" };
      if (issue.expected === "string") return { message: "doit être un texte" };
      if (issue.expected === "array") return { message: "doit être une liste" };
      return { message: "valeur invalide" };
    case "too_small":
      if (issue.type === "string") {
        return { message: Number(issue.minimum) <= 1 ? "obligatoire" : `${n(issue.minimum)} caractères minimum` };
      }
      if (issue.type === "number") {
        if (issue.inclusive && Number(issue.minimum) === 0) return { message: "ne peut pas être négatif" };
        return { message: issue.inclusive ? `doit être au moins ${n(issue.minimum)}` : `doit être supérieur à ${n(issue.minimum)}` };
      }
      return { message: "trop court" };
    case "too_big":
      if (issue.type === "string") return { message: `${n(issue.maximum)} caractères maximum` };
      if (issue.type === "number") {
        return { message: issue.inclusive ? `ne peut pas dépasser ${n(issue.maximum)}` : `doit être inférieur à ${n(issue.maximum)}` };
      }
      if (issue.type === "array") return { message: `${n(issue.maximum)} éléments maximum` };
      return { message: "trop long" };
    case "not_finite":
      return { message: "doit être un nombre valide" };
    case "invalid_enum_value":
    case "invalid_union_discriminator":
    case "invalid_literal":
      return { message: "valeur non reconnue" };
    default:
      return { message: "valeur invalide" };
  }
};

type PathLabeler = (path: (string | number)[]) => string;

function formatIssue(issue: ZodIssue | undefined, labeler: PathLabeler = pathLabel): string {
  if (!issue) return "Données invalides";
  const label = labeler(issue.path);
  if (!label) return issue.code === "invalid_type" ? "Données invalides" : issue.message;
  return `${label} : ${issue.message}`;
}

function run<S extends z.ZodTypeAny>(
  schema: S,
  raw: unknown,
  labeler?: PathLabeler
): ParseResult<z.output<S>> {
  const res = schema.safeParse(raw, { errorMap: frErrorMap });
  if (res.success) return { ok: true, data: res.data };
  return { ok: false, error: formatIssue(res.error.issues[0], labeler) };
}

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

const num = (min: number, max: number) => z.number().finite().min(min).max(max);
const requiredText = (max: number) => z.string().trim().min(1).max(max);
/** Optional text: trimmed, and "" / null become "absent". */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : undefined));

const unitSchema = z.enum(UNIT_CODES as [UnitCode, ...UnitCode[]]);

const PRICE_MAX = 10_000_000;
const PRICE_QTY_MAX = 1_000_000;
// A smaller purchase quantity makes the unit price explode (and is a typo anyway).
const PRICE_QTY_MIN = 0.001;
// Above this a quote total is a typo, and float maths stops being exact to the centime.
const RESULT_MAX = 1e10;

const priceQtySchema = num(PRICE_QTY_MIN, PRICE_QTY_MAX);

// ---------------------------------------------------------------------------
// Cost items
// ---------------------------------------------------------------------------

const costCommon = {
  name: requiredText(80),
  group: optionalText(40),
  price: num(0, PRICE_MAX),
  note: optionalText(300),
};

// Fixed costs ignore whatever priceQty/unit was sent: they are always "per cake".
const costItemSchema = z
  .discriminatedUnion("kind", [
    z.object({ ...costCommon, kind: z.literal("fixed") }),
    z.object({
      ...costCommon,
      kind: z.literal("variable"),
      priceQty: priceQtySchema,
      unit: unitSchema,
      customUnit: optionalText(20),
    }),
  ])
  .superRefine((v, ctx) => {
    if (v.kind !== "variable") return;
    if (v.unit === "forfait") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["unit"],
        message: "un coût variable a besoin d'une unité de mesure (g, kg, L, pièce…)",
      });
    } else if (v.unit === "custom" && !v.customUnit) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["customUnit"], message: "obligatoire" });
    }
  })
  .transform((v): CostItemInput => {
    const base = { name: v.name, group: v.group, price: v.price, note: v.note };
    if (v.kind === "fixed") {
      return { ...base, kind: "fixed", priceQty: 1, unit: "forfait", customUnit: undefined };
    }
    return {
      ...base,
      kind: "variable",
      priceQty: v.priceQty,
      unit: v.unit,
      customUnit: v.unit === "custom" ? v.customUnit : undefined,
    };
  });

export const COST_ITEM_FIELDS = [
  "name",
  "kind",
  "group",
  "price",
  "priceQty",
  "unit",
  "customUnit",
  "note",
] as const satisfies readonly (keyof CostItemInput)[];

/** Unvalidated editable keys of a PUT body (validated once merged with the stored item). */
export type RawCostItemPatch = Partial<Record<(typeof COST_ITEM_FIELDS)[number], unknown>>;

export function parseCostItemInput(raw: unknown): ParseResult<CostItemInput> {
  return run(costItemSchema, raw);
}

function isPlainObject(raw: unknown): raw is Record<string, unknown> {
  return !!raw && typeof raw === "object" && !Array.isArray(raw);
}

/**
 * Keeps only the editable keys of a PUT body (so `expectedUpdatedAt` and
 * anything else is dropped); null when the body isn't an object.
 */
export function pickCostItemPatch(raw: unknown): RawCostItemPatch | null {
  if (!isPlainObject(raw)) return null;
  const patch: RawCostItemPatch = {};
  for (const k of COST_ITEM_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(raw, k)) patch[k] = raw[k];
  }
  return patch;
}

/**
 * The `updatedAt` the screen was loaded with (optimistic concurrency).
 * Absent / null → undefined, meaning "no check" (last write wins).
 */
export function pickExpectedUpdatedAt(raw: unknown): ParseResult<string | undefined> {
  const v = isPlainObject(raw) ? raw.expectedUpdatedAt : undefined;
  if (v === undefined || v === null) return { ok: true, data: undefined };
  if (typeof v !== "string" || !v || v.length > 64) return { ok: false, error: "Données invalides" };
  return { ok: true, data: v };
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

// Also used for the snapshot sent with each quote. z.object strips `updatedAt`.
const settingsSchema = z.object({
  hourlyRate: num(0, 100_000),
  marginPercent: num(0, 1000),
  roundTo: z.number().int().min(0).max(100_000),
});

export type PricingSettingsInput = Omit<PricingSettings, "updatedAt">;

export function parsePricingSettings(raw: unknown): ParseResult<PricingSettingsInput> {
  return run(settingsSchema, raw);
}

// ---------------------------------------------------------------------------
// Quotes
// ---------------------------------------------------------------------------

const quoteLineSchema = z
  .object({
    key: requiredText(64),
    costItemId: z
      .string()
      .trim()
      .max(64)
      .nullish()
      .transform((v) => v || null),
    kind: z.enum(["fixed", "variable", "extra"]),
    name: requiredText(100),
    price: num(0, PRICE_MAX),
    priceQty: priceQtySchema,
    unit: unitSchema,
    customUnit: optionalText(20),
    qty: num(0, PRICE_QTY_MAX),
    qtyUnit: unitSchema,
  })
  .superRefine((l, ctx) => {
    if (l.kind !== "variable") return;
    if (l.unit === "forfait") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["unit"], message: "unité de mesure manquante" });
    } else if (!compatibleUnits(l.unit).includes(l.qtyUnit)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["qtyUnit"], message: "incompatible avec l'unité du prix" });
    }
  })
  .transform((l): QuoteLine => {
    if (l.kind === "variable") {
      return {
        key: l.key,
        costItemId: l.costItemId,
        kind: "variable",
        name: l.name,
        price: l.price,
        priceQty: l.priceQty,
        unit: l.unit,
        customUnit: l.unit === "custom" ? l.customUnit : undefined,
        qty: l.qty,
        qtyUnit: l.qtyUnit,
      };
    }
    // fixed / extra: flat amount × multiplier, units are meaningless.
    return {
      key: l.key,
      costItemId: l.kind === "extra" ? null : l.costItemId,
      kind: l.kind,
      name: l.name,
      price: l.price,
      priceQty: 1,
      unit: "forfait",
      qty: l.qty,
      qtyUnit: "forfait",
    };
  });

const quoteSchema = z
  .object({
    name: requiredText(100),
    note: optionalText(500),
    hours: num(0, 500),
    portions: z
      .number()
      .int()
      .min(0)
      .max(10_000)
      .nullish()
      .transform((v) => (v ? v : undefined)),
    lines: z.array(quoteLineSchema).max(200).default([]),
    settings: settingsSchema,
  })
  .superRefine((q, ctx) => {
    const seen = new Set<string>();
    let duplicate = false;
    q.lines.forEach((l, i) => {
      if (seen.has(l.key)) {
        duplicate = true;
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["lines", i], message: "identifiant en double" });
      }
      seen.add(l.key);
    });
    if (duplicate) return;
    // Each field is bounded, but 200 lines × big quantities × margin can still overflow.
    const { costTotal, finalPrice } = computePrice(q);
    const tooBig = (v: number) => !Number.isFinite(v) || v > RESULT_MAX;
    if (tooBig(costTotal) || tooBig(finalPrice)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [], message: "Montant trop grand pour être calculé" });
    }
  })
  .transform(
    (q): QuoteInput => ({
      name: q.name,
      note: q.note,
      hours: q.hours,
      portions: q.portions,
      lines: q.lines,
      settings: {
        hourlyRate: q.settings.hourlyRate,
        marginPercent: q.settings.marginPercent,
        roundTo: q.settings.roundTo,
      },
    })
  );

/**
 * `settings` must be the ones the calculator displayed the price with: they are
 * stored as the quote's snapshot and used to compute its saved result.
 */
export function parseQuoteInput(raw: unknown): ParseResult<QuoteInput> {
  if (isPlainObject(raw) && (raw.settings === undefined || raw.settings === null)) {
    return { ok: false, error: "Réglages manquants" };
  }
  return run(quoteSchema, raw);
}

// ---------------------------------------------------------------------------
// Price sheets ("fiches prix")
// ---------------------------------------------------------------------------

const portionsSchema = z
  .number()
  .int()
  .min(0)
  .max(10_000)
  .nullish()
  .transform((v) => (v ? v : undefined));

// Prices are never accepted here: variable lines are priced from the library.
const templateLineSchema = z
  .discriminatedUnion("kind", [
    z.object({
      kind: z.literal("variable"),
      key: requiredText(64),
      costItemId: requiredText(64),
      name: optionalText(100), // replaced by the library name at save time
      qty: z.number().finite().gt(0).max(PRICE_QTY_MAX),
      qtyUnit: unitSchema,
    }),
    z.object({
      kind: z.literal("extra"),
      key: requiredText(64),
      name: requiredText(100),
      amount: num(0, PRICE_MAX),
    }),
  ])
  .superRefine((l, ctx) => {
    if (l.kind === "variable" && l.qtyUnit === "forfait") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["qtyUnit"],
        message: "doit être une unité de mesure (g, kg, L, pièce…)",
      });
    }
  })
  .transform((l): TemplateLine => {
    if (l.kind === "variable") {
      return {
        key: l.key,
        kind: "variable",
        costItemId: l.costItemId,
        name: l.name ?? "",
        qty: l.qty,
        qtyUnit: l.qtyUnit,
      };
    }
    return {
      key: l.key,
      kind: "extra",
      costItemId: null,
      name: l.name,
      qty: 1,
      qtyUnit: "forfait",
      amount: l.amount,
    };
  });

const fixedOverrideSchema = z
  .object({ costItemId: requiredText(64), qty: num(0, 1000) })
  .transform((o): FixedOverride => ({ costItemId: o.costItemId, qty: o.qty }));

const templateVariantSchema = z
  .object({
    id: requiredText(64),
    label: requiredText(60),
    portions: portionsSchema,
    hours: num(0, 500),
    lines: z.array(templateLineSchema).max(150, { message: "150 lignes maximum" }).default([]),
    fixedOverrides: z.array(fixedOverrideSchema).max(200).default([]),
  })
  .superRefine((v, ctx) => {
    const keys = new Set<string>();
    v.lines.forEach((l, i) => {
      if (keys.has(l.key)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["lines", i, "key"], message: "en double" });
      }
      keys.add(l.key);
    });
    const items = new Set<string>();
    v.fixedOverrides.forEach((o, i) => {
      if (items.has(o.costItemId)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["fixedOverrides", i], message: "en double" });
      }
      items.add(o.costItemId);
    });
  })
  .transform(
    (v): TemplateVariantInput => ({
      id: v.id,
      label: v.label,
      portions: v.portions,
      hours: v.hours,
      lines: v.lines,
      fixedOverrides: v.fixedOverrides,
    })
  );

const templateSchema = z
  .object({
    name: requiredText(100),
    cakeId: optionalText(100),
    note: optionalText(500),
    variants: z
      .array(templateVariantSchema)
      .min(1, { message: "ajoutez au moins une taille" })
      .max(12, { message: "12 tailles maximum" }),
  })
  .superRefine((t, ctx) => {
    const ids = new Set<string>();
    t.variants.forEach((v, i) => {
      if (ids.has(v.id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["variants", i, "id"], message: "en double" });
      }
      ids.add(v.id);
    });
  })
  .transform(
    (t): TemplateInput => ({ name: t.name, cakeId: t.cakeId, note: t.note, variants: t.variants })
  );

/** Size name as she typed it, to point at the right size in an error. */
function rawVariantLabel(raw: unknown, index: number): string | null {
  if (!isPlainObject(raw) || !Array.isArray(raw.variants)) return null;
  const v: unknown = raw.variants[index];
  if (!isPlainObject(v) || typeof v.label !== "string") return null;
  const label = v.label.trim();
  return label && label.length <= 60 ? label : null;
}

const variantName = (label: string) => `Taille "${label}"`;

/** « Taille "10 parts", ligne 2, quantité » instead of « variants.0.lines.1.qty ». */
function templatePathLabeler(raw: unknown): PathLabeler {
  return (path) => {
    if (path[0] !== "variants" || typeof path[1] !== "number") return pathLabel(path);
    const label = rawVariantLabel(raw, path[1]);
    const parts = [label ? variantName(label) : `Taille ${path[1] + 1}`];
    let rest = path.slice(2);
    if ((rest[0] === "lines" || rest[0] === "fixedOverrides") && typeof rest[1] === "number") {
      parts.push(`${rest[0] === "lines" ? "ligne" : "coût fixe"} ${rest[1] + 1}`);
      rest = rest.slice(2);
    }
    const field = rest.find((p): p is string => typeof p === "string");
    if (field) parts.push((FIELD_LABELS[field] ?? field).toLowerCase());
    return parts.join(", ");
  };
}

/** Shape check only; see checkTemplateAgainstLibrary() for the cost items. */
export function parseTemplateInput(raw: unknown): ParseResult<TemplateInput> {
  return run(templateSchema, raw, templatePathLabeler(raw));
}

/**
 * Second pass at save time, against today's cost library: every variable line
 * must point at an existing variable cost, with a compatible unit (its name is
 * refreshed from the library). Overrides of unknown or non-fixed costs are
 * dropped silently — they have no effect anyway.
 */
export function checkTemplateAgainstLibrary(
  input: TemplateInput,
  costItems: CostItem[]
): ParseResult<TemplateInput> {
  const byId = new Map(costItems.map((c) => [c.id, c]));
  const variants: TemplateVariantInput[] = [];

  for (const v of input.variants) {
    const lines: TemplateLine[] = [];
    for (let i = 0; i < v.lines.length; i++) {
      const l = v.lines[i];
      if (l.kind !== "variable") {
        lines.push(l);
        continue;
      }
      const item = l.costItemId ? byId.get(l.costItemId) : undefined;
      if (!item || item.kind !== "variable") {
        return {
          ok: false,
          error: `${variantName(v.label)}, ${l.name || `ligne ${i + 1}`} : ce coût n'existe plus dans la liste`,
        };
      }
      if (!compatibleUnits(item.unit).includes(l.qtyUnit)) {
        return { ok: false, error: `${variantName(v.label)}, ${item.name} : unité incompatible` };
      }
      lines.push({ ...l, name: item.name });
    }
    const fixedOverrides = v.fixedOverrides.filter((o) => byId.get(o.costItemId)?.kind === "fixed");
    variants.push({ ...v, lines, fixedOverrides });
  }
  return { ok: true, data: { ...input, variants } };
}
