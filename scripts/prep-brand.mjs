// Builds the small brand assets used by the public header/footer from the
// 2 MB master logo (public/Logo/Logo.png): a square crop of the crowned cake
// (the phoenix wing beside it is painted out) for the round header badge.
// Run once after the logo changes: `node scripts/prep-brand.mjs`.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SRC = "public/Logo/Logo.png";
const OUT = "public/brand";

// Crop box around the crowned cake in the 1024px master.
const CROP = { left: 162, top: 196, width: 410, height: 410 };

// Paint the phoenix wing (to the right of the cake) with the logo's ground
// colour, softened so the edge disappears into the texture.
const wingMask = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
  <defs>
    <filter id="b"><feGaussianBlur stdDeviation="6"/></filter>
    <linearGradient id="g" x1="0" y1="180" x2="0" y2="560" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="rgb(45,50,52)"/>
      <stop offset="1" stop-color="rgb(24,26,27)"/>
    </linearGradient>
  </defs>
  <polygon filter="url(#b)" fill="url(#g)"
    points="496,170 660,170 660,680 560,680 560,566 538,548 536,392 502,384 494,300"/>
</svg>`);

// Soft vignette toward the logo's ink ground so the round badge reads as one
// object and any texture seam at the rim disappears.
const vignette = (size) =>
  Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <defs><radialGradient id="v" cx="50%" cy="50%" r="50%">
    <stop offset="0.66" stop-color="rgb(22,18,19)" stop-opacity="0"/>
    <stop offset="1" stop-color="rgb(22,18,19)" stop-opacity="0.9"/>
  </radialGradient></defs>
  <rect width="100%" height="100%" fill="url(#v)"/>
</svg>`);

await mkdir(OUT, { recursive: true });

// sharp runs extract() before composite() in one pipeline, so do it in two.
const painted = await sharp(SRC)
  .composite([{ input: wingMask, top: 0, left: 0 }])
  .png()
  .toBuffer();
const cropped = await sharp(painted).extract(CROP).png().toBuffer();
const cleaned = await sharp(cropped)
  .composite([{ input: vignette(CROP.width), top: 0, left: 0 }])
  .png()
  .toBuffer();

for (const size of [96, 192, 384]) {
  const base = sharp(cleaned).resize(size, size, { kernel: "lanczos3" });
  await base.clone().webp({ quality: 82 }).toFile(`${OUT}/badge-${size}.webp`);
  await base.clone().avif({ quality: 55 }).toFile(`${OUT}/badge-${size}.avif`);
}

// ---------------------------------------------------------------------------
// Script wordmark "Gateaux Patience", keyed off its dark ground by luminance.
//  - wordmark-color.webp: original crimson/gold letters with alpha (for ink)
//  - wordmark-mask.webp:  white + alpha, used as a CSS mask so the wordmark
//    can take any token colour (see components/gp/BrandWordmark.tsx)
const WM = { left: 100, top: 560, width: 860, height: 240 };
const { data, info } = await sharp(SRC)
  .extract(WM)
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const T0 = 58; // background texture stays under this luminance
const T1 = 118; // letters are fully opaque above this
const color = Buffer.alloc(info.width * info.height * 4);
const mask = Buffer.alloc(info.width * info.height * 4);
for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    const i = (y * info.width + x) * 3;
    const o = (y * info.width + x) * 4;
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    const lum = Math.max(r, g, b);
    let a = Math.min(1, Math.max(0, (lum - T0) / (T1 - T0)));
    // The cake plate of the logo sits just above "Gateaux": cut it out.
    const sx = x + WM.left;
    const sy = y + WM.top;
    if (sy < 606 && sx > 176 && sx < 556) a = 0;
    // Fade the phoenix tail where the crop cuts it at the top.
    if (y < 14) a *= y / 14;
    const alpha = Math.round(a * 255);
    color[o] = r; color[o + 1] = g; color[o + 2] = b; color[o + 3] = alpha;
    mask[o] = 255; mask[o + 1] = 255; mask[o + 2] = 255; mask[o + 3] = alpha;
  }
}
const raw = { raw: { width: info.width, height: info.height, channels: 4 } };
await sharp(color, raw).trim({ threshold: 0 }).webp({ quality: 88, alphaQuality: 90 }).toFile(`${OUT}/wordmark-color.webp`);
const meta = await sharp(mask, raw).trim({ threshold: 0 }).webp({ quality: 90, alphaQuality: 95 }).toFile(`${OUT}/wordmark-mask.webp`);
console.log("wordmark", meta.width, "x", meta.height);

console.log("brand assets written to", OUT);
