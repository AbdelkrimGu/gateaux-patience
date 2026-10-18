// Server-only data layer for the admin price calculator (/admin/pricing).
// Inputs reaching create/update are already validated (pricing-validation.ts);
// documents are still built field by field so nothing else can reach Mongo.

import { randomUUID } from "crypto";
import {
  getPricingCostsCollection,
  getPricingQuotesCollection,
  getPricingSettingsCollection,
} from "./mongodb";
import { computePrice } from "./pricing-formula";
import {
  DEFAULT_PRICING_SETTINGS,
  type CostItem,
  type CostItemInput,
  type PriceChange,
  type PriceQuote,
  type PricingSettings,
  type QuoteInput,
  type QuoteLine,
} from "./pricing-types";
import { UNITS, isUnitCode } from "./pricing-units";
import {
  parseCostItemInput,
  type PricingSettingsInput,
  type RawCostItemPatch,
} from "./pricing-validation";

const PROJECT_NO_ID = { _id: 0 } as const;
const FR_COLLATION = { locale: "fr", strength: 1 } as const;
const PRICE_HISTORY_MAX = 20;
const SETTINGS_ID = "default";
// Without an expected version, a concurrent edit between our read and write is retried.
const UPDATE_ATTEMPTS = 3;

/** The driver stores `undefined` as null — drop those keys instead. */
export function compact<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

/** Splits optional fields into $set (present) and $unset (absent). */
export function optionalFields<K extends string>(values: Record<K, unknown>) {
  const set: Partial<Record<K, unknown>> = {};
  const unset: Partial<Record<K, "">> = {};
  for (const k of Object.keys(values) as K[]) {
    if (values[k] === undefined) unset[k] = "";
    else set[k] = values[k];
  }
  return { set, unset };
}

// ---------------------------------------------------------------------------
// Cost items
// ---------------------------------------------------------------------------

export async function getCostItems(): Promise<CostItem[]> {
  const col = await getPricingCostsCollection();
  const docs = await col
    .find({}, { projection: PROJECT_NO_ID, collation: FR_COLLATION })
    .sort({ kind: 1, group: 1, name: 1 })
    .toArray();
  return docs as unknown as CostItem[];
}

export async function getCostItemById(id: string): Promise<CostItem | null> {
  const col = await getPricingCostsCollection();
  const doc = await col.findOne({ id }, { projection: PROJECT_NO_ID });
  return (doc as unknown as CostItem) || null;
}

export async function createCostItem(input: CostItemInput): Promise<CostItem> {
  const col = await getPricingCostsCollection();
  const now = new Date().toISOString();
  const item: CostItem = compact({
    id: randomUUID(),
    name: input.name,
    kind: input.kind,
    group: input.group,
    price: input.price,
    priceQty: input.priceQty,
    unit: input.unit,
    customUnit: input.customUnit,
    note: input.note,
    priceHistory: [],
    createdAt: now,
    updatedAt: now,
  });
  // insertOne mutates its argument with _id; keep the returned object clean.
  await col.insertOne({ ...item });
  return item;
}

export type UpdateCostItemResult =
  | { ok: true; item: CostItem }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "conflict" }
  | { ok: false; reason: "invalid"; error: string };

type PriceDef = Pick<CostItem, "price" | "priceQty" | "unit" | "customUnit">;

const sameNumber = (a: number, b: number) =>
  a === b || Math.abs(a - b) <= 1e-9 * Math.max(Math.abs(a), Math.abs(b));

const customLabelKey = (s?: string) => (s ?? "").replace(/\s+/g, "").toLowerCase();

/**
 * True only when what the item really costs changed: 1450 DA/kg → 1,45 DA/g
 * is the same price written differently and must not fill the history.
 */
function isRealPriceChange(before: PriceDef, after: PriceDef): boolean {
  if (!isUnitCode(before.unit) || !isUnitCode(after.unit)) return true;
  const a = UNITS[before.unit];
  const b = UNITS[after.unit];
  if (a.family !== b.family) return true;
  if (a.family === "custom" && customLabelKey(before.customUnit) !== customLabelKey(after.customUnit)) {
    return true;
  }
  const perBaseBefore = before.price / (before.priceQty * a.toBase);
  const perBaseAfter = after.price / (after.priceQty * b.toBase);
  if (!Number.isFinite(perBaseBefore) || !Number.isFinite(perBaseAfter)) {
    return before.price !== after.price || before.priceQty !== after.priceQty;
  }
  return !sameNumber(perBaseBefore, perBaseAfter);
}

/**
 * Applies a partial edit. The MERGED item is re-validated (switching a fixed
 * cost to variable needs a valid unit, etc.). When the price really changes,
 * the old one is appended to priceHistory (last 20 kept).
 *
 * The write is filtered on the `updatedAt` we merged from, so the history
 * entry always records the price that was actually replaced. With
 * `expectedUpdatedAt` (the version the screen showed) a mismatch is a
 * conflict; without it we re-read and retry (last write wins).
 */
export async function updateCostItem(
  id: string,
  patch: RawCostItemPatch,
  expectedUpdatedAt?: string
): Promise<UpdateCostItemResult> {
  const col = await getPricingCostsCollection();

  for (let attempt = 0; attempt < UPDATE_ATTEMPTS; attempt++) {
    const existing = await getCostItemById(id);
    if (!existing) return { ok: false, reason: "not_found" };
    // Report the conflict before validating: her edit was based on old data.
    if (expectedUpdatedAt !== undefined && existing.updatedAt !== expectedUpdatedAt) {
      return { ok: false, reason: "conflict" };
    }

    const merged: RawCostItemPatch = {
      name: existing.name,
      kind: existing.kind,
      group: existing.group,
      price: existing.price,
      priceQty: existing.priceQty,
      unit: existing.unit,
      customUnit: existing.customUnit,
      note: existing.note,
      ...patch,
    };
    const parsed = parseCostItemInput(merged);
    if (!parsed.ok) return { ok: false, reason: "invalid", error: parsed.error };
    const next = parsed.data;

    const now = new Date().toISOString();
    const { set, unset } = optionalFields({
      group: next.group,
      customUnit: next.customUnit,
      note: next.note,
    });

    const update: Record<string, unknown> = {
      $set: {
        name: next.name,
        kind: next.kind,
        price: next.price,
        priceQty: next.priceQty,
        unit: next.unit,
        ...set,
        updatedAt: now,
      },
    };
    if (Object.keys(unset).length) update.$unset = unset;
    if (isRealPriceChange(existing, next)) {
      const old: PriceChange = compact({
        price: existing.price,
        priceQty: existing.priceQty,
        unit: existing.unit,
        customUnit: existing.customUnit,
        at: now,
      });
      update.$push = { priceHistory: { $each: [old], $slice: -PRICE_HISTORY_MAX } };
    }

    const doc = await col.findOneAndUpdate({ id, updatedAt: existing.updatedAt }, update as never, {
      returnDocument: "after",
      projection: PROJECT_NO_ID,
    });
    if (doc) return { ok: true, item: doc as unknown as CostItem };
    // Changed (or deleted) between our read and our write.
    if (expectedUpdatedAt !== undefined) {
      const stillThere = await col.countDocuments({ id }, { limit: 1 });
      return { ok: false, reason: stillThere ? "conflict" : "not_found" };
    }
  }
  return { ok: false, reason: "conflict" };
}

/** Hard delete — saved quotes keep their own price snapshots. */
export async function deleteCostItem(id: string): Promise<boolean> {
  const col = await getPricingCostsCollection();
  const res = await col.deleteOne({ id });
  return res.deletedCount > 0;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function getPricingSettings(): Promise<PricingSettings> {
  const col = await getPricingSettingsCollection();
  const doc = await col.findOne({ id: SETTINGS_ID }, { projection: PROJECT_NO_ID });
  if (!doc) return { ...DEFAULT_PRICING_SETTINGS };
  return compact({
    hourlyRate: doc.hourlyRate ?? DEFAULT_PRICING_SETTINGS.hourlyRate,
    marginPercent: doc.marginPercent ?? DEFAULT_PRICING_SETTINGS.marginPercent,
    roundTo: doc.roundTo ?? DEFAULT_PRICING_SETTINGS.roundTo,
    updatedAt: doc.updatedAt,
  });
}

export async function updatePricingSettings(input: PricingSettingsInput): Promise<PricingSettings> {
  const col = await getPricingSettingsCollection();
  const settings: PricingSettings = {
    hourlyRate: input.hourlyRate,
    marginPercent: input.marginPercent,
    roundTo: input.roundTo,
    updatedAt: new Date().toISOString(),
  };
  await col.updateOne({ id: SETTINGS_ID }, { $set: settings }, { upsert: true });
  return settings;
}

// ---------------------------------------------------------------------------
// Quotes
// ---------------------------------------------------------------------------

export async function getQuotes(): Promise<PriceQuote[]> {
  const col = await getPricingQuotesCollection();
  const docs = await col.find({}, { projection: PROJECT_NO_ID }).sort({ updatedAt: -1 }).toArray();
  return docs as unknown as PriceQuote[];
}

export async function getQuoteById(id: string): Promise<PriceQuote | null> {
  const col = await getPricingQuotesCollection();
  const doc = await col.findOne({ id }, { projection: PROJECT_NO_ID });
  return (doc as unknown as PriceQuote) || null;
}

export function cleanLine(l: QuoteLine): QuoteLine {
  return compact({
    key: l.key,
    costItemId: l.costItemId,
    kind: l.kind,
    name: l.name,
    price: l.price,
    priceQty: l.priceQty,
    unit: l.unit,
    customUnit: l.customUnit,
    qty: l.qty,
    qtyUnit: l.qtyUnit,
  });
}

/**
 * Stores the settings the calculator showed (already validated, no updatedAt)
 * and recomputes the result with them, so the saved price is the one she saw
 * even if the "Réglages" tab was changed meanwhile.
 */
function buildQuoteBody(input: QuoteInput) {
  const settings: PricingSettings = {
    hourlyRate: input.settings.hourlyRate,
    marginPercent: input.settings.marginPercent,
    roundTo: input.settings.roundTo,
  };
  const lines = input.lines.map(cleanLine);
  const { costTotal, finalPrice } = computePrice({
    lines,
    hours: input.hours,
    portions: input.portions,
    settings,
  });
  return {
    name: input.name,
    note: input.note,
    hours: input.hours,
    portions: input.portions,
    lines,
    settings,
    result: { costTotal, finalPrice },
  };
}

export async function createQuote(input: QuoteInput): Promise<PriceQuote> {
  const col = await getPricingQuotesCollection();
  const now = new Date().toISOString();
  const quote: PriceQuote = compact({
    id: randomUUID(),
    ...buildQuoteBody(input),
    createdAt: now,
    updatedAt: now,
  });
  await col.insertOne({ ...quote });
  return quote;
}

export type UpdateQuoteResult =
  | { ok: true; quote: PriceQuote }
  | { ok: false; reason: "not_found" | "conflict" };

/**
 * Replaces a quote. With `expectedUpdatedAt` the write only applies to that
 * exact version (atomic filter); otherwise last write wins.
 */
export async function updateQuote(
  id: string,
  input: QuoteInput,
  expectedUpdatedAt?: string
): Promise<UpdateQuoteResult> {
  const col = await getPricingQuotesCollection();
  const { note, portions, ...required } = buildQuoteBody(input);
  const { set, unset } = optionalFields({ note, portions });

  const update: Record<string, unknown> = {
    $set: { ...required, ...set, updatedAt: new Date().toISOString() },
  };
  if (Object.keys(unset).length) update.$unset = unset;

  const filter = expectedUpdatedAt === undefined ? { id } : { id, updatedAt: expectedUpdatedAt };
  const doc = await col.findOneAndUpdate(filter, update as never, {
    returnDocument: "after",
    projection: PROJECT_NO_ID,
  });
  if (doc) return { ok: true, quote: doc as unknown as PriceQuote };
  if (expectedUpdatedAt === undefined) return { ok: false, reason: "not_found" };
  const stillThere = await col.countDocuments({ id }, { limit: 1 });
  return { ok: false, reason: stillThere ? "conflict" : "not_found" };
}

export async function deleteQuote(id: string): Promise<boolean> {
  const col = await getPricingQuotesCollection();
  const res = await col.deleteOne({ id });
  return res.deletedCount > 0;
}
