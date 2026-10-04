// Subset Dela Gothic One (OFL) to Latin for FR/EN display text.
//
// Why not next/font/google: Google serves Dela as ~120 unicode-range slices
// (it is a Japanese face) and next/font inlines every @font-face rule into the
// page CSS (~34 KB gz of render-blocking CSS on every locale). One small
// self-hosted Latin file via next/font/local avoids that.
//
//   node scripts/build-display-font.mjs
//
// Needs assets-src/fonts/DelaGothicOne-Regular.ttf (downloaded by
// scripts/build-wordmark.mjs).

import { readFileSync, writeFileSync } from "fs";
import subsetFont from "subset-font";

const SRC = "assets-src/fonts/DelaGothicOne-Regular.ttf";
const OUT = "src/fonts/DelaGothicOne-Latin.woff2";

const ranges = [
  [0x20, 0x7e], // Basic Latin
  [0xa0, 0xff], // Latin-1 (French accents, « », ·, ©, °)
  [0x152, 0x153], // Œ œ
  [0x178, 0x178], // Ÿ
  [0x2010, 0x2027], // dashes, quotes ’ “ ” ‚ „, …, •
  [0x202f, 0x202f], // narrow no-break space (French « » spacing)
  [0x2039, 0x203a], // ‹ ›
  [0x20ac, 0x20ac], // €
  [0x2122, 0x2122], // ™
];
let text = "";
for (const [a, b] of ranges) for (let c = a; c <= b; c++) text += String.fromCodePoint(c);

const out = await subsetFont(readFileSync(SRC), text, { targetFormat: "woff2" });
writeFileSync(OUT, out);
console.log(`wrote ${OUT}: ${(out.length / 1024).toFixed(1)} KB`);
