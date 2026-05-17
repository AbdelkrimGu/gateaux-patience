import { getCakesCollection } from "./mongodb";
import type { Cake } from "./db-types";

export type { Cake, Locale, CakeTranslation, CategoryLabel } from "./db-types";

const PROJECT_NO_ID = { _id: 0 } as const;

export async function getAllPublishedCakes(): Promise<Cake[]> {
  const col = await getCakesCollection();
  const docs = await col
    .find({ published: true }, { projection: PROJECT_NO_ID })
    .sort({ featured: -1, createdAt: -1 })
    .toArray();
  return docs as unknown as Cake[];
}

export async function getCakeBySlug(slug: string): Promise<Cake | null> {
  const col = await getCakesCollection();
  const doc = await col.findOne(
    { slug, published: true },
    { projection: PROJECT_NO_ID }
  );
  return (doc as unknown as Cake) || null;
}

export async function getCakesByCategory(category: string): Promise<Cake[]> {
  const col = await getCakesCollection();
  if (!category || category === "all") {
    return getAllPublishedCakes();
  }
  const docs = await col
    .find({ published: true, category }, { projection: PROJECT_NO_ID })
    .sort({ featured: -1, createdAt: -1 })
    .toArray();
  return docs as unknown as Cake[];
}

export async function getFeaturedCakes(limit = 6): Promise<Cake[]> {
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
}

export async function getSimilarCakes(cake: Cake, count = 3): Promise<Cake[]> {
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
}

export async function getAllPublishedSlugs(): Promise<{ slug: string }[]> {
  const col = await getCakesCollection();
  const docs = await col
    .find({ published: true }, { projection: { _id: 0, slug: 1 } })
    .toArray();
  return docs.map((d) => ({ slug: (d as { slug: string }).slug }));
}
