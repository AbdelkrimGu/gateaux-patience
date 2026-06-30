// Configuration for the Tiramisu customizer.
// Two decoration styles, three sizes. Character limits adapt to the chosen
// size: bigger font => fewer lines & fewer characters per line.

export type TiramisuStyle = "cacao" | "pieces";
export type TiramisuSizeId = "large" | "medium" | "small";
export type Locale = "fr" | "ar" | "en";

export interface TiramisuSize {
  id: TiramisuSizeId;
  /** Max number of text lines allowed for this size. */
  maxLines: number;
  /** Characters allowed per line, per decoration style. */
  charsPerLine: Record<TiramisuStyle, number>;
  /** Relative font scale used by the preview. */
  fontScale: number;
  labels: Record<Locale, string>;
  /** Short hint shown under the size button. */
  hint: Record<Locale, string>;
}

export const TIRAMISU_SIZES: TiramisuSize[] = [
  {
    id: "large",
    maxLines: 1,
    charsPerLine: { cacao: 8, pieces: 8 },
    fontScale: 1,
    labels: { fr: "Grand", ar: "كبير", en: "Large" },
    hint: { fr: "1 ligne", ar: "سطر واحد", en: "1 line" },
  },
  {
    id: "medium",
    maxLines: 2,
    charsPerLine: { cacao: 11, pieces: 11 },
    fontScale: 0.74,
    labels: { fr: "Moyen", ar: "متوسط", en: "Medium" },
    hint: { fr: "jusqu'à 2 lignes", ar: "حتى سطرين", en: "up to 2 lines" },
  },
  {
    id: "small",
    maxLines: 4,
    charsPerLine: { cacao: 14, pieces: 14 },
    fontScale: 0.56,
    labels: { fr: "Petit", ar: "صغير", en: "Small" },
    hint: { fr: "jusqu'à 4 lignes", ar: "حتى 4 أسطر", en: "up to 4 lines" },
  },
];

export const STYLE_META: Record<
  TiramisuStyle,
  {
    emoji: string;
    labels: Record<Locale, string>;
    desc: Record<Locale, string>;
  }
> = {
  cacao: {
    emoji: "✍️",
    labels: {
      fr: "Écriture au cacao",
      ar: "كتابة بالكاكاو",
      en: "Cacao writing",
    },
    desc: {
      fr: "Votre texte tracé dans le cacao, façon naturelle et faite main.",
      ar: "نصّك مرسوم في الكاكاو، بطريقة طبيعية ومصنوعة يدويًا.",
      en: "Your text traced into the cacao — natural, hand-made look.",
    },
  },
  pieces: {
    emoji: "🍫",
    labels: {
      fr: "Lettres en chocolat blanc",
      ar: "حروف من الشوكولاتة البيضاء",
      en: "White-chocolate letters",
    },
    desc: {
      fr: "Cacao intégral, votre texte posé en pièces de chocolat blanc.",
      ar: "كاكاو كامل، ونصّك موضوع بقطع من الشوكولاتة البيضاء.",
      en: "Full cacao top with your text laid in white-chocolate pieces.",
    },
  },
};

/** Allowed characters on the cake: latin letters, digits, spaces, basic accents. */
export const ALLOWED_TEXT = /[^A-Za-z0-9À-ÿ '&!?.,\-]/g;

/** Sanitize a single line: strip disallowed chars/newlines, cap to its limit. */
export function sanitizeTiramisuLine(
  raw: string,
  style: TiramisuStyle,
  size: TiramisuSize
): string {
  return raw
    .replace(/\n/g, "")
    .replace(ALLOWED_TEXT, "")
    .slice(0, size.charsPerLine[style]);
}

// ---- Casual (non-personalized) boxes ----
export interface TiramisuBox {
  id: string;
  emoji: string;
  labels: Record<Locale, string>;
  portions: Record<Locale, string>;
}

export const TIRAMISU_BOXES: TiramisuBox[] = [
  {
    id: "individuel",
    emoji: "🥄",
    labels: { fr: "Individuel", ar: "فردي", en: "Individual" },
    portions: { fr: "1 personne", ar: "شخص واحد", en: "1 person" },
  },
  {
    id: "petit",
    emoji: "🍮",
    labels: { fr: "Petite boîte", ar: "علبة صغيرة", en: "Small box" },
    portions: { fr: "4 à 6 personnes", ar: "4 إلى 6 أشخاص", en: "4 to 6 people" },
  },
  {
    id: "grand",
    emoji: "🎉",
    labels: { fr: "Grande boîte", ar: "علبة كبيرة", en: "Large box" },
    portions: { fr: "8 à 10 personnes", ar: "8 إلى 10 أشخاص", en: "8 to 10 people" },
  },
];

/** Tiramisu photos. The live preview composites cacao+cream on a canvas. */
export const TIRAMISU_IMAGES = {
  cacao: "/images/tiramisu/base/cacao.png",
  cream: "/images/tiramisu/base/cream.png",
  hero: "/images/tiramisu/hero/hero-1.png",
};
