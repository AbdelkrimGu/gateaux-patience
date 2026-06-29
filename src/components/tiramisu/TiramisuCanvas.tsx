"use client";

import { useEffect, useRef, useState } from "react";
import manifest from "@/lib/tiramisu-glyphs.json";
import type { TiramisuStyle, TiramisuSize } from "@/lib/tiramisu-config";

const { disc, glyphs } = manifest as {
  disc: { cx: number; cy: number; r: number };
  glyphs: Record<string, { file: string; aspect: number; hr: number }>;
};

const BASE = "/images/tiramisu";
const S = 900; // internal canvas resolution
const SAFE = 0.84; // usable fraction of the cocoa radius
const TRACK = 0.16; // letter spacing, in cap units
const LINEGAP = 1.42;
const ROUGH = 0.55; // how irregularly the cocoa overloads the written edges

// ---- shared asset cache ----
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

let noiseCache: ImageData | null = null;
function getNoise(): ImageData {
  if (noiseCache) return noiseCache;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const x = c.getContext("2d")!;
  // two octaves of value noise, upscaled smoothly => isotropic cocoa grain
  for (const [res, alpha] of [
    [Math.ceil(S / 4), 1],
    [Math.ceil(S / 13), 0.6],
  ] as const) {
    const small = document.createElement("canvas");
    small.width = small.height = res;
    const sx = small.getContext("2d")!;
    const id = sx.createImageData(res, res);
    for (let i = 0; i < res * res; i++) {
      const v = Math.random() * 255;
      id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v;
      id.data[i * 4 + 3] = 255;
    }
    sx.putImageData(id, 0, 0);
    x.globalAlpha = alpha;
    x.imageSmoothingEnabled = true;
    x.drawImage(small, 0, 0, res, res, 0, 0, S, S);
  }
  x.globalAlpha = 1;
  noiseCache = x.getImageData(0, 0, S, S);
  return noiseCache;
}

function oc(readFreq = false) {
  const c = document.createElement("canvas");
  c.width = c.height = S;
  return {
    c,
    x: c.getContext("2d", readFreq ? { willReadFrequently: true } : undefined)!,
  };
}

const smooth = (e0: number, e1: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

function lineUnits(line: string) {
  let u = 0;
  for (const ch of line) {
    if (ch === " ") { u += 0.55; continue; }
    const g = glyphs[ch];
    if (!g) { u += 0.45; continue; }
    u += g.aspect * g.hr + TRACK;
  }
  return Math.max(0, u - TRACK);
}

// ---- white-chocolate pieces ----
async function drawPieces(
  ctx: CanvasRenderingContext2D,
  cacao: HTMLImageElement,
  text: string,
  fontScale: number
) {
  ctx.clearRect(0, 0, S, S);
  ctx.drawImage(cacao, 0, 0, S, S);

  const lines = text.split("\n").map((l) => l.toUpperCase());
  const need = Array.from(
    new Set(lines.join("").split("").filter((ch) => glyphs[ch]))
  );
  const imgs: Record<string, HTMLImageElement> = {};
  await Promise.all(
    need.map(async (ch) => {
      imgs[ch] = await loadImage(`${BASE}/letters/${glyphs[ch].file}`);
    })
  );

  const safe = disc.r * S * SAFE;
  const D = 2 * safe;
  const units = lines.map(lineUnits);
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
      const g = glyphs[ch];
      if (!g) { x += 0.45 * cap; continue; }
      const h = g.hr * cap;
      const w = g.aspect * h;
      const seed = ((ch.charCodeAt(0) * 37 + k * 101) % 1000) / 1000;
      const ang = (seed - 0.5) * 0.06; // ±~1.7°
      const dy = (((seed * 13) % 1) - 0.5) * cap * 0.03;

      ctx.save();
      ctx.translate(x + w / 2, lineCY + dy);
      ctx.rotate(ang);
      ctx.shadowColor = "rgba(28,15,7,0.5)";
      ctx.shadowBlur = cap * 0.07;
      ctx.shadowOffsetX = cap * 0.015;
      ctx.shadowOffsetY = cap * 0.06;
      ctx.drawImage(imgs[ch], -w / 2, -h / 2, w, h);
      ctx.restore();

      x += w + TRACK * cap;
    }
  });
}

// ---- cacao writing (cream revealed through a feathered, over-dusted mask) ----
function drawWriting(
  ctx: CanvasRenderingContext2D,
  cacao: HTMLImageElement,
  cream: HTMLImageElement,
  text: string,
  family: string,
  fontScale: number
) {
  ctx.clearRect(0, 0, S, S);
  ctx.drawImage(cacao, 0, 0, S, S);

  const lines = text.split("\n");
  const cx = disc.cx * S;
  const cy = disc.cy * S;
  const safe = disc.r * S * SAFE;

  // fit the font to the disc
  const probe = 100;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `800 ${probe}px ${family}`;
  let maxW = 1;
  for (const ln of lines) maxW = Math.max(maxW, ctx.measureText(ln || " ").width);
  const fs = Math.max(
    24,
    Math.min(
      (2 * safe * 0.92) / (maxW / probe),
      (2 * safe * 0.82) / (lines.length * 1.12),
      S * 0.42 * fontScale
    )
  );

  // text mask
  const { c: mc, x: m } = oc();
  m.textAlign = "center";
  m.textBaseline = "middle";
  m.font = `800 ${fs}px ${family}`;
  m.fillStyle = "#fff";
  const lh = fs * 1.12;
  const startY = cy - ((lines.length - 1) * lh) / 2;
  lines.forEach((ln, i) => ln && m.fillText(ln, cx, startY + i * lh));

  // soft edge band
  const { c: bc, x: b } = oc(true);
  b.filter = `blur(${Math.max(1.5, fs * 0.05)}px)`;
  b.drawImage(mc, 0, 0);
  b.filter = "none";

  // cream source
  const { x: c } = oc(true);
  c.drawImage(cream, 0, 0, S, S);

  const noise = getNoise().data;
  const x0 = Math.max(0, Math.floor(cx - safe - 10));
  const y0 = Math.max(0, Math.floor(cy - safe - 10));
  const x1 = Math.min(S, Math.ceil(cx + safe + 10));
  const y1 = Math.min(S, Math.ceil(cy + safe + 10));
  const bw = x1 - x0;
  const bh = y1 - y0;
  if (bw <= 0 || bh <= 0) return;

  const out = ctx.getImageData(x0, y0, bw, bh); // currently the cocoa
  const edge = b.getImageData(x0, y0, bw, bh);
  const creamD = c.getImageData(x0, y0, bw, bh);

  for (let py = 0; py < bh; py++) {
    for (let px = 0; px < bw; px++) {
      const i = (py * bw + px) * 4;
      const e = edge.data[i + 3] / 255;
      if (e <= 0.004) continue;
      const nf = noise[((y0 + py) * S + (x0 + px)) * 4] / 255;
      const cutoff = 0.5 + (nf - 0.5) * ROUGH;
      const a = smooth(cutoff - 0.07, cutoff + 0.07, e);
      if (a <= 0) continue;
      const rim = a * (1 - a) * 4; // peaks at the edge -> cocoa piled on the rim
      const dust = nf * 0.22;
      const shade = 1 - rim * 0.45;
      const cr = creamD.data[i] * (1 - dust);
      const cg = creamD.data[i + 1] * (1 - dust * 1.15);
      const cb = creamD.data[i + 2] * (1 - dust * 1.35);
      out.data[i] = (out.data[i] * (1 - a) + cr * a) * shade;
      out.data[i + 1] = (out.data[i + 1] * (1 - a) + cg * a) * shade;
      out.data[i + 2] = (out.data[i + 2] * (1 - a) + cb * a) * shade;
    }
  }
  ctx.putImageData(out, x0, y0);
}

interface Props {
  style: TiramisuStyle;
  size: TiramisuSize;
  text: string;
  writingFont: string;
}

export default function TiramisuCanvas({ style, size, text, writingFont }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const token = useRef(0);

  useEffect(() => {
    Promise.all([
      loadImage(`${BASE}/base/cacao.png`),
      loadImage(`${BASE}/base/cream.png`),
    ]).then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    const id = ++token.current;
    (async () => {
      const [cacao, cream] = await Promise.all([
        loadImage(`${BASE}/base/cacao.png`),
        loadImage(`${BASE}/base/cream.png`),
      ]);
      if (style === "pieces") {
        const canvas = canvasRef.current;
        if (!canvas || id !== token.current) return;
        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
        await drawPieces(ctx, cacao, text, size.fontScale);
      } else {
        // a next/font used only in canvas isn't fetched by the DOM, so load it
        try {
          await document.fonts.load(`800 120px ${writingFont.split(",")[0].trim()}`);
        } catch {
          /* fall back to default font */
        }
        const canvas = canvasRef.current;
        if (!canvas || id !== token.current) return;
        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
        drawWriting(ctx, cacao, cream, text, writingFont, size.fontScale);
      }
    })();
  }, [ready, style, size, text, writingFont]);

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
