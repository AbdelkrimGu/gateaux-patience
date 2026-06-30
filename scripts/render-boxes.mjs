// Render consistent, on-brand top-down cocoa-tiramisu shapes from the real
// surface (base/cacao.png), so picker thumbnails AND the live customizer base
// both match exactly. Flat-lay: soft shadow, cream rim, warm background.
//
//   box-{shape}.png   800px, shape ~0.70 of frame  → picker cards
//   cust-{shape}.png  900px, shape ~0.84 of frame  → customizer canvas base
//
// Run: node scripts/render-boxes.mjs

import sharp from "sharp";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const T = join(ROOT, "public/images/tiramisu");
const SRC = join(T, "base/cacao.png");
const OUT = join(T, "boxes");
const BASE_OUT = join(T, "base");

const CX = 0.5012, CY = 0.4864; // cocoa disc centre in cacao.png

const SHAPES = {
  square: (s) => `<rect x="0" y="0" width="${s}" height="${s}" rx="${s * 0.12}" ry="${s * 0.12}"/>`,
  oval: (s) => `<ellipse cx="${s / 2}" cy="${s / 2}" rx="${s * 0.49}" ry="${s * 0.37}"/>`,
  heart: (s) =>
    `<path transform="scale(${s / 100})" d="M50,85 C50,85 11,56 11,31 C11,17 23,11 33,11 C42,11 48,17 50,23 C52,17 58,11 67,11 C77,11 89,17 89,31 C89,56 50,85 50,85 Z"/>`,
};

function svg(inner, s, fill, opacity = 1) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><g fill="${fill}" fill-opacity="${opacity}">${inner}</g></svg>`
  );
}

function bgOf(size) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><defs><radialGradient id="g" cx="50%" cy="40%" r="68%"><stop offset="0%" stop-color="#FFFDFB"/><stop offset="100%" stop-color="#F1E4D6"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`
  );
}

const meta = await sharp(SRC).metadata();
const W = meta.width, H = meta.height;
const side = Math.round(Math.min(W, H) * 0.44); // inside the cocoa, clear of the rim
const left = Math.round(CX * W - side / 2);
const top = Math.round(CY * H - side / 2);

async function cocoaTile(px) {
  return sharp(SRC).extract({ left, top, width: side, height: side }).resize(px, px).png().toBuffer();
}

async function renderSet(prefix, BG, SIZE, dir) {
  const cocoa = await cocoaTile(SIZE);
  const center = (s) => Math.round((BG - s) / 2);
  const bg = bgOf(BG);
  for (const [name, fn] of Object.entries(SHAPES)) {
    const mask = await sharp(svg(fn(SIZE), SIZE, "#fff")).blur(1.1).png().toBuffer();
    const shaped = await sharp(cocoa).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
    const rimSize = SIZE + Math.round(SIZE * 0.034);
    const rim = await sharp(svg(fn(rimSize), rimSize, "#ece0cf")).png().toBuffer();
    const shSize = SIZE + 8;
    const shadow = await sharp(svg(fn(shSize), shSize, "#3a2414", 0.3)).blur(Math.round(SIZE * 0.03)).png().toBuffer();
    await sharp(bg)
      .composite([
        { input: shadow, left: center(shSize), top: center(shSize) + Math.round(SIZE * 0.035) },
        { input: rim, left: center(rimSize), top: center(rimSize) },
        { input: shaped, left: center(SIZE), top: center(SIZE) },
      ])
      .png()
      .toFile(join(dir, `${prefix}${name}.png`));
    console.log(`${prefix}${name}.png`);
  }
}

await renderSet("box-", 800, 560, OUT); // picker thumbnails
await renderSet("cust-", 900, 760, OUT); // customizer bases
