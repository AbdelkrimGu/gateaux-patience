// Catalog for the tiramisu box picker.
//
// ▶▶ EDIT ME: prices below are PLACEHOLDERS (Algerian dinar, DA). Replace each
//    `price` with your real price. You can also add/remove shapes inside a
//    category's `options`, or swap any image by dropping a same-named file in
//    /public/images/tiramisu/boxes/.
//
// Each category is a section in the picker; its `options` are the shapes shown
// in the horizontal shape-scroller. `customizable: true` means that box has a
// flat cocoa top a customer can personalise (write on); glasses/verrines are
// false — they can be ordered but not written on.

import type { Locale } from "./tiramisu-config";

export type BoxShape = "round" | "square" | "rectangle" | "heart" | "glass";

export interface TiramisuBoxOption {
  id: string;
  shape: BoxShape;
  /** Image under /public/images/tiramisu/boxes/ */
  image: string;
  /** Price in DA — PLACEHOLDER, edit me. */
  price: number;
  /** Can this box be personalised (has a flat cocoa top)? */
  customizable: boolean;
  shapeLabel: Record<Locale, string>;
}

export interface TiramisuBoxCategory {
  id: string;
  labels: Record<Locale, string>;
  portions: Record<Locale, string>;
  options: TiramisuBoxOption[];
}

const BOX = "/images/tiramisu/boxes";

export const TIRAMISU_CATALOG: TiramisuBoxCategory[] = [
  {
    id: "individuel",
    labels: { fr: "Individuel", ar: "فردي", en: "Individual" },
    portions: { fr: "1 personne", ar: "شخص واحد", en: "1 person" },
    options: [
      {
        id: "ind-coupe",
        shape: "glass",
        image: `${BOX}/ind-coupe.jpg`,
        price: 250,
        customizable: false,
        shapeLabel: { fr: "Coupe", ar: "كأس", en: "Cup" },
      },
      {
        id: "ind-verrine",
        shape: "glass",
        image: `${BOX}/ind-verrine.jpg`,
        price: 250,
        customizable: false,
        shapeLabel: { fr: "Verrine", ar: "كأس صغير", en: "Verrine" },
      },
      {
        id: "ind-trio",
        shape: "glass",
        image: `${BOX}/ind-trio.jpg`,
        price: 650,
        customizable: false,
        shapeLabel: { fr: "Trio", ar: "ثلاثية", en: "Trio" },
      },
    ],
  },
  {
    id: "petit",
    labels: { fr: "À partager", ar: "للمشاركة", en: "To share" },
    portions: { fr: "4 à 6 personnes", ar: "4 إلى 6 أشخاص", en: "4 to 6 people" },
    options: [
      {
        id: "petit-carre",
        shape: "square",
        image: `${BOX}/petit-carre.jpg`,
        price: 1500,
        customizable: true,
        shapeLabel: { fr: "Carré", ar: "مربّع", en: "Square" },
      },
      {
        id: "petit-rond",
        shape: "round",
        image: `${BOX}/petit-rond.jpg`,
        price: 1500,
        customizable: true,
        shapeLabel: { fr: "Rond", ar: "دائري", en: "Round" },
      },
      {
        id: "petit-rectangle",
        shape: "rectangle",
        image: `${BOX}/petit-rectangle.jpg`,
        price: 1700,
        customizable: true,
        shapeLabel: { fr: "Rectangle", ar: "مستطيل", en: "Rectangle" },
      },
    ],
  },
  {
    id: "grand",
    labels: { fr: "Familial", ar: "عائلي", en: "Family" },
    portions: { fr: "8 à 12 personnes", ar: "8 إلى 12 شخصًا", en: "8 to 12 people" },
    options: [
      {
        id: "grand-rond",
        shape: "round",
        image: `${BOX}/grand-rond.jpg`,
        price: 3000,
        customizable: true,
        shapeLabel: { fr: "Rond", ar: "دائري", en: "Round" },
      },
      {
        id: "grand-rectangle",
        shape: "rectangle",
        image: `${BOX}/grand-rectangle.jpg`,
        price: 3200,
        customizable: true,
        shapeLabel: { fr: "Rectangle", ar: "مستطيل", en: "Rectangle" },
      },
      {
        id: "grand-plateau",
        shape: "rectangle",
        image: `${BOX}/grand-plateau.jpg`,
        price: 3800,
        customizable: true,
        shapeLabel: { fr: "Grand plateau", ar: "صينية كبيرة", en: "Large tray" },
      },
    ],
  },
];

/** Format a price in Algerian dinar, e.g. 1500 → "1 500 DA". */
export function formatDA(amount: number): string {
  return `${amount.toLocaleString("fr-FR").replace(/ /g, " ")} DA`;
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
