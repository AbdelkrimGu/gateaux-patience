// Display helpers for the price calculator UI. No pricing math here — that
// lives only in src/lib/pricing-formula.ts.

import type { CostItem, PricingSettings } from "@/lib/pricing-types";
import { formatDA, formatQty, unitLabel, type UnitCode } from "@/lib/pricing-units";

export const NO_GROUP = "Sans groupe";

type PriceLike = { price: number; priceQty: number; unit: UnitCode; customUnit?: string };

/** "1 450 DA / kg", "900 DA / 16 pièces" or "150 DA par gâteau". */
export function priceLabel(p: PriceLike): string {
  if (p.unit === "forfait") return `${formatDA(p.price)} par gâteau`;
  const u = unitLabel(p.unit, p.customUnit, p.priceQty);
  return p.priceQty === 1
    ? `${formatDA(p.price)} / ${u}`
    : `${formatDA(p.price)} / ${formatQty(p.priceQty)} ${u}`;
}

/** "1 600 → 1 850 DA / kg" when only the amount changed, both full labels otherwise. */
export function priceChangeLabel(before: PriceLike, after: PriceLike): string {
  const sameUnit =
    before.unit === after.unit &&
    before.priceQty === after.priceQty &&
    (before.customUnit ?? "") === (after.customUnit ?? "");
  return sameUnit
    ? `${formatQty(before.price)} → ${priceLabel(after)}`
    : `${priceLabel(before)} → ${priceLabel(after)}`;
}

/** « name » with the non-breaking spaces French typography expects. */
export function quoted(s: string): string {
  return `« ${s} »`;
}

export function roundLabel(roundTo: number): string {
  return roundTo > 0 ? `à ${formatDA(roundTo)}` : "aucun";
}

type SettingsLike = Pick<PricingSettings, "hourlyRate" | "marginPercent" | "roundTo">;

/** Plain-French list of what differs: "Taux horaire : 400 → 500 DA/h"… */
export function settingsChanges(from: SettingsLike, to: SettingsLike): string[] {
  const out: string[] = [];
  if (from.hourlyRate !== to.hourlyRate) {
    out.push(`Taux horaire : ${formatQty(from.hourlyRate)} → ${formatQty(to.hourlyRate)} DA/h`);
  }
  if (from.marginPercent !== to.marginPercent) {
    out.push(`Marge : ${formatQty(from.marginPercent)} → ${formatQty(to.marginPercent)} %`);
  }
  if (from.roundTo !== to.roundTo) {
    out.push(`Arrondi : ${roundLabel(from.roundTo)} → ${roundLabel(to.roundTo)}`);
  }
  return out;
}

/** 2.5 → "2 h 30", 0.75 → "45 min", 3 → "3 h". */
export function formatHours(h: number): string {
  if (!Number.isFinite(h) || h <= 0) return "0 h";
  let hh = Math.floor(h);
  let mm = Math.round((h - hh) * 60);
  if (mm === 60) {
    hh += 1;
    mm = 0;
  }
  if (hh === 0) return `${mm} min`;
  return mm ? `${hh} h ${String(mm).padStart(2, "0")}` : `${hh} h`;
}

// Fixed time zone so the server render and the phone agree on the day.
const dateFormat = new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Algiers" });
const timeFormat = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Africa/Algiers",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : dateFormat.format(d);
}

/** "17/10/2026 à 18:24" (Algiers time). */
export function formatDateTime(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : `${dateFormat.format(d)} à ${timeFormat.format(d)}`;
}

const shortDateFormat = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Africa/Algiers",
  day: "2-digit",
  month: "2-digit",
});

/** "18/10" (Algiers time), for one-line hints. */
export function formatShortDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : shortDateFormat.format(d);
}

/** Number → what she would type ("1,5"), to seed text inputs. */
export function numberToRaw(n: number | undefined | null): string {
  return typeof n === "number" && Number.isFinite(n) ? String(n).replace(".", ",") : "";
}

/** Case- and accent-insensitive search key. */
export function searchKey(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** Items grouped by `group`, groups sorted A→Z, ungrouped last, names sorted inside. */
export function groupItems(items: CostItem[]): Array<[string, CostItem[]]> {
  const map = new Map<string, CostItem[]>();
  for (const it of items) {
    const g = it.group?.trim() || NO_GROUP;
    const list = map.get(g);
    if (list) list.push(it);
    else map.set(g, [it]);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) =>
      a === NO_GROUP ? 1 : b === NO_GROUP ? -1 : a.localeCompare(b, "fr", { sensitivity: "base" })
    )
    .map(([g, list]) => [
      g,
      [...list].sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" })),
    ]);
}
