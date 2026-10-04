// Pure universe helpers (no data layer): safe in client components and
// tests. Server code imports `@/lib/universes`, which re-exports all of this
// plus the Mongo getters. See universes.ts for the overview.

import type { Cake, Category } from "./db-types";

export type Universe = "cakes" | "sweets" | "tiramisu";
/** What a category can be set to (tiramisu has its own engine, no category). */
export type CategoryUniverse = Exclude<Universe, "tiramisu">;

export const CATEGORY_UNIVERSES: readonly CategoryUniverse[] = ["cakes", "sweets"];

/**
 * Slugs that count as sweets while the owner has not chosen (no `universe`
 * field). Checked by eye on 2026-10-04: `customs` holds one item, "Création
 * Colorée Personnalisée", which is the Cake10 photo set (cakesicles spelling
 * K-E-N-Z-A and graduation cake pops), not a cake. `desserts` is empty.
 * Every other category is cakes.
 */
const SWEETS_BY_DEFAULT = new Set(["desserts", "customs"]);

export function isCategoryUniverse(v: unknown): v is CategoryUniverse {
  return v === "cakes" || v === "sweets";
}

/** The category's universe: the owner's explicit choice, else the read-time default. */
export function categoryUniverse(cat: Pick<Category, "slug" | "universe"> | null | undefined): CategoryUniverse {
  if (!cat) return "cakes";
  if (isCategoryUniverse(cat.universe)) return cat.universe;
  return SWEETS_BY_DEFAULT.has(cat.slug) ? "sweets" : "cakes";
}

/** Slugs of the categories in `universe`. */
export function categorySlugsIn(categories: Category[], universe: CategoryUniverse): Set<string> {
  return new Set(categories.filter((c) => categoryUniverse(c) === universe).map((c) => c.slug));
}

/**
 * Cakes of `universe`. A cake whose category no longer exists (deleted
 * category) stays in cakes, so nothing silently disappears from /galerie.
 */
export function cakesIn<T extends Pick<Cake, "category">>(cakes: T[], categories: Category[], universe: CategoryUniverse): T[] {
  const sweets = categorySlugsIn(categories, "sweets");
  return cakes.filter((c) => (sweets.has(c.category) ? "sweets" : "cakes") === universe);
}

/**
 * The best REAL sweets photo in the repo, for the home "Douceurs" card and
 * the /douceurs hero. Cake10 is a graduation set: pink cakesicles spelling
 * K-E-N-Z-A, chocolate cakesicles with pink drizzle, and "2020" cake pops
 * under mortarboards. This is the portrait (3:4) shot that shows all three
 * rows. The other Cake10 files are the same set (`…273812.jpg`, 960×718, has
 * the lightest watermark if a landscape crop is ever needed).
 */
export const SWEETS_HERO_IMAGE = {
  src: "/images/Cake10/FB_IMG_1778413270396.jpg",
  width: 718,
  height: 960,
  /** Keeps the K-E-N-Z-A row in frame on square / round crops. */
  position: "50% 45%",
} as const;

/**
 * Real photos of a cake WITH matching sweets (same order, same table), for
 * pairing blocks. Both are in public/, both are portrait 718×960.
 */
export const SET_PHOTOS = {
  /** Rapunzel cake + six princess cupcakes, on her sequin backdrop. */
  princess: { src: "/images/Cake13/FB_IMG_1778413431122.jpg", width: 718, height: 960 },
  /** CoComelon cake + rainbow-swirl cupcakes, on her sequin backdrop. */
  cocomelon: { src: "/images/Cake1/FB_IMG_1778412896351.jpg", width: 718, height: 960 },
} as const;
