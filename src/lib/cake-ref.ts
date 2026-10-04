// Human reference codes for cakes, without a DB migration (DESIGN.md amend. 4).
//
//   cakeRef("be421475-28cd-…") -> "GP-3K7Q"
//
// 4 base-36 chars = 1.68M codes; for a few hundred cakes the collision odds are
// tiny, and assertUniqueRefs() warns in development if it ever happens.
// Show it on cards, the detail page and in WhatsApp messages. In RTL wrap it
// in <bdi> or className="ltr".

import { fnv1a } from "./hash";

const SPACE = 36 ** 4;

export function cakeRef(cakeId: string): string {
  const n = fnv1a(cakeId) % SPACE;
  return `GP-${n.toString(36).padStart(4, "0").toUpperCase()}`;
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
