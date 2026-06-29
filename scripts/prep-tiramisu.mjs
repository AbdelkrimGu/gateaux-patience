// Asset prep for the tiramisu customizer.
//   1. Segments each white-chocolate letter strip (glossy glyphs on black) into
//      individual transparent PNG sprites, alpha derived from luminance so the
//      gloss is kept but the AI drop-shadow is dropped (we cast our own later).
//   2. Records per-glyph typographic metrics (normalised to the strip cap-height)
//      so the runtime can lay any word out with a consistent baseline.
//   3. Detects the cocoa disc (centre + radius) on the base photo.
// Output: public/images/tiramisu/letters/*.png  +  src/lib/tiramisu-glyphs.json
//
// Run: node scripts/prep-tiramisu.mjs

import sharp from "sharp";
import { mkdirSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RAW = join(ROOT, "public/images/tiramisu/letters-raw");
const OUT = join(ROOT, "public/images/tiramisu/letters");
mkdirSync(OUT, { recursive: true });

const STRIPS = [
  { file: "ABCDEFG.png", chars: "ABCDEFG" },
  { file: "HIJKLMN.png", chars: "HIJKLMN" },
  { file: "OPQRSTU.png", chars: "OPQRSTU" },
  { file: "VWXYZ.png", chars: "VWXYZ" },
  { file: "01234.png", chars: "01234" },
  { file: "56789.png", chars: "56789" },
];

const LUMA_LO = 70; // below -> transparent (black bg + faint shadow)
const LUMA_HI = 120; // above -> opaque (letter body)
const MASK_T = 95; // segmentation threshold
const MIN_AREA = 1500;

const luma = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
const smooth = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

async function segmentStrip(file, chars) {
  const { data, info } = await sharp(join(RAW, file))
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;

  // binary mask of letter pixels
  const mask = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const o = i * C;
    if (luma(data[o], data[o + 1], data[o + 2]) > MASK_T) mask[i] = 1;
  }

  // connected components (BFS, 8-connectivity)
  const labels = new Int32Array(W * H).fill(0);
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
      area++;
      sumX += x;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const np = ny * W + nx;
          if (mask[np] && !labels[np]) {
            labels[np] = id;
            stack.push(np);
          }
        }
      }
    }
    blobs.push({ id, minX, minY, maxX, maxY, area, cx: sumX / area });
  }

  let kept = blobs.filter((b) => b.area >= MIN_AREA).sort((a, b) => a.cx - b.cx);
  if (kept.length !== chars.length) {
    console.warn(
      `  ! ${file}: found ${kept.length} blobs for "${chars}" (${chars.length}) — check the strip`
    );
  }

  // Robust cap reference = median glyph height of the strip (ignores the odd
  // descender/tail so every glyph renders at a consistent cap height, and
  // absolute size differences between separately-generated strips cancel out).
  const heights = kept.map((b) => b.maxY - b.minY + 1).sort((a, b) => a - b);
  const capRef = heights[Math.floor(heights.length / 2)];

  const out = {};
  for (let i = 0; i < kept.length && i < chars.length; i++) {
    const b = kept[i];
    const ch = chars[i];
    const pad = 6;
    const x0 = Math.max(0, b.minX - pad);
    const y0 = Math.max(0, b.minY - pad);
    const w = Math.min(W, b.maxX + pad) - x0 + 1;
    const h = Math.min(H, b.maxY + pad) - y0 + 1;

    const rgba = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const so = ((y0 + y) * W + (x0 + x)) * C;
        const lum = luma(data[so], data[so + 1], data[so + 2]);
        const a = Math.round(smooth(LUMA_LO, LUMA_HI, lum) * 255);
        const do_ = (y * w + x) * 4;
        rgba[do_] = data[so];
        rgba[do_ + 1] = data[so + 1];
        rgba[do_ + 2] = data[so + 2];
        rgba[do_ + 3] = a;
      }
    }
    const name = `${ch}.png`;
    await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
      .png()
      .toFile(join(OUT, name));

    // metrics normalised to the strip's median cap height
    const gh = b.maxY - b.minY + 1;
    const gw = b.maxX - b.minX + 1;
    out[ch] = {
      file: name,
      aspect: +(gw / gh).toFixed(4), // glyph body width / height
      hr: +(gh / capRef).toFixed(4), // height relative to cap height
    };
    console.log(`  ${ch}  ${w}x${h}`);
  }
  return out;
}

async function detectDisc() {
  const file = join(ROOT, "public/images/tiramisu/base/cacao.png");
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  let minX = W, minY = H, maxX = 0, maxY = 0, n = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * C;
      const r = data[o], g = data[o + 1], b = data[o + 2];
      // cocoa brown: warm, mid-dark, r>g>b, not bright marble, not near-black ring
      if (r > 70 && r < 205 && g > 35 && g < 150 && b < 120 && r > g + 15 && g > b) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
        n++;
      }
    }
  }
  const cx = (minX + maxX) / 2 / W;
  const cy = (minY + maxY) / 2 / H;
  const rx = (maxX - minX) / 2 / W;
  const ry = (maxY - minY) / 2 / H;
  return {
    cx: +cx.toFixed(4),
    cy: +cy.toFixed(4),
    r: +Math.min(rx, ry).toFixed(4),
    px: { minX, minY, maxX, maxY, n },
  };
}

const glyphs = {};
for (const s of STRIPS) {
  console.log(`Segmenting ${s.file} ->`);
  Object.assign(glyphs, await segmentStrip(s.file, s.chars));
}
const disc = await detectDisc();
console.log("Cocoa disc:", disc);

writeFileSync(
  join(ROOT, "src/lib/tiramisu-glyphs.json"),
  JSON.stringify({ disc: { cx: disc.cx, cy: disc.cy, r: disc.r }, glyphs }, null, 2)
);
console.log(`\nWrote ${Object.keys(glyphs).length} glyphs + manifest.`);
