// One-off asset prep for the /contact QR page logo.
// Crops public/Logo/Logo-Photoroom.png to the artwork, keys out the dark
// textured backdrop (low brightness + low saturation → transparent) so the
// logo floats on the page background, then writes small AVIF/WebP files.
//   node scripts/prep-contact-logo.mjs
import sharp from "sharp";

const SRC = "public/Logo/Logo-Photoroom.png";
const CROP = { left: 40, top: 175, width: 944, height: 660 };
const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

const { data, info } = await sharp(SRC)
  .extract(CROP)
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width: W, height: H } = info;
const out = Buffer.alloc(W * H * 4);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = y * W + x;
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
    const max = Math.max(r, g, b);
    const sat = max - Math.min(r, g, b);
    let a = Math.max(clamp((max - 62) / 48), clamp((sat - 18) / 34));
    // Soft frame so no stray texture specks survive at the crop edges.
    const ex = Math.min(x, W - 1 - x) / (W * 0.04);
    const ey = Math.min(y, H - 1 - y) / (H * 0.06);
    a *= clamp(Math.min(ex, ey));
    // Snap near-invisible / near-opaque alpha: removes texture noise that
    // would otherwise bloat the files without being visible.
    if (a < 0.12) a = 0;
    else if (a > 0.92) a = 1;
    out[i * 4] = r;
    out[i * 4 + 1] = g;
    out[i * 4 + 2] = b;
    out[i * 4 + 3] = Math.round(a * 255);
  }
}

const keyed = sharp(out, { raw: { width: W, height: H, channels: 4 } });
for (const w of [360, 720]) {
  const r = keyed.clone().resize(w);
  await r.clone().webp({ quality: 74, alphaQuality: 85, effort: 6 }).toFile(`public/contact/logo-${w}.webp`);
  await r.clone().avif({ quality: 50, effort: 7 }).toFile(`public/contact/logo-${w}.avif`);
}
if (process.argv[2]) {
  await sharp({ create: { width: W, height: H, channels: 3, background: "#1d1a1b" } })
    .composite([{ input: await keyed.clone().png().toBuffer() }])
    .png()
    .toFile(process.argv[2]);
}
console.log("contact logo assets written");
