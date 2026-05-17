import { MongoClient, Db, Collection } from "mongodb";
import type { Cake, Category, Order } from "./db-types";

const dbName = process.env.MONGODB_DB || "gateaux-patience";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return Promise.reject(
      new Error("MONGODB_URI is not set. Add it to .env.local and to Netlify env vars.")
    );
  }

  if (process.env.NODE_ENV === "production") {
    return new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 8000,
      retryWrites: true,
    }).connect();
  }

  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 8000,
    }).connect();
  }
  return global._mongoClientPromise;
}

let cachedPromise: Promise<MongoClient> | null = null;
let initialized = false;

const DEFAULT_CATEGORIES: Array<Pick<Category, "slug" | "labels">> = [
  { slug: "birthday-kids", labels: { fr: "Anniversaire Enfants", ar: "عيد ميلاد الأطفال", en: "Kids Birthday" } },
  { slug: "birthday-adults", labels: { fr: "Anniversaire Adultes", ar: "عيد ميلاد البالغين", en: "Adult Birthday" } },
  { slug: "wedding", labels: { fr: "Mariage & Fiançailles", ar: "زفاف وخطوبة", en: "Wedding & Engagement" } },
  { slug: "graduation", labels: { fr: "Diplôme & Remise", ar: "التخرج والتكريم", en: "Graduation" } },
  { slug: "daily", labels: { fr: "Gâteaux du Quotidien", ar: "كعكات يومية", en: "Everyday Cakes" } },
  { slug: "customs", labels: { fr: "Personnalisés", ar: "مخصص", en: "Custom" } },
  { slug: "desserts", labels: { fr: "Desserts", ar: "حلويات", en: "Desserts" } },
];

async function initialize(db: Db) {
  const cakes = db.collection("cakes");
  const orders = db.collection("orders");
  const categories = db.collection("categories");

  await Promise.all([
    cakes.createIndex({ id: 1 }, { unique: true }),
    cakes.createIndex({ slug: 1 }, { unique: true }),
    cakes.createIndex({ published: 1 }),
    cakes.createIndex({ category: 1 }),
    cakes.createIndex(
      { featured: 1, createdAt: -1 },
      { partialFilterExpression: { featured: true } }
    ),
    cakes.createIndex({ createdAt: -1 }),
    orders.createIndex({ id: 1 }, { unique: true }),
    orders.createIndex({ status: 1 }),
    orders.createIndex({ createdAt: -1 }),
    categories.createIndex({ id: 1 }, { unique: true }),
    categories.createIndex({ slug: 1 }, { unique: true }),
    categories.createIndex({ order: 1 }),
  ]);

  const existing = await categories.countDocuments({}, { limit: 1 });
  if (existing === 0) {
    const now = new Date().toISOString();
    const docs = DEFAULT_CATEGORIES.map((c, i) => ({
      id: `${c.slug}-${Date.now().toString(36)}${i.toString(36)}`,
      slug: c.slug,
      labels: c.labels,
      order: i,
      createdAt: now,
      updatedAt: now,
    }));
    try {
      await categories.insertMany(docs, { ordered: false });
    } catch (err) {
      console.warn("[mongodb] category seed: insertMany partial result:", err instanceof Error ? err.message : err);
    }
  }
}

export async function getDb(): Promise<Db> {
  if (!cachedPromise) cachedPromise = getClientPromise();
  const client = await cachedPromise;
  const db = client.db(dbName);
  if (!initialized) {
    try {
      await initialize(db);
      initialized = true;
    } catch (err) {
      console.error("[mongodb] init failed:", err);
    }
  }
  return db;
}

export async function getCakesCollection(): Promise<Collection<Cake>> {
  const db = await getDb();
  return db.collection<Cake>("cakes");
}

export async function getOrdersCollection(): Promise<Collection<Order>> {
  const db = await getDb();
  return db.collection<Order>("orders");
}

export async function getCategoriesCollection(): Promise<Collection<Category>> {
  const db = await getDb();
  return db.collection<Category>("categories");
}
