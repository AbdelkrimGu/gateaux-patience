// Unified product-template model for the tiramisu previewer.
//
// This is the NEW single source of truth for "what a given box looks like and
// how much text it can carry". Each real product (shape × size) is ONE template
// that owns: its base image, its writable area (as a normalized POLYGON — not a
// rectangle, so heart/oval fit properly), its text capacity rules, and its
// per-style letter-rendering config.
//
// The 6 real products:
//   square: small | medium | large
//   heart:  medium | large
//   oval:   large
//
// Layout (tiramisu-layout.ts) consumes a template; the 2D canvas is the primary
// renderer, the 3D scene reads template.shape + template.baseImage via an adapter.

import type { TiramisuStyle } from "./tiramisu-config";

export type BoxShape = "square" | "heart" | "oval";
export type TiramisuSizeId = "small" | "medium" | "large";

export type TemplateId =
  | "square-small"
  | "square-medium"
  | "square-large"
  | "heart-medium"
  | "heart-large"
  | "oval-large";

/** A point in normalized [0..1] surface space (x right, y down). */
export interface Point {
  x: number;
  y: number;
}
/** A closed polygon (implicitly closed: last point connects back to first). */
export type Polygon = Point[];

/**
 * Per-style letter rendering + fitting knobs. All *Px values are in canvas
 * pixels (against `canvasSize`); ratio values multiply the fitted cap height.
 */
export interface LetterRenderConfig {
  /** Ideal cap height — the "mould" size we start from. */
  baseCapPx: number;
  /** Never shrink below this; if text still won't fit, report fits=false. */
  minCapPx: number;
  /** Never grow above this. */
  maxCapPx: number;
  /** Letter spacing, as a fraction of cap. */
  tracking: number;
  /** Space width, as a fraction of cap. */
  wordSpacing: number;
  /** Max deterministic tilt per glyph, degrees. */
  maxRotationDeg: number;
  /** Max deterministic x/y jitter per glyph, pixels. */
  maxJitterPx: number;
  /** Cast (drop) shadow of the letter PNG. */
  shadowAlpha: number;
  shadowBlurRatio: number; // × cap
  shadowOffsetYRatio: number; // × cap
  /** Soft grounding shadow directly beneath the letter (sits-on-cocoa). */
  contactShadowAlpha: number;
  contactShadowBlurRatio: number; // × cap
  /** Very subtle cocoa darkening/indentation halo around the letter. */
  cocoaContactAlpha: number;
}

export interface TemplateLineRules {
  maxLines: number;
  maxCharsPerLine: number;
  maxTotalChars: number;
}

export interface TiramisuTemplate {
  id: TemplateId;
  shape: BoxShape;
  sizeId: TiramisuSizeId;
  canvasSize: number;
  baseImage: string;
  /** Writable area as a normalized polygon (the MAIN writing-area model). */
  writablePolygon: Polygon;
  lineRules: TemplateLineRules;
  letterRender: Record<TiramisuStyle, LetterRenderConfig>;
}

// ---- letter-config builders -----------------------------------------------
// White chocolate = a physical mould: keep it near a fixed size (tight cap band)
// and only scale down when a line truly won't fit. Cacao is hand-traced, so it
// may shrink further and casts a softer, shallower shadow.

const PIECES_COMMON = {
  tracking: 0.16,
  wordSpacing: 0.55,
  maxRotationDeg: 3.2,
  maxJitterPx: 3.5,
  shadowAlpha: 0.42,
  shadowBlurRatio: 0.08,
  shadowOffsetYRatio: 0.06,
  contactShadowAlpha: 0.26,
  contactShadowBlurRatio: 0.16,
  cocoaContactAlpha: 0.12,
} as const;

const CACAO_COMMON = {
  tracking: 0.12,
  wordSpacing: 0.55,
  maxRotationDeg: 2.4,
  maxJitterPx: 3,
  shadowAlpha: 0.22,
  shadowBlurRatio: 0.05,
  shadowOffsetYRatio: 0.025,
  contactShadowAlpha: 0.16,
  contactShadowBlurRatio: 0.14,
  cocoaContactAlpha: 0.06,
} as const;

function letterRender(
  baseCapPx: number,
  minCapPx: number,
  maxCapPx: number
): Record<TiramisuStyle, LetterRenderConfig> {
  return {
    pieces: { baseCapPx, minCapPx, maxCapPx, ...PIECES_COMMON },
    // Cacao may shrink further (min ~75% of the mould floor) and grow the same.
    cacao: {
      baseCapPx,
      minCapPx: Math.round(minCapPx * 0.75),
      maxCapPx,
      ...CACAO_COMMON,
    },
  };
}

const BOXES = "/images/tiramisu/boxes";
// TODO(assets): swap to per-template photos under /images/tiramisu/templates/
// <id>/base.png when the real top-down shots exist; the structure already
// supports it — only these strings change.
const BASE_IMAGE: Record<BoxShape, string> = {
  square: `${BOXES}/cust-square.png`,
  heart: `${BOXES}/cust-heart.png`,
  oval: `${BOXES}/cust-oval.png`,
};

const p = (x: number, y: number): Point => ({ x, y });

// ---- the 6 templates -------------------------------------------------------

export const TIRAMISU_TEMPLATES: Record<TemplateId, TiramisuTemplate> = {
  "square-small": {
    id: "square-small",
    shape: "square",
    sizeId: "small",
    canvasSize: 900,
    baseImage: BASE_IMAGE.square,
    // Safe inset rectangle — small box, least usable area.
    writablePolygon: [p(0.22, 0.34), p(0.78, 0.34), p(0.78, 0.66), p(0.22, 0.66)],
    lineRules: { maxLines: 2, maxCharsPerLine: 7, maxTotalChars: 14 },
    letterRender: letterRender(92, 72, 104),
  },
  "square-medium": {
    id: "square-medium",
    shape: "square",
    sizeId: "medium",
    canvasSize: 900,
    baseImage: BASE_IMAGE.square,
    writablePolygon: [p(0.17, 0.30), p(0.83, 0.30), p(0.83, 0.70), p(0.17, 0.70)],
    lineRules: { maxLines: 2, maxCharsPerLine: 10, maxTotalChars: 20 },
    letterRender: letterRender(76, 60, 92),
  },
  "square-large": {
    id: "square-large",
    shape: "square",
    sizeId: "large",
    canvasSize: 900,
    baseImage: BASE_IMAGE.square,
    writablePolygon: [p(0.14, 0.27), p(0.86, 0.27), p(0.86, 0.73), p(0.14, 0.73)],
    lineRules: { maxLines: 3, maxCharsPerLine: 11, maxTotalChars: 28 },
    letterRender: letterRender(76, 60, 92),
  },
  "heart-medium": {
    id: "heart-medium",
    shape: "heart",
    sizeId: "medium",
    canvasSize: 900,
    baseImage: BASE_IMAGE.heart,
    // Narrow near the top cusp, widest across the middle, tapering to the point.
    writablePolygon: [
      p(0.36, 0.32),
      p(0.64, 0.32),
      p(0.76, 0.46),
      p(0.60, 0.60),
      p(0.50, 0.70),
      p(0.40, 0.60),
      p(0.24, 0.46),
    ],
    lineRules: { maxLines: 2, maxCharsPerLine: 7, maxTotalChars: 14 },
    letterRender: letterRender(64, 46, 84),
  },
  "heart-large": {
    id: "heart-large",
    shape: "heart",
    sizeId: "large",
    canvasSize: 900,
    baseImage: BASE_IMAGE.heart,
    writablePolygon: [
      p(0.32, 0.29),
      p(0.68, 0.29),
      p(0.82, 0.46),
      p(0.63, 0.63),
      p(0.50, 0.75),
      p(0.37, 0.63),
      p(0.18, 0.46),
    ],
    lineRules: { maxLines: 3, maxCharsPerLine: 8, maxTotalChars: 21 },
    letterRender: letterRender(64, 46, 84),
  },
  "oval-large": {
    id: "oval-large",
    shape: "oval",
    sizeId: "large",
    canvasSize: 900,
    baseImage: BASE_IMAGE.oval,
    // Octagon approximating an ellipse: wide belt in the middle, tapered ends.
    writablePolygon: [
      p(0.36, 0.26),
      p(0.64, 0.26),
      p(0.82, 0.40),
      p(0.82, 0.60),
      p(0.64, 0.74),
      p(0.36, 0.74),
      p(0.18, 0.60),
      p(0.18, 0.40),
    ],
    lineRules: { maxLines: 3, maxCharsPerLine: 12, maxTotalChars: 30 },
    letterRender: letterRender(62, 48, 82),
  },
};

// ---- lookups ---------------------------------------------------------------

/** Which sizes each shape actually ships in (menu rules from the moulds). */
export const SHAPE_SIZES: Record<BoxShape, TiramisuSizeId[]> = {
  square: ["small", "medium", "large"],
  heart: ["medium", "large"],
  oval: ["large"],
};

const SIZE_ORDER: TiramisuSizeId[] = ["small", "medium", "large"];

export function getTiramisuTemplate(id: TemplateId): TiramisuTemplate {
  return TIRAMISU_TEMPLATES[id];
}

export function getAvailableTemplates(): TiramisuTemplate[] {
  return Object.values(TIRAMISU_TEMPLATES);
}

/**
 * Resolve a template id from a shape + size. If the exact combo isn't a real
 * product (e.g. heart-small, oval-medium), clamp to the nearest size that shape
 * DOES ship in, so the preview always has a valid template to render.
 */
export function getTemplateId(shape: BoxShape, sizeId: TiramisuSizeId): TemplateId {
  const sizes = SHAPE_SIZES[shape];
  if (sizes.includes(sizeId)) return `${shape}-${sizeId}` as TemplateId;
  // Nearest available size by index distance.
  const want = SIZE_ORDER.indexOf(sizeId);
  let best = sizes[0];
  let bestDist = Infinity;
  for (const s of sizes) {
    const d = Math.abs(SIZE_ORDER.indexOf(s) - want);
    if (d < bestDist) {
      bestDist = d;
      best = s;
    }
  }
  return `${shape}-${best}` as TemplateId;
}

export function resolveTemplate(shape: BoxShape, sizeId: TiramisuSizeId): TiramisuTemplate {
  return getTiramisuTemplate(getTemplateId(shape, sizeId));
}
