// Catalog for the tiramisu box picker.
//
// ▶▶ EDIT ME: prices below are PLACEHOLDERS (Algerian dinar, DA). Replace each
//    `price` with your real price.
//
// Menu rules (per the shop's moulds):
//   • Small  → square only
//   • Medium → square or heart
//   • Large  → square, heart or oval
// Every box has a flat cocoa top, so all are customizable. Shape thumbnails are
// rendered from the real cocoa surface (see boxes/CREDITS.md) and match the
// customizer preview exactly.

import type { Locale } from "./tiramisu-config";

export type BoxShape = "square" | "heart" | "oval";

const SHAPE_META: Record<
  BoxShape,
  { image: string; label: Record<Locale, string> }
> = {
  square: {
    image: "/images/tiramisu/boxes/box-square.png",
    label: { fr: "Carré", ar: "مربّع", en: "Square" },
  },
  heart: {
    image: "/images/tiramisu/boxes/box-heart.png",
    label: { fr: "Cœur", ar: "قلب", en: "Heart" },
  },
  oval: {
    image: "/images/tiramisu/boxes/box-oval.png",
    label: { fr: "Ovale", ar: "بيضوي", en: "Oval" },
  },
};

export interface TiramisuBoxOption {
  id: string;
  shape: BoxShape;
  image: string;
  /** Price in DA — PLACEHOLDER, edit me. */
  price: number;
  customizable: boolean;
  shapeLabel: Record<Locale, string>;
}

export interface TiramisuBoxCategory {
  id: string;
  labels: Record<Locale, string>;
  portions: Record<Locale, string>;
  options: TiramisuBoxOption[];
}

function opt(sizeId: string, shape: BoxShape, price: number): TiramisuBoxOption {
  return {
    id: `${sizeId}-${shape}`,
    shape,
    image: SHAPE_META[shape].image,
    price,
    customizable: true,
    shapeLabel: SHAPE_META[shape].label,
  };
}

export const TIRAMISU_CATALOG: TiramisuBoxCategory[] = [
  {
    id: "small",
    labels: { fr: "Petite boîte", ar: "علبة صغيرة", en: "Small box" },
    portions: { fr: "2 à 3 personnes", ar: "2 إلى 3 أشخاص", en: "2 to 3 people" },
    options: [opt("small", "square", 1200)],
  },
  {
    id: "medium",
    labels: { fr: "Boîte moyenne", ar: "علبة متوسطة", en: "Medium box" },
    portions: { fr: "4 à 6 personnes", ar: "4 إلى 6 أشخاص", en: "4 to 6 people" },
    options: [opt("medium", "square", 2000), opt("medium", "heart", 2400)],
  },
  {
    id: "large",
    labels: { fr: "Grande boîte", ar: "علبة كبيرة", en: "Large box" },
    portions: { fr: "8 à 12 personnes", ar: "8 إلى 12 شخصًا", en: "8 to 12 people" },
    options: [
      opt("large", "square", 3200),
      opt("large", "heart", 3600),
      opt("large", "oval", 3600),
    ],
  },
];

/** Format a price in Algerian dinar, e.g. 1500 → "1 500 DA". */
export function formatDA(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} DA`;
}

export interface CatalogLookup {
  category: TiramisuBoxCategory;
  option: TiramisuBoxOption;
}

export function findOption(optionId: string): CatalogLookup | null {
  for (const category of TIRAMISU_CATALOG) {
    const option = category.options.find((o) => o.id === optionId);
    if (option) return { category, option };
  }
  return null;
}
