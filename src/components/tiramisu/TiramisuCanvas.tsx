"use client";

import { useEffect, useRef, useState } from "react";
import manifest from "@/lib/tiramisu-glyphs.json";
import type { TiramisuStyle, TiramisuSize } from "@/lib/tiramisu-config";

type GlyphMap = Record<string, { file: string; aspect: number; hr: number }>;
const { disc, glyphs, cacaoGlyphs } = manifest as {
  disc: { cx: number; cy: number; r: number };
  glyphs: GlyphMap;
  cacaoGlyphs: GlyphMap;
};

const BASE = "/images/tiramisu";
const S = 900; // internal canvas resolution
const SAFE = 0.84; // usable fraction of the cocoa radius
const LINEGAP = 1.42;

// Per-style glyph sets. Chocolate pieces sit proud of the surface (stronger
// shadow + a little tilt); cacao writing lies flat (soft shadow, less tilt).
interface GlyphSet {
  glyphs: GlyphMap;
  folder: string;
  track: number; // letter spacing, in cap units
  rot: number; // max random tilt, radians
  shadowAlpha: number;
  blurK: number;
  offYK: number;
}
const SETS: Record<TiramisuStyle, GlyphSet> = {
  pieces: { glyphs, folder: "letters", track: 0.16, rot: 0.06, shadowAlpha: 0.5, blurK: 0.07, offYK: 0.06 },
  cacao: { glyphs: cacaoGlyphs, folder: "letters-cacao", track: 0.12, rot: 0.045, shadowAlpha: 0.24, blurK: 0.045, offYK: 0.022 },
};

const imgCache = new Map<string, Promise<HTMLImageElement>>();
function loadImage(src: string): Promise<HTMLImageElement> {
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

function lineUnits(line: string, set: GlyphSet) {
  let u = 0;
  for (const ch of line) {
    if (ch === " ") { u += 0.55; continue; }
    const g = set.glyphs[ch];
    if (!g) { u += 0.45; continue; }
    u += g.aspect * g.hr + set.track;
  }
  return Math.max(0, u - set.track);
}

async function drawGlyphs(
  ctx: CanvasRenderingContext2D,
  cacao: HTMLImageElement,
  text: string,
  fontScale: number,
  set: GlyphSet
) {
  ctx.clearRect(0, 0, S, S);
  ctx.drawImage(cacao, 0, 0, S, S);

  const lines = text.toUpperCase().split("\n");
  const need = Array.from(
    new Set(lines.join("").split("").filter((ch) => set.glyphs[ch]))
  );
  const imgs: Record<string, HTMLImageElement> = {};
  await Promise.all(
    need.map(async (ch) => {
      imgs[ch] = await loadImage(`${BASE}/${set.folder}/${set.glyphs[ch].file}`);
    })
  );

  const safe = disc.r * S * SAFE;
  const D = 2 * safe;
  const units = lines.map((l) => lineUnits(l, set));
  const maxU = Math.max(...units, 0.001);
  const cap = Math.min(
    (D * 0.92) / maxU,
    (D * 0.8) / (lines.length * LINEGAP),
    S * 0.4 * fontScale
  );

  const cx = disc.cx * S;
  const cy = disc.cy * S;
  const startCY = cy - ((lines.length - 1) * cap * LINEGAP) / 2;

  lines.forEach((line, li) => {
    let x = cx - (units[li] * cap) / 2;
    const lineCY = startCY + li * cap * LINEGAP;
    for (let k = 0; k < line.length; k++) {
      const ch = line[k];
      if (ch === " ") { x += 0.55 * cap; continue; }
      const g = set.glyphs[ch];
      if (!g) { x += 0.45 * cap; continue; }
      const h = g.hr * cap;
      const w = g.aspect * h;
      const seed = ((ch.charCodeAt(0) * 37 + k * 101) % 1000) / 1000;
      const ang = (seed - 0.5) * set.rot;
      const dy = (((seed * 13) % 1) - 0.5) * cap * 0.03;

      ctx.save();
      ctx.translate(x + w / 2, lineCY + dy);
      ctx.rotate(ang);
      ctx.shadowColor = `rgba(28,15,7,${set.shadowAlpha})`;
      ctx.shadowBlur = cap * set.blurK;
      ctx.shadowOffsetX = cap * 0.012;
      ctx.shadowOffsetY = cap * set.offYK;
      ctx.drawImage(imgs[ch], -w / 2, -h / 2, w, h);
      ctx.restore();

      x += w + set.track * cap;
    }
  });
}

interface Props {
  style: TiramisuStyle;
  size: TiramisuSize;
  text: string;
}

export default function TiramisuCanvas({ style, size, text }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const token = useRef(0);

  useEffect(() => {
    loadImage(`${BASE}/base/cacao.png`).then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    const id = ++token.current;
    (async () => {
      const cacao = await loadImage(`${BASE}/base/cacao.png`);
      const canvas = canvasRef.current;
      if (!canvas || id !== token.current) return;
      const ctx = canvas.getContext("2d")!;
      await drawGlyphs(ctx, cacao, text, size.fontScale, SETS[style]);
    })();
  }, [ready, style, size, text]);

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-[2rem] shadow-[0_24px_70px_rgba(40,20,8,0.4)] ring-1 ring-black/5">
      {!ready && <div className="absolute inset-0 shimmer" />}
      <canvas
        ref={canvasRef}
        width={S}
        height={S}
        className={`h-full w-full transition-opacity duration-500 ${
          ready ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
