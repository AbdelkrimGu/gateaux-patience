import { cache } from "react";
import { getCakesCollection } from "./mongodb";
import { getCategories } from "./categories-data";
import type { Cake, Category } from "./db-types";

export type { Cake, Locale, CakeTranslation, CategoryLabel } from "./db-types";

/*
  Public catalogue reads (ISR pages). A database error is LOGGED AND RETHROWN,
  never turned into [] / null: when a revalidation throws, Next keeps serving
  the last good page instead of caching an empty gallery or a 404 for 5 min.
  `[]` / `null` only ever mean "no rows". Reads are wrapped in React cache()
  so generateMetadata and the page share one query per request.
*/

const PROJECT_NO_ID = { _id: 0 } as const;

function fail(label: string, err: unknown): never {
  console.error(`[cakes-data:${label}]`, err instanceof Error ? err.message : err);
  throw err instanceof Error ? err : new Error(String(err));
}

export const getAllPublishedCakes = cache(async function getAllPublishedCakes(): Promise<Cake[]> {
  try {
    const col = await getCakesCollection();
    const docs = await col
      .find({ published: true }, { projection: PROJECT_NO_ID })
      .sort({ featured: -1, createdAt: -1 })
      .toArray();
    return docs as unknown as Cake[];
  } catch (err) {
    fail("getAllPublishedCakes", err);
  }
});

export const getCakeBySlug = cache(async function getCakeBySlug(slug: string): Promise<Cake | null> {
  try {
    const col = await getCakesCollection();
    const doc = await col.findOne(
      { slug, published: true },
      { projection: PROJECT_NO_ID }
    );
    return (doc as unknown as Cake) || null;
  } catch (err) {
    fail("getCakeBySlug", err);
  }
});

export async function getCakesByCategory(category: string): Promise<Cake[]> {
  try {
    if (!category || category === "all") return getAllPublishedCakes();
    const col = await getCakesCollection();
    const docs = await col
      .find({ published: true, category }, { projection: PROJECT_NO_ID })
      .sort({ featured: -1, createdAt: -1 })
      .toArray();
    return docs as unknown as Cake[];
  } catch (err) {
    fail("getCakesByCategory", err);
  }
}

/**
 * Hero showcase cakes — explicitly flagged by the admin via the `hero` boolean.
 * If she hasn't flagged any, fall back to featured so the hero never shows up
 * empty.
 */
export async function getHeroCakes(limit = 5): Promise<Cake[]> {
  try {
    const col = await getCakesCollection();
    const flagged = (await col
      .find({ published: true, hero: true }, { projection: PROJECT_NO_ID })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()) as unknown as Cake[];

    if (flagged.length > 0) return flagged;
    return getFeaturedCakes(limit);
  } catch (err) {
    fail("getHeroCakes", err);
  }
}

export async function getFeaturedCakes(limit = 6): Promise<Cake[]> {
  try {
    const col = await getCakesCollection();
    const featured = (await col
      .find({ published: true, featured: true }, { projection: PROJECT_NO_ID })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()) as unknown as Cake[];

    if (featured.length >= limit) return featured;

    const need = limit - featured.length;
    const featuredIds = featured.map((c) => c.id);
    const fillers = (await col
      .find(
        { published: true, featured: { $ne: true }, id: { $nin: featuredIds } },
        { projection: PROJECT_NO_ID }
      )
      .sort({ createdAt: -1 })
      .limit(need)
      .toArray()) as unknown as Cake[];

    return [...featured, ...fillers];
  } catch (err) {
    fail("getFeaturedCakes", err);
  }
}

export async function getSimilarCakes(cake: Cake, count = 3): Promise<Cake[]> {
  try {
    const col = await getCakesCollection();
    const docs = await col
      .find(
        {
          published: true,
          category: cake.category,
          id: { $ne: cake.id },
        },
        { projection: PROJECT_NO_ID }
      )
      .sort({ createdAt: -1 })
      .limit(count)
      .toArray();
    return docs as unknown as Cake[];
  } catch (err) {
    fail("getSimilarCakes", err);
  }
}

export interface CategoryImageGroup {
  category: Category;
  images: string[];
}

export async function getCategoryImageGroups(
  maxCategories = 6,
  imagesPerCategory = 4
): Promise<CategoryImageGroup[]> {
  try {
    const [categories, cakes] = await Promise.all([
      getCategories(),
      getAllPublishedCakes(),
    ]);

    const groups: CategoryImageGroup[] = [];
    for (const cat of categories) {
      const mainImages = cakes
        .filter((c) => c.category === cat.slug && c.images.length > 0)
        .map((c) => c.images[0]);
      if (mainImages.length === 0) continue;
      groups.push({
        category: cat,
        images: mainImages.slice(0, imagesPerCategory),
      });
      if (groups.length >= maxCategories) break;
    }
    return groups;
  } catch (err) {
    fail("getCategoryImageGroups", err);
  }
}

export async function getAllPublishedSlugs(): Promise<{ slug: string }[]> {
  try {
    const col = await getCakesCollection();
    const docs = await col
      .find({ published: true }, { projection: { _id: 0, slug: 1 } })
      .toArray();
    return docs.map((d) => ({ slug: (d as { slug: string }).slug }));
  } catch (err) {
    fail("getAllPublishedSlugs", err);
  }
}
