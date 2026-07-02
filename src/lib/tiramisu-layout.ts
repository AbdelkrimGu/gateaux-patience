// Template-driven typographic layout + 2D compositing for the tiramisu preview.
//
// This is the SINGLE SOURCE OF TRUTH for how a customer's message is laid out on
// a specific product (a TiramisuTemplate) and painted onto its cocoa top. It is
// POLYGON-AWARE: text is fitted inside the template's writable polygon (not a
// bare rectangle), so heart/oval read properly. It NEVER silently drops text —
// it reports { fits, warnings } instead.
//
// Consumers:
//   • src/components/tiramisu/TiramisuCanvas.tsx   (2D canvas — PRIMARY renderer)
//   • src/components/tiramisu/three/*              (3D scene — reads the same layout)
//
// Coordinates are canvas pixels in [0..canvasSize]²; glyph positions map directly
// onto the 2D canvas and are projected onto the cocoa-top plane in 3D.

import manifest from "@/lib/tiramisu-glyphs.json";
import { ALLOWED_TEXT, type TiramisuStyle } from "@/lib/tiramisu-config";
import type {
  Polygon,
  TemplateId,
  TiramisuTemplate,
  LetterRenderConfig,
} from "@/lib/tiramisu-templates";

export type GlyphMap = Record<string, { file: string; aspect: number; hr: number }>;

const { glyphs, cacaoGlyphs } = manifest as {
  disc: { cx: number; cy: number; r: number };
  glyphs: GlyphMap;
  cacaoGlyphs: GlyphMap;
};

export const BASE = "/images/tiramisu";
export const S = 900; // legacy default canvas resolution (templates carry their own)
export const LINEGAP = 1.42;

// Cocoa tints for the contact/indentation passes (brown, not pure black).
const COCOA = "62,38,20";
const COCOA_DARK = "34,19,9";

// Kept as a legacy shape key so the 3D geometry (which has a `round` fallback)
// still type-checks. Real products are square | heart | oval (see BoxShape).
export type ShapeKey = "round" | "square" | "heart" | "oval";

// Per-style glyph asset sets. Visual/fitting params now live on the TEMPLATE
// (template.letterRender[style]); these only map a character to its PNG.
export interface GlyphSet {
  glyphs: GlyphMap;
  folder: string;
}
export const SETS: Record<TiramisuStyle, GlyphSet> = {
  pieces: { glyphs, folder: "letters" },
  cacao: { glyphs: cacaoGlyphs, folder: "letters-cacao" },
};

export function spriteUrl(set: GlyphSet, ch: string): string | null {
  const g = set.glyphs[ch];
  return g ? `${BASE}/${set.folder}/${g.file}` : null;
}

// ---- image loading (shared, cached) ----
const imgCache = new Map<string, Promise<HTMLImageElement>>();
export function loadImage(src: string): Promise<HTMLImageElement> {
  let p = imgCache.get(src);
  if (!p) {
    p = new Promise((res, rej) => {
      const im = new Image();
      im.crossOrigin = "anonymous";
      im.onload = () => res(im);
      im.onerror = rej;
      im.src = src;
    });
    imgCache.set(src, p);
  }
  return p;
}

/** Preload every sprite a message needs. Async — touches no canvas. */
export async function loadSprites(
  text: string,
  set: GlyphSet
): Promise<Record<string, HTMLImageElement>> {
  const need = Array.from(
    new Set(text.toUpperCase().split("").filter((ch) => set.glyphs[ch]))
  );
  const imgs: Record<string, HTMLImageElement> = {};
  await Promise.all(
    need.map(async (ch) => {
      imgs[ch] = await loadImage(`${BASE}/${set.folder}/${set.glyphs[ch].file}`);
    })
  );
  return imgs;
}

// ---- text sanitation (fold accents, strip disallowed — but DO NOT truncate) --
function foldLine(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(ALLOWED_TEXT, "")
    .toUpperCase();
}

// ---- polygon geometry ------------------------------------------------------
interface Px {
  x: number;
  y: number;
}
interface Bounds {
  minX: number;
  minY: number;
  w: number;
  h: number;
}

function toPixelPolygon(poly: Polygon, size: number): Px[] {
  return poly.map((pt) => ({ x: pt.x * size, y: pt.y * size }));
}

function polygonBounds(poly: Px[]): Bounds {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of poly) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, w: maxX - minX, h: maxY - minY };
}

/**
 * Horizontal span of the polygon at a given y (scanline). Returns the outer
 * envelope { minX, maxX, width }; width 0 if y is outside the polygon.
 */
export function getHorizontalSpanAtY(
  poly: Px[],
  y: number
): { minX: number; maxX: number; width: number } {
  const xs: number[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const y1 = a.y,
      y2 = b.y;
    if ((y1 <= y && y < y2) || (y2 <= y && y < y1)) {
      const t = (y - y1) / (y2 - y1);
      xs.push(a.x + t * (b.x - a.x));
    }
  }
  if (xs.length < 2) return { minX: 0, maxX: 0, width: 0 };
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  return { minX, maxX, width: maxX - minX };
}

/**
 * Tightest span across a vertical band [yTop..yBottom] (a whole line of text).
 * Sampling top, middle and bottom and intersecting them guarantees the entire
 * line band stays inside the polygon — this is what makes heart/oval fit.
 */
function spanForBand(poly: Px[], b: Bounds, yTop: number, yBottom: number) {
  const clampY = (y: number) => Math.min(b.minY + b.h - 0.5, Math.max(b.minY + 0.5, y));
  const yt = clampY(yTop);
  const ym = clampY((yTop + yBottom) / 2);
  const yb = clampY(yBottom);
  const a = getHorizontalSpanAtY(poly, yt);
  const m = getHorizontalSpanAtY(poly, ym);
  const c = getHorizontalSpanAtY(poly, yb);
  const minX = Math.max(a.minX, m.minX, c.minX);
  const maxX = Math.min(a.maxX, m.maxX, c.maxX);
  return { minX, maxX, width: Math.max(0, maxX - minX) };
}

// ---- layout ----------------------------------------------------------------

/** One laid-out glyph, centred at (x, y) in canvas space with size (w, h). */
export interface LayoutGlyph {
  ch: string;
  x: number;
  y: number;
  w: number;
  h: number;
  angle: number; // radians
  cap: number; // the cap height this glyph was sized at (for shadow scaling)
}

export interface LayoutResult {
  cap: number;
  glyphs: LayoutGlyph[];
  lines: string[]; // sanitized, non-empty lines actually laid out
  fits: boolean;
  warnings: string[];
  templateId: TemplateId;
}

/** Width of a line in CAP UNITS (cap = 1), including tracking, minus the trailing gap. */
function lineUnitRatio(line: string, set: GlyphSet, cfg: LetterRenderConfig): number {
  let u = 0;
  let lastWasGlyphOrSpace = false;
  for (const ch of line) {
    if (ch === " ") {
      u += cfg.wordSpacing;
      lastWasGlyphOrSpace = true;
      continue;
    }
    const g = set.glyphs[ch];
    if (!g) {
      u += 0.45; // unsupported placeholder (validated separately)
      lastWasGlyphOrSpace = true;
      continue;
    }
    u += g.aspect * g.hr + cfg.tracking;
    lastWasGlyphOrSpace = true;
  }
  if (lastWasGlyphOrSpace) u -= cfg.tracking; // no trailing gap
  return Math.max(0, u);
}

/**
 * Lay out `text` for a `template` in a given `style`. Polygon-aware, uniform
 * cap across lines (mould feel), deterministic handmade jitter. Reports
 * fits/warnings rather than dropping text.
 */
export function computeLayout(
  template: TiramisuTemplate,
  text: string,
  style: TiramisuStyle
): LayoutResult {
  const size = template.canvasSize;
  const cfg = template.letterRender[style];
  const set = SETS[style];
  const rules = template.lineRules;
  const warnings: string[] = [];
  let fits = true;

  // 1. sanitize into lines (fold accents / strip disallowed; never truncate)
  const lines = text.split("\n").map(foldLine);
  while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();

  // 2. capacity validation
  if (lines.length > rules.maxLines) {
    fits = false;
    warnings.push(`Too many lines (${lines.length}/${rules.maxLines})`);
  }
  lines.forEach((l, i) => {
    if (l.length > rules.maxCharsPerLine) {
      fits = false;
      warnings.push(`Line ${i + 1} too long (${l.length}/${rules.maxCharsPerLine})`);
    }
  });
  const totalChars = lines.reduce((n, l) => n + l.replace(/ /g, "").length, 0);
  if (totalChars > rules.maxTotalChars) {
    fits = false;
    warnings.push(`Too many characters (${totalChars}/${rules.maxTotalChars})`);
  }
  const unsupported = new Set<string>();
  for (const l of lines) for (const ch of l) if (ch !== " " && !set.glyphs[ch]) unsupported.add(ch);
  if (unsupported.size) warnings.push(`Unsupported characters: ${Array.from(unsupported).join(" ")}`);

  const laid = lines.filter((l) => l.length > 0);
  if (laid.length === 0) {
    return { cap: cfg.baseCapPx, glyphs: [], lines: [], fits: true, warnings: [], templateId: template.id };
  }

  // 3. polygon-aware sizing
  const poly = toPixelPolygon(template.writablePolygon, size);
  const bounds = polygonBounds(poly);
  const n = laid.length;
  const cyMid = bounds.minY + bounds.h / 2;
  const ratios = laid.map((l) => lineUnitRatio(l, set, cfg));

  const capByHeight = bounds.h / (n * LINEGAP);
  const estCap = Math.min(cfg.baseCapPx, cfg.maxCapPx, capByHeight);
  const estLineY = (i: number) => cyMid + (i - (n - 1) / 2) * estCap * LINEGAP;

  // Constrain by the narrowest line's available horizontal span (uniform cap →
  // consistent letter size = mould feel, while still fitting inside heart/oval).
  let capByWidth = Infinity;
  laid.forEach((_, i) => {
    const yc = estLineY(i);
    const span = spanForBand(poly, bounds, yc - estCap * 0.5, yc + estCap * 0.5);
    const usable = span.width * 0.96;
    const capW = usable / Math.max(ratios[i], 0.0001);
    if (capW < capByWidth) capByWidth = capW;
  });

  let cap = Math.min(cfg.baseCapPx, cfg.maxCapPx, capByHeight, capByWidth);
  if (cap < cfg.minCapPx) {
    // Controlled floor — do NOT shrink into ugliness; flag instead.
    cap = cfg.minCapPx;
    if (fits) {
      fits = false;
      warnings.push("Message is too long to fit this box at a good letter size");
    }
  }

  // 4. final placement at the resolved uniform cap
  const glyphs: LayoutGlyph[] = [];
  const maxRot = (cfg.maxRotationDeg * Math.PI) / 180;
  const lineY = (i: number) => cyMid + (i - (n - 1) / 2) * cap * LINEGAP;

  laid.forEach((line, i) => {
    const yc = lineY(i);
    const span = spanForBand(poly, bounds, yc - cap * 0.5, yc + cap * 0.5);
    const mid = span.width > 0 ? (span.minX + span.maxX) / 2 : bounds.minX + bounds.w / 2;
    const lineW = ratios[i] * cap;
    let x = mid - lineW / 2;
    for (let k = 0; k < line.length; k++) {
      const ch = line[k];
      if (ch === " ") {
        x += cfg.wordSpacing * cap;
        continue;
      }
      const g = set.glyphs[ch];
      if (!g) {
        x += 0.45 * cap;
        continue;
      }
      const h = g.hr * cap;
      const w = g.aspect * h;
      // deterministic handmade variation (stable across renders)
      const seed = ((ch.charCodeAt(0) * 37 + k * 101 + i * 17) % 1000) / 1000;
      const angle = (seed - 0.5) * 2 * maxRot;
      const jx = (((seed * 7) % 1) - 0.5) * 2 * cfg.maxJitterPx;
      const jy = (((seed * 13) % 1) - 0.5) * 2 * cfg.maxJitterPx;
      glyphs.push({ ch, x: x + w / 2 + jx, y: yc + jy, w, h, angle, cap });
      x += w + cfg.tracking * cap;
    }
  });

  return { cap, glyphs, lines: laid, fits, warnings, templateId: template.id };
}

// ---- 2D compositing (realism) ----------------------------------------------

/** Soft radial ellipse (used for cocoa contact / grounding), drawn at origin. */
function softBlob(
  ctx: CanvasRenderingContext2D,
  rx: number,
  ry: number,
  alpha: number,
  rgb: string
) {
  if (alpha <= 0 || rx <= 0 || ry <= 0) return;
  ctx.save();
  ctx.scale(rx, ry);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, `rgba(${rgb},${alpha})`);
  g.addColorStop(0.55, `rgba(${rgb},${alpha * 0.5})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Clip subsequent drawing to the writable polygon, scaled about its centre. */
function clipToPolygon(ctx: CanvasRenderingContext2D, poly: Px[], scale: number) {
  const b = polygonBounds(poly);
  const cx = b.minX + b.w / 2;
  const cy = b.minY + b.h / 2;
  ctx.beginPath();
  poly.forEach((pt, i) => {
    const x = cx + (pt.x - cx) * scale;
    const y = cy + (pt.y - cy) * scale;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.clip();
}

export interface PaintOptions {
  base: HTMLImageElement;
  imgs: Record<string, HTMLImageElement>;
  template: TiramisuTemplate;
  style: TiramisuStyle;
  text: string;
  /** Skip the letters (3D bakes only the bare cocoa top). */
  onlyBase?: boolean;
  /** Reuse a precomputed layout (else it is computed here). */
  layout?: LayoutResult;
}

/**
 * Paint one preview frame. FULLY SYNCHRONOUS — all sprites must be preloaded via
 * loadSprites first. Returns the layout (so callers can read fits/warnings).
 *
 * Order: base → cocoa contact/indentation under each letter → letters with a
 * shape-accurate cast shadow. Letter overlays are clipped to the writable area
 * so nothing spills onto the rim/background. The base image is never clipped.
 */
export function paintPreview(
  ctx: CanvasRenderingContext2D,
  o: PaintOptions
): LayoutResult {
  const size = o.template.canvasSize;
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(o.base, 0, 0, size, size);

  const layout = o.layout ?? computeLayout(o.template, o.text, o.style);
  if (o.onlyBase || layout.glyphs.length === 0) return layout;

  const cfg = o.template.letterRender[o.style];
  const poly = toPixelPolygon(o.template.writablePolygon, size);

  ctx.save();
  clipToPolygon(ctx, poly, 1.12); // generous: never hard-cut a letter's shadow

  // Pass 1 — cocoa contact (indentation halo + soft grounding) under all letters.
  for (const gl of layout.glyphs) {
    ctx.save();
    ctx.translate(gl.x, gl.y);
    ctx.rotate(gl.angle);
    softBlob(ctx, gl.w * 0.6, gl.h * 0.58, cfg.cocoaContactAlpha, COCOA); // indentation
    ctx.translate(0, gl.h * 0.05);
    softBlob(ctx, gl.w * 0.52, gl.h * 0.4, cfg.contactShadowAlpha, COCOA_DARK); // grounding
    ctx.restore();
  }

  // Pass 2 — the letters, each with a shape-accurate cast shadow (canvas shadow
  // uses the PNG alpha, so the shadow matches the real letter outline).
  for (const gl of layout.glyphs) {
    const sprite = o.imgs[gl.ch];
    if (!sprite) continue;
    ctx.save();
    ctx.translate(gl.x, gl.y);
    ctx.rotate(gl.angle);
    ctx.shadowColor = `rgba(28,15,7,${cfg.shadowAlpha})`;
    ctx.shadowBlur = gl.cap * cfg.shadowBlurRatio;
    ctx.shadowOffsetX = gl.cap * 0.012;
    ctx.shadowOffsetY = gl.cap * cfg.shadowOffsetYRatio;
    ctx.drawImage(sprite, -gl.w / 2, -gl.h / 2, gl.w, gl.h);
    ctx.restore();
  }

  ctx.restore();
  return layout;
}
