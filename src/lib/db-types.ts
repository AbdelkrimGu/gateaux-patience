export type Locale = "fr" | "ar" | "en";

export interface CakeTranslation {
  title: string;
  description: string;
}

export type CategoryLabel = Record<Locale, string>;
export type CakeTranslations = Record<Locale, CakeTranslation>;

export interface Cake {
  id: string;
  slug: string;
  images: string[];
  category: string;
  categoryLabel: CategoryLabel;
  translations: CakeTranslations;
  length?: number;
  width?: number;
  height?: number;
  pieces?: number;
  persons?: number;
  featured: boolean;
  hero?: boolean;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  slug: string;
  labels: { fr: string; ar: string; en: string };
  image?: string;
  /** Which public universe lists it: /galerie ("cakes", the default when
   *  absent) or /douceurs ("sweets"). Set by the owner in the admin; read-time
   *  defaults live in src/lib/universes-core.ts. */
  universe?: "cakes" | "sweets";
  order: number;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = "new" | "seen" | "done";

export interface Order {
  id: string;
  cakeId?: string;
  cakeTitle?: string;
  name: string;
  phone: string;
  message: string;
  status: OrderStatus;
  createdAt: string;
}

export const PROJECT_NO_MONGO_ID = { _id: 0 } as const;
