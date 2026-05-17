import { randomUUID } from "crypto";
import { getCakesCollection, getCategoriesCollection } from "./mongodb";
import { slugify } from "./admin-data";
import type { Category } from "./db-types";

const PROJECT_NO_ID = { _id: 0 } as const;

export type { Category } from "./db-types";

export async function getCategories(): Promise<Category[]> {
  try {
    const col = await getCategoriesCollection();
    const docs = await col
      .find({}, { projection: PROJECT_NO_ID })
      .sort({ order: 1, createdAt: 1 })
      .toArray();
    return docs as unknown as Category[];
  } catch (err) {
    console.error("[categories-data:getCategories]", err instanceof Error ? err.message : err);
    return [];
  }
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const col = await getCategoriesCollection();
  const doc = await col.findOne({ id }, { projection: PROJECT_NO_ID });
  return (doc as unknown as Category) || null;
}

async function ensureUniqueCategorySlug(base: string, excludeId?: string): Promise<string> {
  const col = await getCategoriesCollection();
  let slug = base;
  let n = 1;
  while (n < 250) {
    const filter = excludeId ? { slug, id: { $ne: excludeId } } : { slug };
    const existing = await col.findOne(filter, { projection: { _id: 0, id: 1 } });
    if (!existing) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export interface CategoryInput {
  labels: { fr: string; ar: string; en: string };
  order?: number;
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const col = await getCategoriesCollection();
  const now = new Date().toISOString();
  const baseSlug = slugify(input.labels.fr || "categorie");
  const slug = await ensureUniqueCategorySlug(baseSlug);

  const maxOrderDoc = await col
    .find({}, { projection: { _id: 0, order: 1 } })
    .sort({ order: -1 })
    .limit(1)
    .toArray();
  const nextOrder =
    typeof input.order === "number"
      ? input.order
      : maxOrderDoc.length
      ? ((maxOrderDoc[0] as unknown as Category).order || 0) + 1
      : 0;

  const category: Category = {
    id: randomUUID(),
    slug,
    labels: {
      fr: input.labels.fr.trim(),
      ar: input.labels.ar.trim() || input.labels.fr.trim(),
      en: input.labels.en.trim() || input.labels.fr.trim(),
    },
    order: nextOrder,
    createdAt: now,
    updatedAt: now,
  };
  await col.insertOne(category as never);
  return category;
}

export interface CategoryPatch {
  labels?: { fr: string; ar: string; en: string };
  order?: number;
}

export async function updateCategory(
  id: string,
  patch: CategoryPatch
): Promise<{ category: Category | null; cakesAffected: number }> {
  const col = await getCategoriesCollection();
  const existing = await getCategoryById(id);
  if (!existing) return { category: null, cakesAffected: 0 };

  const now = new Date().toISOString();
  const updates: Partial<Category> = { updatedAt: now };
  if (patch.labels) {
    updates.labels = {
      fr: patch.labels.fr.trim(),
      ar: patch.labels.ar.trim() || patch.labels.fr.trim(),
      en: patch.labels.en.trim() || patch.labels.fr.trim(),
    };
  }
  if (typeof patch.order === "number") updates.order = patch.order;

  await col.updateOne({ id }, { $set: updates });

  // Cascade label changes into denormalized cake.categoryLabel.
  let cakesAffected = 0;
  if (updates.labels) {
    const cakes = await getCakesCollection();
    const result = await cakes.updateMany(
      { category: existing.slug },
      { $set: { categoryLabel: updates.labels, updatedAt: now } }
    );
    cakesAffected = result.modifiedCount;
  }

  const updated = await getCategoryById(id);
  return { category: updated, cakesAffected };
}

export async function deleteCategory(id: string): Promise<{
  ok: boolean;
  cakesAffected: number;
}> {
  const col = await getCategoriesCollection();
  const existing = await getCategoryById(id);
  if (!existing) return { ok: false, cakesAffected: 0 };

  const cakes = await getCakesCollection();
  const cakesAffected = await cakes.countDocuments({ category: existing.slug });

  await col.deleteOne({ id });
  // Cakes keep their denormalized categoryLabel — they remain renderable,
  // they just lose the dropdown option in the admin form.
  return { ok: true, cakesAffected };
}
