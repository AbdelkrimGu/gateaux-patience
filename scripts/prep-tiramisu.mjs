// Asset prep for the tiramisu customizer.
//   1. Segments each letter strip (glyphs on black) into individual transparent
//      PNG sprites, with per-glyph typographic metrics normalised to the strip
//      cap-height so the runtime lays any word out at a consistent size.
//        - chocolate set: alpha from luminance (keep gloss, drop baked shadow)
//        - cacao set: alpha from distance-from-black (KEEP the dark cocoa edges,
//          drop only the black background)
//   2. Detects the cocoa disc (centre + radius) on the base photo.
// Output: public/images/tiramisu/letters/*.png, letters-cacao/*.png
//         + src/lib/tiramisu-glyphs.json  { disc, glyphs, cacaoGlyphs }
//
// Run: node scripts/prep-tiramisu.mjs

import sharp from "sharp";
import { mkdirSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const T = join(ROOT, "public/images/tiramisu");

const STRIPS = [
  { file: "ABCDEFG.png", chars: "ABCDEFG" },
  { file: "HIJKLMN.png", chars: "HIJKLMN" },
  { file: "OPQRSTU.png", chars: "OPQRSTU" },
  { file: "VWXYZ.png", chars: "VWXYZ" },
  { file: "01234.png", chars: "01234" },
  { file: "56789.png", chars: "56789" },
];

const MIN_AREA = 1500;
const luma = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
const smooth = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

// Per-set pixel rules.
const SETS = {
  chocolate: {
    rawDir: "letters-raw",
    outDir: "letters",
    // glossy cream on black: detect & alpha by luminance
    ink: (r, g, b) => luma(r, g, b) > 95,
    alpha: (r, g, b) => Math.round(smooth(70, 120, luma(r, g, b)) * 255),
  },
  cacao: {
    rawDir: "letters-cacao-raw",
    outDir: "letters-cacao",
    // flat white cream with dark cocoa edges on black: detect & alpha by how
    // far the pixel is from pure black (max channel), so cocoa edges survive
    ink: (r, g, b) => Math.max(r, g, b) > 34,
    alpha: (r, g, b) => Math.round(smooth(20, 60, Math.max(r, g, b)) * 255),
  },
};

async function segmentStrip(set, file, chars) {
  const { data, info } = await sharp(join(T, set.rawDir, file))
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;

  const mask = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const o = i * C;
    if (set.ink(data[o], data[o + 1], data[o + 2])) mask[i] = 1;
  }

  const labels = new Int32Array(W * H);
  const blobs = [];
  const stack = [];
  for (let s = 0; s < W * H; s++) {
    if (!mask[s] || labels[s]) continue;
    const id = blobs.length + 1;
    let minX = W, minY = H, maxX = 0, maxY = 0, area = 0, sumX = 0;
    stack.push(s);
    labels[s] = id;
    while (stack.length) {
      const p = stack.pop();
      const x = p % W;
      const y = (p - x) / W;
      area++; sumX += x;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const np = ny * W + nx;
          if (mask[np] && !labels[np]) { labels[np] = id; stack.push(np); }
        }
    }
    blobs.push({ minX, minY, maxX, maxY, area, cx: sumX / area });
  }

  const kept = blobs.filter((b) => b.area >= MIN_AREA).sort((a, b) => a.cx - b.cx);
  if (kept.length !== chars.length)
    console.warn(`  ! ${file}: found ${kept.length} blobs for "${chars}" (${chars.length})`);

  const heights = kept.map((b) => b.maxY - b.minY + 1).sort((a, b) => a - b);
  const capRef = heights[Math.floor(heights.length / 2)];

  const out = {};
  mkdirSync(join(T, set.outDir), { recursive: true });
  for (let i = 0; i < kept.length && i < chars.length; i++) {
    const b = kept[i];
    const ch = chars[i];
    const pad = 4;
    const x0 = Math.max(0, b.minX - pad);
    const y0 = Math.max(0, b.minY - pad);
    const w = Math.min(W, b.maxX + pad) - x0 + 1;
    const h = Math.min(H, b.maxY + pad) - y0 + 1;

    const rgba = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const so = ((y0 + y) * W + (x0 + x)) * C;
        const do_ = (y * w + x) * 4;
        rgba[do_] = data[so];
        rgba[do_ + 1] = data[so + 1];
        rgba[do_ + 2] = data[so + 2];
        rgba[do_ + 3] = set.alpha(data[so], data[so + 1], data[so + 2]);
      }
    await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
      .png()
      .toFile(join(T, set.outDir, `${ch}.png`));

    const gh = b.maxY - b.minY + 1;
    const gw = b.maxX - b.minX + 1;
    out[ch] = { file: `${ch}.png`, aspect: +(gw / gh).toFixed(4), hr: +(gh / capRef).toFixed(4) };
  }
  return out;
}

async function detectDisc() {
  const { data, info } = await sharp(join(T, "base", "cacao.png")).raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const rowDark = new Int32Array(H);
  const colDark = new Int32Array(W);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * C;
      if (luma(data[o], data[o + 1], data[o + 2]) < 70) { rowDark[y]++; colDark[x]++; }
    }
  const span = (arr, len) => {
    const thr = Math.max(8, len * 0.02);
    let lo = 0, hi = len - 1;
    while (lo < len && arr[lo] < thr) lo++;
    while (hi > 0 && arr[hi] < thr) hi--;
    return [lo, hi];
  };
  const [minX, maxX] = span(colDark, W);
  const [minY, maxY] = span(rowDark, H);
  return {
    cx: +((minX + maxX) / 2 / W).toFixed(4),
    cy: +((minY + maxY) / 2 / H).toFixed(4),
    r: +((Math.min(maxX - minX, maxY - minY) / 2 / W) * 0.9).toFixed(4),
  };
}

const glyphs = {};
const cacaoGlyphs = {};
for (const s of STRIPS) {
  console.log(`chocolate ${s.file}`);
  Object.assign(glyphs, await segmentStrip(SETS.chocolate, s.file, s.chars));
}
for (const s of STRIPS) {
  console.log(`cacao ${s.file}`);
  Object.assign(cacaoGlyphs, await segmentStrip(SETS.cacao, s.file, s.chars));
}
const disc = await detectDisc();
console.log("disc", disc);

writeFileSync(
  join(ROOT, "src/lib/tiramisu-glyphs.json"),
  JSON.stringify({ disc, glyphs, cacaoGlyphs }, null, 2)
);
console.log(`Wrote ${Object.keys(glyphs).length} chocolate + ${Object.keys(cacaoGlyphs).length} cacao glyphs.`);
