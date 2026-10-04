"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useHomeName } from "./name-store";

/*
  The name in white-chocolate letters on the tiramisu tile (B §2, point 2).
  Real sprites from /public/images/tiramisu/letters (the customizer's set).
  The set is Latin-only (DESIGN.md amendment 8): a name with any non-Latin
  letter (e.g. Arabic) shows the static sample instead. Never fake letters.
  Static: the tiramisu page owns the "letters land" motion.
*/

/** Natural sprite sizes [w, h] (px), from the PNGs. */
const SPRITES: Record<string, readonly [number, number]> = {
  "0": [188, 266],
  "1": [144, 270],
  "2": [181, 269],
  "3": [181, 266],
  "4": [196, 270],
  "5": [167, 226],
  "6": [173, 228],
  "7": [170, 227],
  "8": [184, 229],
  "9": [176, 228],
  A: [157, 180],
  B: [135, 178],
  C: [131, 174],
  D: [130, 170],
  E: [114, 176],
  F: [112, 178],
  G: [137, 177],
  H: [135, 168],
  I: [61, 169],
  J: [115, 168],
  K: [137, 168],
  L: [112, 167],
  M: [151, 166],
  N: [132, 166],
  O: [145, 173],
  P: [125, 171],
  Q: [137, 188],
  R: [129, 170],
  S: [129, 173],
  T: [132, 171],
  U: [139, 171],
  V: [179, 199],
  W: [231, 196],
  X: [171, 196],
  Y: [169, 196],
  Z: [155, 199],
};

const MAX_LETTERS = 8;
/** Rendered sprite height used for the srcset (the CSS may draw it smaller). */
const SPRITE_H = 40;

/** Uppercase Latin word for the sprites, or null if the name can't be shown. */
export function tiramisuWord(name: string): string | null {
  const plain = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
  if (!plain) return null;
  // Anything beyond Latin letters, digits and separators -> not representable.
  if (/[^A-Z0-9 '’.-]/.test(plain)) return null;
  const word = plain.replace(/[^A-Z0-9]/g, "").slice(0, MAX_LETTERS);
  return word || null;
}

export function TiramisuWord({ sample }: { sample: string }) {
  const name = useHomeName();
  const word = tiramisuWord(name) ?? tiramisuWord(sample) ?? "";
  const letters = [...word].filter((c) => SPRITES[c]);
  const ratio = letters.reduce((sum, c) => sum + SPRITES[c][0] / SPRITES[c][1], 0) || 1;

  return (
    <span
      dir="ltr"
      className="absolute inset-0 flex items-center justify-center"
      style={{ "--ratio": ratio } as CSSProperties}
    >
      {letters.map((c, i) => {
        const [w, h] = SPRITES[c];
        return (
          <Image
            key={`${i}-${c}`}
            src={`/images/tiramisu/letters/${c}.png`}
            alt=""
            width={Math.round((SPRITE_H * w) / h)}
            height={SPRITE_H}
            className="h-[min(var(--letter-h),calc(72cqi/var(--ratio)))] w-auto drop-shadow-[0_1px_1px_rgb(0_0_0/0.35)]"
          />
        );
      })}
    </span>
  );
}
