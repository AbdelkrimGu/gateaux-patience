// Per-cake accent colours, chosen deterministically (DESIGN.md amendment 3).
//
// B §3: each cake gets ONE piping (text) colour + its tint (mat). We do not
// store them: the pair is picked by hashing the cake id, wedding cakes always
// get "or". Same cake -> same colour on every page, no DB writes.
//
//   const p = pipingFor(cake);            // "lilas"
//   <a style={pipingStyle(p)} className="…">
//     <div className="bg-tint rounded-tin">…</div>
//     <h3 className="text-piping">…</h3>
//   </a>
// or with the utility class: className={`piping-${p}`}.

import type { CSSProperties } from "react";
import { fnv1a } from "./hash";

export const PIPING = {
  bleu: { piping: "#0A6CB5", tint: "#DCEAF6" },
  lilas: { piping: "#7A4FA6", tint: "#ECE2F5" },
  menthe: { piping: "#137A68", tint: "#D6F0E9" },
  rouge: { piping: "#A3131B", tint: "#F7DCDC" },
  or: { piping: "#9A6416", tint: "#F6E9D2" },
} as const;

export type PipingName = keyof typeof PIPING;

/** Non-wedding cakes draw from these; "or" is reserved for weddings. */
const EVERYDAY: readonly PipingName[] = ["bleu", "lilas", "menthe", "rouge"];

/** Category slugs (Mongo `categories.slug`) treated as wedding/engagement. */
export const WEDDING_SLUGS: readonly string[] = ["wedding"];

export const isWedding = (categorySlug: string | undefined) =>
  !!categorySlug && WEDDING_SLUGS.includes(categorySlug);

export function pipingFor(cake: { id: string; category?: string }): PipingName {
  if (isWedding(cake.category)) return "or";
  // Different seed from cake-ref so colour and ref are uncorrelated.
  return EVERYDAY[fnv1a(cake.id, 0x9e3779b1) % EVERYDAY.length];
}

/** Inline CSS vars consumed by the `text-piping` / `bg-tint` utilities. */
export function pipingStyle(name: PipingName): CSSProperties {
  const p = PIPING[name];
  return { "--piping": p.piping, "--tint": p.tint } as CSSProperties;
}

/** Occasion phrase key (messages common.occasion.*) for a category slug. */
export type Occasion = "birthday" | "wedding" | "birth" | "success";

export function occasionFor(categorySlug: string | undefined): Occasion {
  if (isWedding(categorySlug)) return "wedding";
  if (categorySlug === "grossesse") return "birth";
  if (categorySlug === "graduation") return "success";
  return "birthday";
}
