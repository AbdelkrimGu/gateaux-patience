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
  let lastWasGlyph = false; // only a trailing GLYPH leaves a removable gap
  for (const ch of line) {
    if (ch === " ") {
      u += cfg.wordSpacing;
      lastWasGlyph = false;
      continue;
    }
    const g = set.glyphs[ch];
    if (!g) {
      u += 0.45; // unsupported placeholder (validated separately)
      lastWasGlyph = false;
      continue;
    }
    u += g.aspect * g.hr + cfg.tracking;
    lastWasGlyph = true;
  }
  if (lastWasGlyph) u -= cfg.tracking; // no trailing tracking after the last glyph
  return Math.max(0, u);
}

/**
 * The y (px) to centre text on: the middle of the writable BELT — the widest
 * band of the polygon. For a rectangle every row is equally wide, so this is
 * the bbox mid; for heart/oval it is the visual sweet spot (avoids the point/
 * taper), which stops tapered shapes from pushing lines into their narrow ends.
 */
function beltCenterY(poly: Px[], b: Bounds): number {
  const N = 48;
  const ys: number[] = [];
  const ws: number[] = [];
  let best = 0;
  for (let k = 0; k <= N; k++) {
    const y = b.minY + (k / N) * b.h;
    const w = getHorizontalSpanAtY(poly, y).width;
    ys.push(y);
    ws.push(w);
    if (w > best) best = w;
  }
  // Average the y of all near-widest rows → belt centre (bbox mid for rects).
  let sum = 0;
  let cnt = 0;
  for (let k = 0; k < ws.length; k++) {
    if (ws[k] >= best * 0.985) {
      sum += ys[k];
      cnt++;
    }
  }
  return cnt ? sum / cnt : b.minY + b.h / 2;
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

  // 1. sanitize — fold accents / strip disallowed (never truncate); trim ends
  //    and drop blank/whitespace-only lines so validation and layout agree.
  const laid = text
    .split("\n")
    .map((l) => foldLine(l).trim())
    .filter((l) => l.length > 0);

  // 2. capacity validation (reported via warnings; text is never dropped)
  if (laid.length > rules.maxLines) {
    fits = false;
    warnings.push(`Too many lines (${laid.length}/${rules.maxLines})`);
  }
  laid.forEach((l, i) => {
    if (l.length > rules.maxCharsPerLine) {
      fits = false;
      warnings.push(`Line ${i + 1} too long (${l.length}/${rules.maxCharsPerLine})`);
    }
  });
  const totalChars = laid.reduce((sum, l) => sum + l.replace(/ /g, "").length, 0);
  if (totalChars > rules.maxTotalChars) {
    fits = false;
    warnings.push(`Too many characters (${totalChars}/${rules.maxTotalChars})`);
  }
  const unsupported = new Set<string>();
  for (const l of laid) for (const ch of l) if (ch !== " " && !set.glyphs[ch]) unsupported.add(ch);
  if (unsupported.size) warnings.push(`Unsupported characters: ${Array.from(unsupported).join(" ")}`);

  if (laid.length === 0) {
    return { cap: cfg.baseCapPx, glyphs: [], lines: [], fits: true, warnings: [], templateId: template.id };
  }

  // 3. polygon-aware sizing — one uniform cap (mould feel), centred on the
  //    writable BELT, solved iteratively so tapered shapes don't spuriously
  //    fail or under-size (the line Y positions depend on the cap we're solving
  //    for, so we converge instead of estimating once at the largest cap).
  const poly = toPixelPolygon(template.writablePolygon, size);
  const bounds = polygonBounds(poly);
  const n = laid.length;
  const centerY = beltCenterY(poly, bounds);
  const ratios = laid.map((l) => lineUnitRatio(l, set, cfg));
  const capByHeight = bounds.h / (n * LINEGAP);
  const capCeil = Math.min(cfg.baseCapPx, cfg.maxCapPx, capByHeight);

  let cap = capCeil;
  for (let iter = 0; iter < 4; iter++) {
    let capByWidth = Infinity;
    for (let i = 0; i < n; i++) {
      const yc = centerY + (i - (n - 1) / 2) * cap * LINEGAP;
      const span = spanForBand(poly, bounds, yc - cap * 0.5, yc + cap * 0.5);
      const capW = (span.width * 0.96) / Math.max(ratios[i], 0.0001);
      if (capW < capByWidth) capByWidth = capW;
    }
    const next = Math.min(capCeil, capByWidth);
    if (Math.abs(next - cap) < 0.5) {
      cap = next;
      break;
    }
    cap = next;
  }
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
  const lineY = (i: number) => centerY + (i - (n - 1) / 2) * cap * LINEGAP;

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

// Distance to fling the source sprite so ONLY its blurred shadow lands on the
// cocoa. It must be well outside the canvas (and the clip) — the shadow is what
// we keep. Bigger than any canvasSize.
const SHADOW_FLING = 4000;

/**
 * Stamp a SHAPE-ACCURATE soft darkening under a glyph, derived from the letter's
 * own alpha (so enclosed counters — the holes in A/B/D/O/P/Q/R — stay clean).
 * Draws the sprite far off-canvas and reads back only its blurred canvas shadow.
 * Must be called inside the writable-polygon clip so the flung sprite is culled.
 * Assumes the caller has already translated/rotated to the glyph's local frame.
 */
function contactStamp(
  ctx: CanvasRenderingContext2D,
  sprite: HTMLImageElement,
  w: number,
  h: number,
  blur: number,
  offX: number,
  offY: number,
  alpha: number,
  rgb: string
) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.shadowColor = `rgba(${rgb},${alpha})`;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = SHADOW_FLING + offX;
  ctx.shadowOffsetY = SHADOW_FLING + offY;
  ctx.drawImage(sprite, -w / 2 - SHADOW_FLING, -h / 2 - SHADOW_FLING, w, h);
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

  // Pass 1 — cocoa contact, SHAPE-ACCURATE (from the glyph alpha, so counters
  // stay clean). Two soft stamps that hug the strokes: a wide faint cocoa
  // indentation halo, then a tighter darker grounding just under the letter.
  // Skipped entirely when both contact alphas are 0 (shadows turned off).
  if (cfg.cocoaContactAlpha > 0 || cfg.contactShadowAlpha > 0) {
    for (const gl of layout.glyphs) {
      const sprite = o.imgs[gl.ch];
      if (!sprite) continue;
      ctx.save();
      ctx.translate(gl.x, gl.y);
      ctx.rotate(gl.angle);
      contactStamp(ctx, sprite, gl.w, gl.h, gl.cap * 0.18, 0, gl.cap * 0.006, cfg.cocoaContactAlpha, COCOA);
      contactStamp(
        ctx,
        sprite,
        gl.w,
        gl.h,
        gl.cap * cfg.contactShadowBlurRatio,
        0,
        gl.cap * 0.02,
        cfg.contactShadowAlpha,
        COCOA_DARK
      );
      ctx.restore();
    }
  }

  // Pass 2 — the letters. A directional, shape-accurate cast shadow (canvas
  // shadow uses the PNG alpha) is applied ONLY when shadowAlpha > 0; with it off
  // the letter draws with no added shadow (its own baked 3D shading remains).
  const castShadow = cfg.shadowAlpha > 0;
  for (const gl of layout.glyphs) {
    const sprite = o.imgs[gl.ch];
    if (!sprite) continue;
    ctx.save();
    ctx.translate(gl.x, gl.y);
    ctx.rotate(gl.angle);
    if (castShadow) {
      ctx.shadowColor = `rgba(28,15,7,${cfg.shadowAlpha})`;
      ctx.shadowBlur = gl.cap * cfg.shadowBlurRatio;
      ctx.shadowOffsetX = gl.cap * 0.012;
      ctx.shadowOffsetY = gl.cap * cfg.shadowOffsetYRatio;
    }
    ctx.drawImage(sprite, -gl.w / 2, -gl.h / 2, gl.w, gl.h);
    ctx.restore();
  }

  ctx.restore();
  return layout;
}
