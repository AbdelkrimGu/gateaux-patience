// Shared types for the admin cake price calculator (/admin/pricing).
// Pure types — safe to import from client and server code.

import type { UnitCode } from "./pricing-units";

/**
 * fixed    — included in every cake, flat amount (box, board, gas/electricity share…)
 * variable — priced per unit, the quantity changes from cake to cake
 *            (almonds in grams, chocolate pieces, ribbon in cm…)
 */
export type CostKind = "fixed" | "variable";

/** One entry of a cost item's price history (newest last). */
export interface PriceChange {
  price: number;
  priceQty: number;
  unit: UnitCode;
  customUnit?: string;
  at: string; // ISO date the price was replaced
}

/**
 * A cost the owner maintains in her library.
 * Price reads as "`price` DA for `priceQty` `unit`", e.g. 1450 DA for 1 kg,
 * 1200 DA for 30 pièces. For fixed costs priceQty = 1 and unit = "forfait"
 * (the amount is per cake).
 */
export interface CostItem {
  id: string;
  name: string;
  kind: CostKind;
  group?: string; // free text: "Ingrédients", "Emballage", "Décoration"…
  price: number;
  priceQty: number;
  unit: UnitCode;
  customUnit?: string; // label when unit === "custom" ("couche", "sachet"…)
  note?: string;
  priceHistory: PriceChange[];
  createdAt: string;
  updatedAt: string;
}

/** Parameters of the price formula, edited in the "Réglages" tab. */
export interface PricingSettings {
  hourlyRate: number; // DA per hour of work
  marginPercent: number; // % added on top of the total cost
  roundTo: number; // round the final price UP to a multiple of this (0 = no rounding)
  updatedAt?: string;
}

export const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  hourlyRate: 0,
  marginPercent: 0,
  roundTo: 100,
};

/**
 * One line of a calculation. Carries a snapshot of the cost item's price so a
 * saved quote stays readable even after prices change or the item is deleted.
 */
export interface QuoteLine {
  key: string; // stable id within the quote (React key)
  costItemId: string | null; // null for a one-off "extra" line
  kind: CostKind | "extra";
  name: string;
  // price snapshot (extra: price = total amount, priceQty = 1, unit = "forfait")
  price: number;
  priceQty: number;
  unit: UnitCode;
  customUnit?: string;
  // quantity used in this cake (fixed/extra: a multiplier, usually 1)
  qty: number;
  qtyUnit: UnitCode;
}

export interface PriceQuote {
  id: string;
  name: string; // "Number cake Lina — 2 chiffres"
  note?: string;
  hours: number;
  portions?: number; // optional, to show a price per part
  lines: QuoteLine[];
  settings: PricingSettings; // snapshot used for the saved result
  result: { costTotal: number; finalPrice: number };
  createdAt: string;
  updatedAt: string;
}

export type CostItemInput = Pick<
  CostItem,
  "name" | "kind" | "group" | "price" | "priceQty" | "unit" | "customUnit" | "note"
>;

/**
 * `settings` are the ones the calculator showed the price with, so the saved
 * price is exactly the one she saw (not re-read from the DB at save time).
 */
export type QuoteInput = Pick<
  PriceQuote,
  "name" | "note" | "hours" | "portions" | "lines" | "settings"
>;

/**
 * Updates carry the `updatedAt` the screen was loaded with; the server answers
 * 409 when the record changed elsewhere (another tab, the laptop…) since then.
 */
export type CostItemPatch = Partial<CostItemInput> & { expectedUpdatedAt?: string };
export type QuoteUpdate = QuoteInput & { expectedUpdatedAt?: string };

// ---------------------------------------------------------------------------
// Price sheets ("fiches prix"): a reusable, LIVE calculation attached to a cake,
// with one variant per size. Unlike a devis, a sheet stores no prices: every
// variant is priced from the current cost library and settings, and each time
// its price moves the server records why (see pricing-templates.ts).
// ---------------------------------------------------------------------------

/**
 * A line of a sheet variant. Variable lines point at a cost item (its price is
 * read live); extras are a fixed amount written in the sheet. Fixed costs are
 * not listed: every fixed cost of the library applies, see `fixedOverrides`.
 */
export interface TemplateLine {
  key: string;
  kind: "variable" | "extra";
  costItemId: string | null; // null for extras
  name: string; // extra: its name; variable: last known name (if the item is deleted)
  qty: number; // variable: quantity in qtyUnit; extra: 1
  qtyUnit: UnitCode; // extra: "forfait"
  amount?: number; // extra only: DA
}

/** Multiplier for one fixed cost in this variant; qty 0 = not used for this cake. */
export interface FixedOverride {
  costItemId: string;
  qty: number;
}

/** What a variant was last priced with, to explain the next change. */
export interface PricedSnapshot {
  at: string;
  finalPrice: number;
  costTotal: number;
  hours: number;
  settings: PricingSettings;
  lines: QuoteLine[]; // resolved, with the prices used
}

export interface TemplateVariant {
  id: string;
  label: string; // "10 parts", "15 parts", "Grand modèle"…
  portions?: number;
  hours: number;
  lines: TemplateLine[];
  fixedOverrides: FixedOverride[];
  priced?: PricedSnapshot; // set by the server
  /** Latest history entry of this size, attached by the server when listing sheets. */
  lastChange?: Pick<TemplatePriceChange, "at" | "trigger" | "oldPrice" | "newPrice">;
}

export interface PriceTemplate {
  id: string;
  name: string; // "Number cake", "Layer cake fraise"
  cakeId?: string; // link to a cake of the catalog
  cakeTitle?: string; // denormalized for display
  cakeImage?: string;
  note?: string;
  variants: TemplateVariant[];
  createdAt: string;
  updatedAt: string;
}

export type PriceChangeTrigger = "created" | "template" | "cost" | "settings";

/** One reason in plain French, with its effect on the cost price when known. */
export interface PriceChangeReason {
  text: string; // "Amandes : 1 450 → 1 600 DA/kg"
  impact?: number; // DA added to (or removed from) the cost price
}

/** One entry of a variant's price history (collection pricing_template_history). */
export interface TemplatePriceChange {
  id: string;
  templateId: string;
  variantId: string;
  at: string;
  trigger: PriceChangeTrigger;
  oldPrice: number | null; // null when the variant was just created
  newPrice: number;
  oldCost: number | null;
  newCost: number;
  reasons: PriceChangeReason[];
}

export type TemplateVariantInput = Omit<TemplateVariant, "priced" | "lastChange">;
export type TemplateInput = Pick<PriceTemplate, "name" | "cakeId" | "note"> & {
  variants: TemplateVariantInput[];
};
export type TemplateUpdate = TemplateInput & { expectedUpdatedAt?: string };
