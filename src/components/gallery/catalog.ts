// Pure helpers for the gallery + detail pages (server side).

import type { Cake, Category, Locale } from "@/lib/db-types";
import { pipingFor, type PipingName } from "@/lib/piping";

export const cakeTitle = (cake: Pick<Cake, "translations">, locale: Locale) =>
  (cake.translations[locale]?.title || cake.translations.fr.title).trim();

export const cakeDescription = (cake: Pick<Cake, "translations">, locale: Locale) =>
  (cake.translations[locale]?.description || cake.translations.fr.description || "").trim();

export const categoryLabel = (cake: Pick<Cake, "categoryLabel">, locale: Locale) =>
  cake.categoryLabel?.[locale] || cake.categoryLabel?.fr || "";

/*
  Photo-quality order (08-review M3), checked by eye on every cake's first
  photo on 2026-10-04: studio light, sharp, no visible watermark first; the
  heaviest-watermarked or low-resolution shots last. Cakes not listed keep
  their catalogue order in between. Ordering only: nothing is hidden, and
  an owner-flagged `hero` still wins the home hero.
*/
const CLEAN_FIRST = [
  "gateau-princesse-couronnee",
  "gateau-luxe-blanc-ivoire",
  "gateau-pastel-douceur",
  "gateau-personnalise-special",
  "gateau-degrade-pastel",
  "gateau-cocomelon",
  "gateau-floral-romantique",
  "gateau-romantique-fleurs",
  "gateau-remise-diplome",
  "tarte-boite-de-montre-festina",
  "gateau-chocolat-luxe",
  "gateau-simple-quotidien",
];
const WATERMARKED_LAST = ["gateau-grande-celebration", "tarte-cocomelon-lighting-bus", "gateau-creation-coloree"];

function photoRank(slug: string): number {
  const clean = CLEAN_FIRST.indexOf(slug);
  if (clean > -1) return clean - CLEAN_FIRST.length;
  const last = WATERMARKED_LAST.indexOf(slug);
  return last > -1 ? 1 + last : 0;
}

/** Stable sort: clean photos first, heavy watermarks last, the rest as given. */
export function byPhotoQuality<T extends { slug: string }>(cakes: T[]): T[] {
  return cakes
    .map((c, i) => ({ c, i, r: photoRank(c.slug) }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map((x) => x.c);
}

export interface CategoryCount {
  slug: string;
  label: string;
  count: number;
  dot: PipingName;
}

/** DB categories (admin order) that have at least one published cake. */
export function categoriesWithCakes(cakes: Cake[], categories: Category[], locale: Locale): CategoryCount[] {
  const counts = new Map<string, number>();
  for (const c of cakes) counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
  return [...categories]
    .sort((a, b) => a.order - b.order)
    .filter((cat) => (counts.get(cat.slug) ?? 0) > 0)
    .map((cat) => ({
      slug: cat.slug,
      label: cat.labels[locale] || cat.labels.fr,
      count: counts.get(cat.slug) ?? 0,
      dot: pipingFor({ id: cat.slug, category: cat.slug }),
    }));
}

/** Same category first (newest first), then the rest, excluding the cake itself. */
export function relatedCakes(cake: Cake, all: Cake[], count = 4): Cake[] {
  const others = all.filter((c) => c.id !== cake.id);
  const same = others.filter((c) => c.category === cake.category);
  const rest = others.filter((c) => c.category !== cake.category);
  return [...same, ...rest].slice(0, count);
}

/** "26 × 26 × 12" from whichever of length/width/height are set. */
export function dimensionsOf(cake: Pick<Cake, "length" | "width" | "height">): string | null {
  const parts = [cake.length, cake.width, cake.height].filter((n): n is number => typeof n === "number" && n > 0);
  return parts.length ? parts.join(" × ") : null;
}
