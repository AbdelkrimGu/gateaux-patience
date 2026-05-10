import fs from "fs";
import path from "path";

const CAKES_FILE = path.join(process.cwd(), "data", "cakes.json");
const ORDERS_FILE = path.join(process.cwd(), "data", "orders.json");

export interface AdminCake {
  id: string;
  slug: string;
  images: string[];
  category: string;
  categoryLabel: { fr: string; ar: string; en: string };
  translations: {
    fr: { title: string; description: string };
    ar: { title: string; description: string };
    en: { title: string; description: string };
  };
  length?: number;
  width?: number;
  height?: number;
  pieces?: number;
  persons?: number;
  featured: boolean;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  cakeId?: string;
  cakeTitle?: string;
  name: string;
  phone: string;
  message: string;
  status: "new" | "seen" | "done";
  createdAt: string;
}

function readJSON<T>(filePath: string, defaultValue: T): T {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function writeJSON(filePath: string, data: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export function getCakes(): AdminCake[] {
  return readJSON<{ cakes: AdminCake[] }>(CAKES_FILE, { cakes: [] }).cakes;
}

export function saveCakes(cakes: AdminCake[]) {
  writeJSON(CAKES_FILE, { cakes });
}

export function getCakeById(id: string): AdminCake | undefined {
  return getCakes().find((c) => c.id === id);
}

export function getOrders(): Order[] {
  return readJSON<{ orders: Order[] }>(ORDERS_FILE, { orders: [] }).orders;
}

export function saveOrders(orders: Order[]) {
  writeJSON(ORDERS_FILE, { orders });
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}
