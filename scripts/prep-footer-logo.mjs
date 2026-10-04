// Footer logo: crop public/Logo/Logo.png to its artwork and turn its dark
// textured ground into transparency (luma ramp), so it melts into the
// paillette footer instead of showing a lighter square. Output: a small
// WebP with alpha at public/Logo/logo-footer.webp.
//
//   node scripts/prep-footer-logo.mjs

import sharp from "sharp";

const SRC = "public/Logo/Logo.png";
const OUT = "public/Logo/logo-footer.webp";
const CROP = { left: 96, top: 200, width: 860, height: 600 }; // artwork bounds (1024² source)
const LO = 0.21; // luma at/below -> fully transparent
const HI = 0.36; // luma at/above -> fully opaque

const { data, info } = await sharp(SRC).extract(CROP).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const out = Buffer.alloc(info.width * info.height * 4);
for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
  const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
  const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  // saturation helps keep dark raspberry drips opaque
  const sat = (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
  const t = Math.min(1, Math.max(0, (Math.max(luma, sat * 0.9) - LO) / (HI - LO)));
  const a = t * t * (3 - 2 * t);
  out[j] = r; out[j + 1] = g; out[j + 2] = b; out[j + 3] = Math.round(a * 255);
}
await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
  .resize({ width: 560 })
  .webp({ quality: 78, alphaQuality: 85 })
  .toFile(OUT);
const meta = await sharp(OUT).metadata();
console.log(`wrote ${OUT} ${meta.width}x${meta.height}`);
