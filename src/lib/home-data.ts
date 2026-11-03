import { cache } from "react";
import { getAllPublishedCakes } from "./cakes-data";
import { getCategories } from "./categories-data";
import type { Cake, Category, Locale } from "./db-types";

/**
 * Public-site data for the home page and the header's "Galerie ▾" menu.
 * Only categories with at least one published cake (with photos) exist here:
 * empty categories are hidden everywhere.
 */

/** Gallery URL filtered by category — the param GalleryClient reads. */
export function galleryHref(categorySlug?: string): string {
  return categorySlug ? `/galerie?category=${encodeURIComponent(categorySlug)}` : "/galerie";
}

/** Cake detail URL (locale prefix is added by the i18n Link). */
export function cakeHref(slug: string): string {
  return `/galerie/${slug}`;
}

export interface HomePhoto {
  src: string;
  /** Cake title in the current locale — use as alt text. */
  alt: string;
  cakeSlug: string;
  /** Licensed character / brand / personal photo: keep out of first-impression slots. */
  sensitive: boolean;
}

export interface HomeCake {
  id: string;
  slug: string;
  href: string;
  title: string;
  categorySlug: string;
  categoryLabel: string;
  images: string[];
  featured: boolean;
  /** Crimson / gold / chocolate cakes that suit hero and first cards. */
  onBrand: boolean;
  sensitive: boolean;
  persons?: number;
  pieces?: number;
}

export interface HomeCategory {
  id: string;
  slug: string;
  label: string;
  /** Labels in the three locales (for prefilled messages in another locale). */
  labels: Record<Locale, string>;
  count: number;
  href: string;
  cover: HomePhoto;
  /** 3–8 photos, best first, one per cake before second photos. */
  photos: HomePhoto[];
  /** Cakes of this category, best first. */
  cakes: HomeCake[];
}

export interface NavCategory {
  slug: string;
  label: string;
  href: string;
  count: number;
  cover: string;
}

// ---------------------------------------------------------------------------
// Photo curation. Judged from the real catalogue photos (2026-11): the owner's
// strongest on-brand cakes first; licensed characters, trademarks and photos
// with a child's face never lead. New cakes fall in between automatically.

/** Best first. */
const ON_BRAND_SLUGS = [
  "gateau-personnalise-special", // chocolate heart, red hearts
  "gateau-artistique", // cascade of red hearts
  "gateau-remise-diplome", // engagement, red bow
  "tarte-papillons-princesse", // red dress + butterflies
  "gateau-romantique-fleurs", // graduation, red bow + drips
  "gateau-simple-quotidien", // graduation, red ribbon
  "gateau-degrade-pastel", // heart with roses
  "gateau-floral-romantique", // pregnancy silhouette
  "gateau-hommage-maman",
  "gateau-princesse-couronnee",
  "gateau-pastel-douceur",
  "gateau-creation-coloree",
  "gateau-chocolat-luxe",
];

/** Licensed characters / brands / identifiable people, detected by title too. */
const SENSITIVE_SLUGS = new Set([
  "gateau-grande-celebration", // Superman
  "gateau-elegance-doree", // Minnie
  "gateau-fete-arc-en-ciel", // Spider-Man
  "gateau-moderne-chic", // Spider-Man
  "gateau-luxe-blanc-ivoire", // Minecraft
  "gateau-mariage-elegance", // Rapunzel
  "tarte-de-lespace-avec-fusee", // child's photo on the topper
  "tarte-boite-de-montre-festina", // watch brand
]);
const SENSITIVE_WORDS =
  /cocomelon|spider|minecraft|minnie|mini-?mouse|mickey|raiponce|rapunzel|superman|batman|disney|marvel|frozen|reine des neiges|elsa|pok[eé]mon|sonic|mario|barbie|paw patrol|pat.?patrouille|stitch|festina|hello kitty/i;

/** Photos that are not cake pictures (e.g. a screenshot of a comment). */
const EXCLUDED_PHOTOS = new Set([
  "/images/Cake9/FB_IMG_1778413230416.jpg",
  "/images/Cake1/FB_IMG_1778412913118.jpg", // screenshot of a customer DM
  "/images/Cake7/FB_IMG_1778413148725.jpg", // screenshot of a customer DM
]);

function isSensitive(cake: Cake): boolean {
  if (SENSITIVE_SLUGS.has(cake.slug)) return true;
  const titles = Object.values(cake.translations ?? {}).map((t) => t?.title ?? "");
  return titles.some((title) => SENSITIVE_WORDS.test(title)) || SENSITIVE_WORDS.test(cake.slug);
}

/** Lower is better: on-brand list order → featured → other → sensitive. */
function rank(c: HomeCake): number {
  if (c.onBrand) return ON_BRAND_SLUGS.indexOf(c.slug);
  if (c.sensitive) return 1000;
  return 100 + (c.featured ? 0 : 1);
}

function localized<T>(map: Partial<Record<Locale, T>> | undefined, locale: Locale): T | undefined {
  return map?.[locale] ?? map?.fr;
}

// One DB round trip per request, shared by the header and the page.
const loadCatalogue = cache(async () => {
  const [categories, cakes] = await Promise.all([getCategories(), getAllPublishedCakes()]);
  return { categories, cakes };
});

function toHomeCake(cake: Cake, locale: Locale): HomeCake {
  const images = cake.images.filter((src) => src && !EXCLUDED_PHOTOS.has(src));
  return {
    id: cake.id,
    slug: cake.slug,
    href: cakeHref(cake.slug),
    title: localized(cake.translations, locale)?.title?.trim() || cake.slug,
    categorySlug: cake.category,
    categoryLabel: localized(cake.categoryLabel, locale) ?? cake.category,
    images,
    featured: Boolean(cake.featured),
    onBrand: ON_BRAND_SLUGS.includes(cake.slug),
    sensitive: isSensitive(cake),
    persons: cake.persons,
    pieces: cake.pieces,
  };
}

/** Up to `max` photos, one per cake first (variety), then second photos. */
function pickPhotos(cakes: HomeCake[], max: number): HomePhoto[] {
  const out: HomePhoto[] = [];
  const longest = Math.max(0, ...cakes.map((c) => c.images.length));
  for (let round = 0; round < longest && out.length < max; round++) {
    for (const c of cakes) {
      const src = c.images[round];
      if (src) out.push({ src, alt: c.title, cakeSlug: c.slug, sensitive: c.sensitive });
      if (out.length >= max) break;
    }
  }
  return out;
}

function buildCategory(cat: Category, all: HomeCake[], locale: Locale): HomeCategory | null {
  const cakes = all
    .filter((c) => c.categorySlug === cat.slug && c.images.length > 0);
  if (cakes.length === 0) return null;
  const photos = pickPhotos(cakes, 8);
  return {
    id: cat.id,
    slug: cat.slug,
    label: localized(cat.labels, locale)?.trim() || cat.slug,
    labels: cat.labels,
    count: cakes.length,
    href: galleryHref(cat.slug),
    cover: photos.find((p) => !p.sensitive) ?? photos[0],
    photos,
    cakes,
  };
}

export interface HomeData {
  /** Categories with ≥ 1 published cake, in the admin's order. */
  categories: HomeCategory[];
  /** All published cakes with photos, best first (on-brand → neutral → sensitive). */
  cakes: HomeCake[];
}

/** Everything the home line-ups need, in the visitor's locale. */
export const getHomeData = cache(async (locale: string): Promise<HomeData> => {
  const loc = (["fr", "ar", "en"].includes(locale) ? locale : "fr") as Locale;
  const { categories, cakes } = await loadCatalogue();
  const homeCakes = cakes
    .map((c) => toHomeCake(c, loc))
    .filter((c) => c.images.length > 0)
    .sort((a, b) => rank(a) - rank(b)); // stable: DB order (featured, newest) within a rank
  const homeCategories = categories
    .map((cat) => buildCategory(cat, homeCakes, loc))
    .filter((c): c is HomeCategory => c !== null);
  return { categories: homeCategories, cakes: homeCakes };
});

/** Header "Galerie ▾" entries: categories that have cakes, with a small cover. */
export const getNavCategories = cache(async (locale: string): Promise<NavCategory[]> => {
  const { categories } = await getHomeData(locale);
  return categories.map((c) => ({
    slug: c.slug,
    label: c.label,
    href: c.href,
    count: c.count,
    cover: c.cover.src,
  }));
});
