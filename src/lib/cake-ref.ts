// Human reference codes for cakes, without a DB migration (DESIGN.md amend. 4).
//
//   cakeRef("be421475-28cd-…") -> "GP-3K7Q"
//
// 4 chars from a Crockford-style alphabet with the look-alikes removed
// (no 0/O, 1/I/L), so a ref read aloud or retyped from a WhatsApp chat can't
// be misread: 31^4 = 923,521 codes. For a few hundred cakes the collision odds
// are tiny, and assertUniqueRefs() warns in development if it ever happens.
// Show it on cards, the detail page and in WhatsApp messages. In RTL wrap it
// in <bdi> or className="ltr".

import { fnv1a } from "./hash";

export const REF_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const BASE = REF_ALPHABET.length;
const LENGTH = 4;
const SPACE = BASE ** LENGTH;

export function cakeRef(cakeId: string): string {
  let n = fnv1a(cakeId) % SPACE;
  let out = "";
  for (let i = 0; i < LENGTH; i++) {
    out = REF_ALPHABET[n % BASE] + out;
    n = Math.floor(n / BASE);
  }
  return `GP-${out}`;
}

/** Dev-only guard: logs any two cakes that share a ref. Returns the clashes. */
export function assertUniqueRefs(cakes: ReadonlyArray<{ id: string }>): string[] {
  const seen = new Map<string, string>();
  const clashes: string[] = [];
  for (const { id } of cakes) {
    const ref = cakeRef(id);
    const other = seen.get(ref);
    if (other && other !== id) clashes.push(`${ref}: ${other} / ${id}`);
    else seen.set(ref, id);
  }
  if (clashes.length && process.env.NODE_ENV !== "production") {
    console.warn(`[cake-ref] duplicate refs, change the hash seed or length:\n  ${clashes.join("\n  ")}`);
  }
  return clashes;
}
