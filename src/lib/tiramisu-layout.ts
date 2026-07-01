// Shared typographic layout for the tiramisu preview.
//
// This is the SINGLE SOURCE OF TRUTH for how a customer's message is laid out on
// the cocoa top: cap-height sizing, letter tracking, line gap, per-shape writable
// area and the single-mould "fixed size" rule for white-chocolate pieces.
//
// Both previews consume it, so 2D and 3D stay pixel-for-pixel in agreement and
// obey the same per-size character limits:
//   • src/components/tiramisu/TiramisuCanvas.tsx   (2D canvas — the fallback)
//   • src/components/tiramisu/three/*              (3D scene)
//
// Coordinates are expressed in the internal square canvas space [0..S]×[0..S];
// the 2D canvas draws them directly, the 3D scene maps that square onto the
// cocoa-top plane. Tuned with scripts/mock-shapes.mjs.

import manifest from "@/lib/tiramisu-glyphs.json";
import { TIRAMISU_SIZES, type TiramisuStyle } from "@/lib/tiramisu-config";

export type GlyphMap = Record<string, { file: string; aspect: number; hr: number }>;

const { disc, glyphs, cacaoGlyphs } = manifest as {
  disc: { cx: number; cy: number; r: number };
  glyphs: GlyphMap;
  cacaoGlyphs: GlyphMap;
};

export const BASE = "/images/tiramisu";
export const S = 900; // internal canvas resolution
const SAFE = 0.84; // usable fraction of the cocoa radius
export const LINEGAP = 1.42;

// Per-style glyph sets. Chocolate pieces sit proud of the surface (stronger
// shadow + a little tilt); cacao writing lies flat (soft shadow, less tilt).
export interface GlyphSet {
  glyphs: GlyphMap;
  folder: string;
  track: number; // letter spacing, in cap units
  rot: number; // max random tilt, radians
  shadowAlpha: number;
  blurK: number;
  offYK: number;
  /**
   * When set, glyphs render at one FIXED size regardless of how little text is
   * typed — the size of a fully-packed line of this many characters at the
   * smallest size. White-chocolate pieces use this because they come from a
   * single physical mould; we can't make the letters any bigger.
   */
  fixedChars?: number;
}

// Smallest size config (the minimal character size the engine ever produces).
const SMALL = TIRAMISU_SIZES.reduce((a, b) => (b.fontScale < a.fontScale ? b : a));
const avgAspectHr = (m: GlyphMap) => {
  const v = Object.values(m);
  return v.reduce((s, g) => s + g.aspect * g.hr, 0) / (v.length || 1);
};

export const SETS: Record<TiramisuStyle, GlyphSet> = {
  pieces: {
    glyphs,
    folder: "letters",
    track: 0.16,
    rot: 0.06,
    shadowAlpha: 0.5,
    blurK: 0.07,
    offYK: 0.06,
    fixedChars: SMALL.charsPerLine.pieces,
  },
  cacao: {
    glyphs: cacaoGlyphs,
    folder: "letters-cacao",
    track: 0.12,
    rot: 0.045,
    shadowAlpha: 0.24,
    blurK: 0.045,
    offYK: 0.022,
  },
};

// The cocoa surface the customer is actually buying. Each box shape has its own
// top-down base image plus the writable area (centre + half-extents, as a
// fraction of S) where text fits inside that silhouette. `round` is the default
// fallback (the original dish).
export type ShapeKey = "round" | "square" | "heart" | "oval";
export interface ShapeCfg {
  base: string;
  cx: number;
  cy: number;
  hw: number;
  hh: number;
}
export const SHAPES_CFG: Record<ShapeKey, ShapeCfg> = {
  round: { base: `${BASE}/base/cacao.png`, cx: disc.cx, cy: disc.cy, hw: disc.r * SAFE * 0.92, hh: disc.r * SAFE * 0.8 },
  square: { base: `${BASE}/boxes/cust-square.png`, cx: 0.5, cy: 0.5, hw: 0.38, hh: 0.36 },
  heart: { base: `${BASE}/boxes/cust-heart.png`, cx: 0.5, cy: 0.5, hw: 0.25, hh: 0.18 },
  oval: { base: `${BASE}/boxes/cust-oval.png`, cx: 0.5, cy: 0.5, hw: 0.33, hh: 0.235 },
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

// Preload every sprite a line of text needs. Async — does NOT touch any canvas.
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

function lineUnits(line: string, set: GlyphSet) {
  let u = 0;
  for (const ch of line) {
    if (ch === " ") {
      u += 0.55;
      continue;
    }
    const g = set.glyphs[ch];
    if (!g) {
      u += 0.45;
      continue;
    }
    u += g.aspect * g.hr + set.track;
  }
  return Math.max(0, u - set.track);
}

/** One laid-out glyph, centred at (x, y) in [0..S] space with size (w, h). */
export interface LayoutGlyph {
  ch: string;
  x: number; // centre X in [0..S]
  y: number; // centre Y in [0..S]
  w: number;
  h: number;
  angle: number; // radians, hand-placed tilt
}

export interface Layout {
  cap: number; // cap height in S-units
  glyphs: LayoutGlyph[];
}

/**
 * Lay out `text` for `set` inside writable area `cfg`. Pure geometry — no canvas,
 * no images — so 2D and 3D can both consume it. `fontScale` only matters for
 * non-fixed (cacao) sets.
 */
export function computeLayout(
  text: string,
  set: GlyphSet,
  fontScale: number,
  cfg: ShapeCfg
): Layout {
  const lines = text.toUpperCase().split("\n");

  const Wt = 2 * cfg.hw * S; // writable width
  const Ht = 2 * cfg.hh * S; // writable height
  const units = lines.map((l) => lineUnits(l, set));
  const maxU = Math.max(...units, 0.001);

  let cap: number;
  if (set.fixedChars) {
    // Fixed single-mould size: cap of a fully-packed smallest line, never scaled
    // up for short text.
    const refUnits = set.fixedChars * (avgAspectHr(set.glyphs) + set.track) - set.track;
    cap = Math.min(Wt / refUnits, Ht / (SMALL.maxLines * LINEGAP), S * 0.4 * SMALL.fontScale);
  } else {
    cap = Math.min(Wt / maxU, Ht / (lines.length * LINEGAP), S * 0.4 * fontScale);
  }

  const cx = cfg.cx * S;
  const cy = cfg.cy * S;
  const startCY = cy - ((lines.length - 1) * cap * LINEGAP) / 2;

  const out: LayoutGlyph[] = [];
  lines.forEach((line, li) => {
    let x = cx - (units[li] * cap) / 2;
    const lineCY = startCY + li * cap * LINEGAP;
    for (let k = 0; k < line.length; k++) {
      const ch = line[k];
      if (ch === " ") {
        x += 0.55 * cap;
        continue;
      }
      const g = set.glyphs[ch];
      if (!g) {
        x += 0.45 * cap;
        continue;
      }
      const h = g.hr * cap;
      const w = g.aspect * h;
      const seed = ((ch.charCodeAt(0) * 37 + k * 101) % 1000) / 1000;
      const ang = (seed - 0.5) * set.rot;
      const dy = (((seed * 13) % 1) - 0.5) * cap * 0.03;
      out.push({ ch, x: x + w / 2, y: lineCY + dy, w, h, angle: ang });
      x += w + set.track * cap;
    }
  });

  return { cap, glyphs: out };
}

/**
 * Paint one preview frame onto a 2D context. FULLY SYNCHRONOUS — no awaits — so
 * two overlapping renders can never interleave and stack glyphs on top of each
 * other. All sprites must be preloaded via loadSprites first; any missing glyph
 * is simply skipped. `onlyBase` skips the text (used by the 3D scene, which
 * bakes the cocoa base into a texture and renders letters as real geometry).
 */
export function paintPreview(
  ctx: CanvasRenderingContext2D,
  base: HTMLImageElement,
  imgs: Record<string, HTMLImageElement>,
  text: string,
  fontScale: number,
  set: GlyphSet,
  cfg: ShapeCfg,
  onlyBase = false
) {
  ctx.clearRect(0, 0, S, S);
  ctx.drawImage(base, 0, 0, S, S);
  if (onlyBase) return;

  const { cap, glyphs: laid } = computeLayout(text, set, fontScale, cfg);
  for (const gl of laid) {
    const sprite = imgs[gl.ch];
    if (!sprite) continue;
    ctx.save();
    ctx.translate(gl.x, gl.y);
    ctx.rotate(gl.angle);
    ctx.shadowColor = `rgba(28,15,7,${set.shadowAlpha})`;
    ctx.shadowBlur = cap * set.blurK;
    ctx.shadowOffsetX = cap * 0.012;
    ctx.shadowOffsetY = cap * set.offYK;
    ctx.drawImage(sprite, -gl.w / 2, -gl.h / 2, gl.w, gl.h);
    ctx.restore();
  }
}
