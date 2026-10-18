// Server-only data layer for price sheets ("fiches prix"). A sheet stores no
// prices: every variant is priced from the live cost library + settings, and
// the snapshot it was last priced with is kept to explain the next change in
// the history (collection pricing_template_history).

import { randomUUID } from "crypto";
import type { Filter } from "mongodb";
import {
  getCakesCollection,
  getPricingTemplateHistoryCollection,
  getPricingTemplatesCollection,
  type PriceTemplateDoc,
} from "./mongodb";
import { cleanLine, compact, getCostItems, getPricingSettings, optionalFields } from "./pricing-data";
import { explainChange, priceMoved, priceVariant } from "./pricing-templates";
import { unitLabel } from "./pricing-units";
import type {
  CostItem,
  PriceChangeReason,
  PriceChangeTrigger,
  PricedSnapshot,
  PriceTemplate,
  PricingSettings,
  TemplateInput,
  TemplateLine,
  TemplatePriceChange,
  TemplateVariant,
  TemplateVariantInput,
} from "./pricing-types";
import { checkTemplateAgainstLibrary, type ParseResult } from "./pricing-validation";

const PROJECT_NO_ID = { _id: 0 } as const;
const PROJECT_TEMPLATE = { _id: 0, pricingRev: 0, pricingIssues: 0 } as const;
const HISTORY_LIMIT = 300;
// Same bound as quotes: above this a total is a typo and float maths stops being exact.
const RESULT_MAX = 1e10;
// A write that loses a race (save vs automatic re-pricing) is redone from fresh data.
const ATTEMPTS = 3;

interface Library {
  costItems: CostItem[];
  byId: Map<string, CostItem>;
  settings: PricingSettings;
}

/** Costs first, then settings — repriceAllTemplates() relies on reading them after the sheets. */
async function loadLibrary(): Promise<Library> {
  const costItems = await getCostItems();
  const settings = await getPricingSettings();
  return { costItems, byId: new Map(costItems.map((c) => [c.id, c])), settings };
}

/** Matches the exact version we read (see PriceTemplateDoc.pricingRev). */
function sameRev(doc: PriceTemplateDoc): Filter<PriceTemplateDoc> {
  return { id: doc.id, pricingRev: doc.pricingRev ?? { $exists: false } };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

type LastChange = NonNullable<TemplateVariant["lastChange"]>;

/**
 * Adds to each size its latest history entry (one aggregate for all sheets).
 * Read-only decoration: lastChange is never stored in the sheet document, and
 * entries of removed sizes are ignored since only current sizes are matched.
 */
async function withLastChanges(templates: PriceTemplate[]): Promise<PriceTemplate[]> {
  if (!templates.length) return templates;
  const history = await getPricingTemplateHistoryCollection();
  const rows = await history
    .aggregate<{ _id: { templateId: string; variantId: string } } & LastChange>([
      { $match: { templateId: { $in: templates.map((t) => t.id) } } },
      { $sort: { at: -1, _id: -1 } },
      {
        $group: {
          _id: { templateId: "$templateId", variantId: "$variantId" },
          at: { $first: "$at" },
          trigger: { $first: "$trigger" },
          oldPrice: { $first: "$oldPrice" },
          newPrice: { $first: "$newPrice" },
        },
      },
    ])
    .toArray();
  const latest = new Map(
    rows.map((r) => [
      `${r._id.templateId}\u0000${r._id.variantId}`,
      { at: r.at, trigger: r.trigger, oldPrice: r.oldPrice, newPrice: r.newPrice } satisfies LastChange,
    ])
  );
  return templates.map((t) => ({
    ...t,
    variants: t.variants.map((v) => {
      const lastChange = latest.get(`${t.id}\u0000${v.id}`);
      return lastChange ? { ...v, lastChange } : v;
    }),
  }));
}

/** For a save that already succeeded: without its last change is better than a 500. */
async function withLastChangesSafely(template: PriceTemplate): Promise<PriceTemplate> {
  try {
    return (await withLastChanges([template]))[0];
  } catch (err) {
    console.error(`[pricing-templates] ${template.id}: last changes not attached`, err);
    return template;
  }
}

export async function getTemplates(): Promise<PriceTemplate[]> {
  const col = await getPricingTemplatesCollection();
  const docs = await col.find({}, { projection: PROJECT_TEMPLATE }).sort({ updatedAt: -1 }).toArray();
  return withLastChanges(docs as unknown as PriceTemplate[]);
}

export async function getTemplateById(id: string): Promise<PriceTemplate | null> {
  const col = await getPricingTemplatesCollection();
  const doc = await col.findOne({ id }, { projection: PROJECT_TEMPLATE });
  if (!doc) return null;
  return (await withLastChanges([doc as unknown as PriceTemplate]))[0];
}

/**
 * Newest first, only for the sizes the sheet still has: a re-pricing racing a
 * save that removes a size may still insert an entry for it after the cleanup.
 */
export async function getTemplateHistory(templateId: string): Promise<TemplatePriceChange[]> {
  const sheets = await getPricingTemplatesCollection();
  const sheet = await sheets.findOne({ id: templateId }, { projection: { _id: 0, "variants.id": 1 } });
  if (!sheet) return [];
  const col = await getPricingTemplateHistoryCollection();
  const docs = await col
    .find(
      { templateId, variantId: { $in: sheet.variants.map((v) => v.id) } },
      { projection: PROJECT_NO_ID }
    )
    .sort({ at: -1, _id: -1 })
    .limit(HISTORY_LIMIT)
    .toArray();
  return docs as unknown as TemplatePriceChange[];
}

// ---------------------------------------------------------------------------
// Pricing helpers
// ---------------------------------------------------------------------------

/** Field by field, so no `undefined` (stored as null) and nothing extra reaches Mongo. */
function cleanSnapshot(s: PricedSnapshot): PricedSnapshot {
  return {
    at: s.at,
    finalPrice: s.finalPrice,
    costTotal: s.costTotal,
    hours: s.hours,
    settings: {
      hourlyRate: s.settings.hourlyRate,
      marginPercent: s.settings.marginPercent,
      roundTo: s.settings.roundTo,
    },
    lines: s.lines.map(cleanLine),
  };
}

function cleanTemplateLine(l: TemplateLine): TemplateLine {
  return compact({
    key: l.key,
    kind: l.kind,
    costItemId: l.costItemId,
    name: l.name,
    qty: l.qty,
    qtyUnit: l.qtyUnit,
    amount: l.kind === "extra" ? l.amount ?? 0 : undefined,
  });
}

/** Same pricing apart from its date: nothing to rewrite. */
function sameSnapshot(a: PricedSnapshot | undefined, b: PricedSnapshot): boolean {
  return !!a && JSON.stringify({ ...a, at: "" }) === JSON.stringify({ ...b, at: "" });
}

interface PricingIssue {
  key: string; // identifies the problem, so it is reported only once
  text: string;
}

/**
 * Lines of a variant that today's library can no longer price: a variable
 * cost deleted, turned fixed, or moved to another unit family (kg → pièce).
 * They would silently count 0 DA, so such a variant is NOT re-priced — see
 * repriceAllTemplates(). A line already missing from the last good pricing
 * (old data) is not reported again.
 */
function pricingIssues(
  variant: TemplateVariant,
  priced: ReturnType<typeof priceVariant>,
  lib: Library
): PricingIssue[] {
  const last = new Map((variant.priced?.lines ?? []).map((l) => [l.key, l]));
  const issues: PricingIssue[] = [];
  for (const l of priced.missing) {
    if (variant.priced && !last.has(l.key)) continue;
    const name = last.get(l.key)?.name || l.name;
    const item = l.costItemId ? lib.byId.get(l.costItemId) : undefined;
    issues.push(
      item
        ? { key: `${l.key}:fixed`, text: `${name} est devenu un coût fixe — ligne à retirer` }
        : { key: `${l.key}:deleted`, text: `${name} supprimé de la liste des coûts — ligne à retirer` }
    );
  }
  const errored = new Set(priced.breakdown.lines.filter((x) => x.error).map((x) => x.key));
  for (const l of priced.lines) {
    if (!errored.has(l.key)) continue;
    const before = last.get(l.key);
    const from = before ? unitLabel(before.unit, before.customUnit, 1) : unitLabel(l.qtyUnit, l.customUnit, 1);
    const to = unitLabel(l.unit, l.customUnit, 1);
    issues.push({
      key: `${l.key}:unit:${l.unit}:${l.customUnit ?? ""}`,
      text: `${l.name} : unité changée (${from} → ${to}) — ligne à corriger dans la fiche`,
    });
  }
  return issues;
}

function historyEntry(
  templateId: string,
  variantId: string,
  at: string,
  trigger: PriceChangeTrigger,
  prev: PricedSnapshot | null,
  next: PricedSnapshot,
  reasons: PriceChangeReason[]
): TemplatePriceChange {
  return {
    id: randomUUID(),
    templateId,
    variantId,
    at,
    trigger,
    oldPrice: prev ? prev.finalPrice : null,
    newPrice: next.finalPrice,
    oldCost: prev ? prev.costTotal : null,
    newCost: next.costTotal,
    reasons,
  };
}

/**
 * The history is secondary to the sheet itself: once the sheet is saved, a
 * failed history write is logged instead of answering 500 to a save that worked.
 */
async function recordHistory(entries: TemplatePriceChange[], where: string): Promise<void> {
  if (!entries.length) return;
  try {
    const col = await getPricingTemplateHistoryCollection();
    // insertMany mutates its documents with _id; they are not reused, but copy anyway.
    await col.insertMany(entries.map((e) => ({ ...e })));
  } catch (err) {
    console.error(`[pricing-templates] ${where}: history not recorded`, err);
  }
}

type PricedVariant = TemplateVariant & { priced: PricedSnapshot };

function priceVariants(
  variants: TemplateVariantInput[],
  lib: Library,
  at: string
): ParseResult<PricedVariant[]> {
  const out: PricedVariant[] = [];
  const tooBig = (v: number) => !Number.isFinite(v) || v > RESULT_MAX;
  for (const v of variants) {
    const priced = cleanSnapshot(priceVariant(v, lib.costItems, lib.settings, at).snapshot);
    if (tooBig(priced.costTotal) || tooBig(priced.finalPrice)) {
      return { ok: false, error: `Taille "${v.label}" : montant trop grand pour être calculé` };
    }
    out.push(
      compact({
        id: v.id,
        label: v.label,
        portions: v.portions,
        hours: v.hours,
        lines: v.lines.map(cleanTemplateLine),
        fixedOverrides: v.fixedOverrides.map((o) => ({ costItemId: o.costItemId, qty: o.qty })),
        priced,
      })
    );
  }
  return { ok: true, data: out };
}

async function resolveCake(
  cakeId: string | undefined
): Promise<ParseResult<{ cakeTitle?: string; cakeImage?: string }>> {
  if (!cakeId) return { ok: true, data: {} };
  const col = await getCakesCollection();
  const cake = await col.findOne({ id: cakeId }, { projection: { _id: 0, translations: 1, images: 1 } });
  if (!cake) {
    return {
      ok: false,
      error: "Le gâteau lié n'existe plus dans le catalogue : choisissez-en un autre ou retirez le lien",
    };
  }
  return {
    ok: true,
    data: {
      cakeTitle: cake.translations?.fr?.title?.trim() || undefined,
      cakeImage: cake.images?.[0] || undefined,
    },
  };
}

/** Checks the input against today's library and catalog, then prices every size. */
async function prepareTemplate(input: TemplateInput, at: string) {
  const [lib, cake] = await Promise.all([loadLibrary(), resolveCake(input.cakeId)]);
  const checked = checkTemplateAgainstLibrary(input, lib.costItems);
  if (!checked.ok) return checked;
  if (!cake.ok) return cake;
  const variants = priceVariants(checked.data.variants, lib, at);
  if (!variants.ok) return variants;
  return {
    ok: true as const,
    lib,
    body: {
      name: checked.data.name,
      cakeId: checked.data.cakeId,
      cakeTitle: cake.data.cakeTitle,
      cakeImage: cake.data.cakeImage,
      note: checked.data.note,
      variants: variants.data,
    },
  };
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export type CreateTemplateResult =
  | { ok: true; template: PriceTemplate }
  | { ok: false; reason: "invalid"; error: string };

export async function createTemplate(input: TemplateInput): Promise<CreateTemplateResult> {
  const now = new Date().toISOString();
  const prepared = await prepareTemplate(input, now);
  if (!prepared.ok) return { ok: false, reason: "invalid", error: prepared.error };
  const { variants } = prepared.body;

  const template: PriceTemplate = compact({
    id: randomUUID(),
    ...prepared.body,
    createdAt: now,
    updatedAt: now,
  });
  const col = await getPricingTemplatesCollection();
  await col.insertOne({ ...template, pricingRev: randomUUID() });

  await recordHistory(
    variants.map((v) =>
      historyEntry(template.id, v.id, now, "created", null, v.priced, [{ text: "Fiche créée" }])
    ),
    "create"
  );
  return { ok: true, template: await withLastChangesSafely(template) };
}

export type UpdateTemplateResult =
  | CreateTemplateResult
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "conflict" };

/**
 * Replaces a sheet and re-prices it. With `expectedUpdatedAt` (the version the
 * screen showed) a mismatch is a conflict; without it, last write wins. The
 * write itself is conditional on the version we read, so the history always
 * explains the change from the snapshot that was really replaced.
 */
export async function updateTemplate(
  id: string,
  input: TemplateInput,
  expectedUpdatedAt?: string
): Promise<UpdateTemplateResult> {
  const col = await getPricingTemplatesCollection();

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const existing = await col.findOne({ id }, { projection: PROJECT_NO_ID });
    if (!existing) return { ok: false, reason: "not_found" };
    if (expectedUpdatedAt !== undefined && existing.updatedAt !== expectedUpdatedAt) {
      return { ok: false, reason: "conflict" };
    }

    // Inside the loop: a lost race may come from a re-pricing with a newer library.
    const now = new Date().toISOString();
    const prepared = await prepareTemplate(input, now);
    if (!prepared.ok) return { ok: false, reason: "invalid", error: prepared.error };
    const { body, lib } = prepared;

    const { cakeId, cakeTitle, cakeImage, note, ...required } = body;
    const { set, unset } = optionalFields({ cakeId, cakeTitle, cakeImage, note });
    // A saved sheet passed the library check: no line left to flag.
    const update = {
      $set: { ...required, ...set, updatedAt: now, pricingRev: randomUUID() },
      $unset: { ...unset, pricingIssues: "" },
    };

    const doc = await col.findOneAndUpdate(sameRev(existing), update as never, {
      returnDocument: "after",
      projection: PROJECT_TEMPLATE,
    });
    if (!doc) continue; // saved or re-priced elsewhere since our read

    const before = new Map(existing.variants.map((v) => [v.id, v]));
    const entries: TemplatePriceChange[] = [];
    for (const v of body.variants) {
      const old = before.get(v.id);
      if (!old) {
        entries.push(
          historyEntry(id, v.id, now, "created", null, v.priced, [{ text: `Nouvelle taille : ${v.label}` }])
        );
      } else if (!old.priced) {
        entries.push(historyEntry(id, v.id, now, "template", null, v.priced, [{ text: "Premier calcul" }]));
      } else if (priceMoved(old.priced, v.priced)) {
        entries.push(
          historyEntry(
            id, v.id, now, "template", old.priced, v.priced,
            explainChange(old.priced, v.priced, { itemsById: lib.byId, prevOverrides: old.fixedOverrides })
          )
        );
      }
    }
    await recordHistory(entries, `update ${id}`);

    // The history of a size she removed has nothing left to describe.
    const kept = new Set(body.variants.map((v) => v.id));
    const removed = existing.variants.filter((v) => !kept.has(v.id)).map((v) => v.id);
    if (removed.length) {
      try {
        const history = await getPricingTemplateHistoryCollection();
        await history.deleteMany({ templateId: id, variantId: { $in: removed } });
      } catch (err) {
        console.error(`[pricing-templates] update ${id}: old history not removed`, err);
      }
    }
    return { ok: true, template: await withLastChangesSafely(doc as unknown as PriceTemplate) };
  }
  return { ok: false, reason: "conflict" };
}

/** Deletes the sheet and its history. */
export async function deleteTemplate(id: string): Promise<boolean> {
  const col = await getPricingTemplatesCollection();
  const res = await col.deleteOne({ id });
  // Also run when the sheet is already gone: clears history a failed delete left behind.
  const history = await getPricingTemplateHistoryCollection();
  await history.deleteMany({ templateId: id });
  return res.deletedCount > 0;
}

// ---------------------------------------------------------------------------
// Automatic re-pricing
// ---------------------------------------------------------------------------

/**
 * Which sheets a library change can affect: all of them (settings, a fixed
 * cost), or only those using one cost — as a variable line, or as a fixed line
 * of their last pricing (a fixed cost deleted or turned variable).
 */
export type RepriceScope = "all" | { costItemId: string };

function scopeFilter(scope: RepriceScope): Filter<PriceTemplateDoc> {
  if (scope === "all") return {};
  return {
    $or: [
      { "variants.lines.costItemId": scope.costItemId },
      { "variants.priced.lines.costItemId": scope.costItemId },
    ],
  };
}

/** What re-pricing one sheet changes, or null when nothing does. */
function repriceSheet(
  sheet: PriceTemplateDoc,
  lib: Library,
  now: string,
  trigger: "cost" | "settings"
): { set: Record<string, unknown>; entries: TemplatePriceChange[] } | null {
  const set: Record<string, unknown> = {};
  const entries: TemplatePriceChange[] = [];
  const reported = sheet.pricingIssues ?? {};
  const issuesNow: Record<string, string[]> = {};

  sheet.variants.forEach((v, i) => {
    const last = v.priced;
    const priced = priceVariant(v, lib.costItems, lib.settings, now);
    const issues = last ? pricingIssues(v, priced, lib) : [];
    if (last && issues.length) {
      // Keep the last good pricing; tell her once per problem, without a price move.
      issuesNow[v.id] = issues.map((x) => x.key);
      const known = new Set(reported[v.id] ?? []);
      const fresh = issues.filter((x) => !known.has(x.key));
      if (fresh.length) {
        entries.push(historyEntry(sheet.id, v.id, now, "cost", last, last, fresh.map((x) => ({ text: x.text }))));
      }
      return;
    }
    const next = cleanSnapshot(priced.snapshot);
    if (sameSnapshot(last, next)) return;
    set[`variants.${i}.priced`] = next;
    if (last && priceMoved(last, next)) {
      const reasons = explainChange(last, next, { itemsById: lib.byId, prevOverrides: v.fixedOverrides });
      entries.push(historyEntry(sheet.id, v.id, now, trigger, last, next, reasons));
    }
  });

  if (JSON.stringify(issuesNow) !== JSON.stringify(reported)) set.pricingIssues = issuesNow;
  return Object.keys(set).length ? { set, entries } : null;
}

/**
 * Re-prices the sheets after the cost library or the settings changed, and
 * records each size whose price moved, with its reasons.
 *
 * - Only the `priced` snapshots (and the internal pricingIssues) are written;
 *   `updatedAt` stays, so a sheet open in the editor can still be saved (no 409).
 * - Sheets are read BEFORE the library and settings. A sheet written after our
 *   read fails the pricingRev check and is redone next round with a fresh
 *   library; one written before was priced with a library no newer than ours.
 * - A size with a line today's library can't price (cost deleted, turned fixed,
 *   or moved to another unit family) is NOT re-priced: that line would count
 *   0 DA and the history would show a fake drop. It keeps its last good
 *   `priced`, and one entry with no price move tells her which line to fix —
 *   once per problem (remembered in pricingIssues, cleared when she saves the
 *   sheet). Her save then explains everything from that last good pricing.
 *   The line itself stays in the sheet; the editor flags it.
 */
export async function repriceAllTemplates(
  trigger: "cost" | "settings",
  scope: RepriceScope = "all"
): Promise<{ updated: number; changes: number }> {
  const col = await getPricingTemplatesCollection();
  let filter = scopeFilter(scope);
  let updated = 0;
  let changes = 0;

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const sheets = await col.find(filter, { projection: PROJECT_NO_ID }).toArray();
    if (!sheets.length) break;
    const lib = await loadLibrary(); // after the sheets, see above
    const now = new Date().toISOString();
    const lost: string[] = [];
    const entries: TemplatePriceChange[] = [];

    await Promise.all(
      sheets.map(async (sheet) => {
        const repriced = repriceSheet(sheet, lib, now, trigger);
        if (!repriced) return;
        const res = await col.updateOne(sameRev(sheet), {
          $set: { ...repriced.set, pricingRev: randomUUID() },
        });
        if (res.matchedCount === 0) {
          lost.push(sheet.id);
          return;
        }
        updated++;
        entries.push(...repriced.entries);
      })
    );

    changes += entries.length;
    await recordHistory(entries, `reprice (${trigger})`);
    if (!lost.length) break;
    if (attempt === ATTEMPTS - 1) {
      console.warn(`[pricing-templates] reprice (${trigger}): gave up on ${lost.length} sheet(s) edited meanwhile`);
    }
    filter = { id: { $in: lost } };
  }
  return { updated, changes };
}

/** For the cost and settings routes: a failed re-pricing never fails her edit. */
export async function repriceAllTemplatesSafely(
  trigger: "cost" | "settings",
  where: string,
  scope: RepriceScope = "all"
): Promise<void> {
  try {
    await repriceAllTemplates(trigger, scope);
  } catch (err) {
    console.error(`${where} re-pricing of the price sheets failed:`, err);
  }
}
