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

// 2D shadow layers are OFF. The letter PNGs already carry their own real 3D
// shading (glossy white chocolate / cocoa-dusted cream), so the app-drawn cast +
// contact shadows read as "weird" doubled shadows. Alphas are 0 → no shadow is
// drawn (paintPreview skips the passes). Bump these back up to reintroduce
// contact/cast shadows later if wanted; the ratios are kept for that.
const PIECES_COMMON = {
  tracking: 0.16,
  wordSpacing: 0.55,
  maxRotationDeg: 3.2,
  maxJitterPx: 3.5,
  shadowAlpha: 0,
  shadowBlurRatio: 0.08,
  shadowOffsetYRatio: 0.06,
  contactShadowAlpha: 0,
  contactShadowBlurRatio: 0.16,
  cocoaContactAlpha: 0,
} as const;

const CACAO_COMMON = {
  tracking: 0.12,
  wordSpacing: 0.55,
  maxRotationDeg: 2.4,
  maxJitterPx: 3,
  shadowAlpha: 0,
  shadowBlurRatio: 0.05,
  shadowOffsetYRatio: 0.025,
  contactShadowAlpha: 0,
  contactShadowBlurRatio: 0.14,
  cocoaContactAlpha: 0,
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

// Active base surfaces: per-template top-down box images (currently AI-generated
// placeholders, treated as the live assets). Drop a real photo at the same path
// to replace one — no code change. See public/images/tiramisu/templates/README.md.
// The old procedural cust-*.png surfaces remain as an offline fallback only.
const templateBase = (id: TemplateId) => `/images/tiramisu/templates/${id}/base.png`;

const p = (x: number, y: number): Point => ({ x, y });

// ---- the 6 templates -------------------------------------------------------

export const TIRAMISU_TEMPLATES: Record<TemplateId, TiramisuTemplate> = {
  "square-small": {
    id: "square-small",
    shape: "square",
    sizeId: "small",
    canvasSize: 900,
    baseImage: templateBase("square-small"),
    // Tuned to the real cocoa (image cocoa ≈ x[0.326,0.672] y[0.318,0.649]);
    // inset off the clear rim. Small box → short names, bigger relative letters.
    writablePolygon: [p(0.35, 0.34), p(0.648, 0.34), p(0.648, 0.628), p(0.35, 0.628)],
    lineRules: { maxLines: 2, maxCharsPerLine: 7, maxTotalChars: 12 },
    letterRender: letterRender(70, 44, 92),
  },
  "square-medium": {
    id: "square-medium",
    shape: "square",
    sizeId: "medium",
    canvasSize: 900,
    baseImage: templateBase("square-medium"),
    // Cocoa ≈ x[0.173,0.824] y[0.167,0.822], inset off the rim.
    writablePolygon: [p(0.21, 0.21), p(0.79, 0.21), p(0.79, 0.79), p(0.21, 0.79)],
    lineRules: { maxLines: 2, maxCharsPerLine: 10, maxTotalChars: 20 },
    letterRender: letterRender(88, 60, 108),
  },
  "square-large": {
    id: "square-large",
    shape: "square",
    sizeId: "large",
    canvasSize: 900,
    baseImage: templateBase("square-large"),
    // Cocoa ≈ x[0.112,0.89] y[0.112,0.891] (box fills frame), inset off the rim.
    writablePolygon: [p(0.15, 0.15), p(0.855, 0.15), p(0.855, 0.855), p(0.15, 0.855)],
    lineRules: { maxLines: 3, maxCharsPerLine: 11, maxTotalChars: 28 },
    letterRender: letterRender(80, 58, 100),
  },
  "heart-medium": {
    id: "heart-medium",
    shape: "heart",
    sizeId: "medium",
    canvasSize: 900,
    baseImage: templateBase("heart-medium"),
    // Tuned to the real heart cocoa (belt ≈ y0.42 x[0.146,0.848]); stays below
    // the top notch and above the bottom point, centred on the widest belt.
    writablePolygon: [
      p(0.30, 0.35),
      p(0.70, 0.35),
      p(0.77, 0.44),
      p(0.66, 0.56),
      p(0.50, 0.64),
      p(0.34, 0.56),
      p(0.23, 0.44),
    ],
    lineRules: { maxLines: 2, maxCharsPerLine: 7, maxTotalChars: 14 },
    letterRender: letterRender(66, 46, 86),
  },
  "heart-large": {
    id: "heart-large",
    shape: "heart",
    sizeId: "large",
    canvasSize: 900,
    baseImage: templateBase("heart-large"),
    // Larger heart (belt ≈ y0.35 x[0.115,0.885]); more vertical room for 3 lines,
    // still clear of the top notch and the bottom point.
    writablePolygon: [
      p(0.27, 0.33),
      p(0.73, 0.33),
      p(0.81, 0.45),
      p(0.66, 0.61),
      p(0.50, 0.70),
      p(0.34, 0.61),
      p(0.19, 0.45),
    ],
    lineRules: { maxLines: 3, maxCharsPerLine: 8, maxTotalChars: 21 },
    letterRender: letterRender(66, 46, 86),
  },
  "oval-large": {
    id: "oval-large",
    shape: "oval",
    sizeId: "large",
    canvasSize: 900,
    baseImage: templateBase("oval-large"),
    // Wide oval (belt ≈ y0.50 x[0.061,0.936]); octagon uses the wide middle belt
    // and stays clear of the top/bottom taper.
    writablePolygon: [
      p(0.30, 0.34),
      p(0.70, 0.34),
      p(0.86, 0.45),
      p(0.86, 0.57),
      p(0.70, 0.68),
      p(0.30, 0.68),
      p(0.14, 0.57),
      p(0.14, 0.45),
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
