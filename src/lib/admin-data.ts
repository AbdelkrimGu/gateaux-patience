import { randomUUID } from "crypto";
import { getCakesCollection, getOrdersCollection } from "./mongodb";
import type { Cake, Order, OrderStatus } from "./db-types";

export type { Cake, Order, OrderStatus, Locale, CakeTranslation, CategoryLabel } from "./db-types";
export type AdminCake = Cake;

const PROJECT_NO_ID = { _id: 0 } as const;

export function generateId(): string {
  return randomUUID();
}

export function slugify(text: string): string {
  const cleaned = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
  return cleaned || "cake";
}

async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  const col = await getCakesCollection();
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

export async function getCakes(): Promise<Cake[]> {
  const col = await getCakesCollection();
  const docs = await col
    .find({}, { projection: PROJECT_NO_ID })
    .sort({ createdAt: -1 })
    .toArray();
  return docs as unknown as Cake[];
}

export async function getCakeById(id: string): Promise<Cake | null> {
  const col = await getCakesCollection();
  const doc = await col.findOne({ id }, { projection: PROJECT_NO_ID });
  return (doc as unknown as Cake) || null;
}

export async function getCakeBySlugAdmin(slug: string): Promise<Cake | null> {
  const col = await getCakesCollection();
  const doc = await col.findOne({ slug }, { projection: PROJECT_NO_ID });
  return (doc as unknown as Cake) || null;
}

export type CakeInput = Omit<Cake, "id" | "slug" | "createdAt" | "updatedAt">;

export async function createCake(input: CakeInput): Promise<Cake> {
  const col = await getCakesCollection();
  const now = new Date().toISOString();
  const baseSlug = slugify(input.translations.fr.title || "cake");
  const slug = await ensureUniqueSlug(baseSlug);
  const id = generateId();
  const cake: Cake = { ...input, id, slug, createdAt: now, updatedAt: now };
  await col.insertOne(cake as never);
  return cake;
}

export type CakePatch = Partial<Omit<Cake, "id" | "slug" | "createdAt" | "updatedAt">>;

export async function updateCake(id: string, patch: CakePatch): Promise<Cake | null> {
  const col = await getCakesCollection();
  const now = new Date().toISOString();
  await col.updateOne({ id }, { $set: { ...patch, updatedAt: now } });
  return getCakeById(id);
}

export async function deleteCake(id: string): Promise<Cake | null> {
  const existing = await getCakeById(id);
  if (!existing) return null;
  const col = await getCakesCollection();
  await col.deleteOne({ id });
  return existing;
}

export async function getOrders(): Promise<Order[]> {
  const col = await getOrdersCollection();
  const docs = await col
    .find({}, { projection: PROJECT_NO_ID })
    .sort({ createdAt: -1 })
    .toArray();
  return docs as unknown as Order[];
}

export async function getOrderById(id: string): Promise<Order | null> {
  const col = await getOrdersCollection();
  const doc = await col.findOne({ id }, { projection: PROJECT_NO_ID });
  return (doc as unknown as Order) || null;
}

export interface OrderInput {
  name: string;
  phone: string;
  message: string;
  cakeId?: string;
  cakeTitle?: string;
}

export async function createOrder(input: OrderInput): Promise<Order> {
  const col = await getOrdersCollection();
  const order: Order = {
    id: generateId(),
    name: input.name,
    phone: input.phone,
    message: input.message,
    cakeId: input.cakeId,
    cakeTitle: input.cakeTitle,
    status: "new",
    createdAt: new Date().toISOString(),
  };
  await col.insertOne(order as never);
  return order;
}

export type OrderPatch = Partial<Pick<Order, "status" | "name" | "phone" | "message">>;

export async function updateOrder(id: string, patch: OrderPatch): Promise<Order | null> {
  const col = await getOrdersCollection();
  await col.updateOne({ id }, { $set: patch });
  return getOrderById(id);
}

export async function deleteOrder(id: string): Promise<boolean> {
  const col = await getOrdersCollection();
  const result = await col.deleteOne({ id });
  return result.deletedCount > 0;
}
