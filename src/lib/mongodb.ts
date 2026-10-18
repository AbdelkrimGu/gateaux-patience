import { MongoClient, Db, Collection } from "mongodb";
import type { Cake, Category, Order } from "./db-types";
import type {
  CostItem,
  PriceQuote,
  PriceTemplate,
  PricingSettings,
  TemplatePriceChange,
} from "./pricing-types";

/** The pricing settings live in a single document with this id. */
export type PricingSettingsDoc = PricingSettings & { id: "default" };

/**
 * Server-only fields, never sent to the client:
 * - `pricingRev`: renewed on every write of the sheet (save or automatic
 *   re-pricing), so concurrent writers can't overwrite each other's snapshots.
 * - `pricingIssues`: per size, the unpriceable lines already reported in the
 *   history (see repriceAllTemplates), so each is reported once.
 */
export type PriceTemplateDoc = PriceTemplate & {
  pricingRev: string;
  pricingIssues?: Record<string, string[]>;
};

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
  const pricingCosts = db.collection("pricing_costs");
  const pricingQuotes = db.collection("pricing_quotes");
  const pricingSettings = db.collection("pricing_settings");
  const pricingTemplates = db.collection("pricing_templates");
  const pricingTemplateHistory = db.collection("pricing_template_history");

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
    pricingCosts.createIndex({ id: 1 }, { unique: true }),
    pricingCosts.createIndex({ kind: 1, name: 1 }),
    pricingQuotes.createIndex({ id: 1 }, { unique: true }),
    pricingQuotes.createIndex({ updatedAt: -1 }),
    pricingSettings.createIndex({ id: 1 }, { unique: true }),
    pricingTemplates.createIndex({ id: 1 }, { unique: true }),
    pricingTemplates.createIndex({ updatedAt: -1 }),
    pricingTemplates.createIndex({ cakeId: 1 }),
    pricingTemplateHistory.createIndex({ id: 1 }, { unique: true }),
    pricingTemplateHistory.createIndex({ templateId: 1, at: -1 }),
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

export async function getPricingCostsCollection(): Promise<Collection<CostItem>> {
  const db = await getDb();
  return db.collection<CostItem>("pricing_costs");
}

export async function getPricingQuotesCollection(): Promise<Collection<PriceQuote>> {
  const db = await getDb();
  return db.collection<PriceQuote>("pricing_quotes");
}

export async function getPricingSettingsCollection(): Promise<Collection<PricingSettingsDoc>> {
  const db = await getDb();
  return db.collection<PricingSettingsDoc>("pricing_settings");
}

export async function getPricingTemplatesCollection(): Promise<Collection<PriceTemplateDoc>> {
  const db = await getDb();
  return db.collection<PriceTemplateDoc>("pricing_templates");
}

export async function getPricingTemplateHistoryCollection(): Promise<Collection<TemplatePriceChange>> {
  const db = await getDb();
  return db.collection<TemplatePriceChange>("pricing_template_history");
}
