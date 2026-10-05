/*
  The three universes (research/website-revamp/07-intent-flow-spec.md §2).
  Pure and isomorphic: the order here IS the switcher order, and the
  direction of the universe → universe slide follows it (mirrored in RTL).
*/

import { SWEETS_HERO_IMAGE } from "@/lib/universes-core";

export const UNIVERSES = ["cakes", "sweets", "tiramisu"] as const;
export type Universe = (typeof UNIVERSES)[number];

/** Unprefixed routes (LocaleLink adds the locale). /galerie keeps its URL (SEO). */
export const UNIVERSE_HREF: Record<Universe, string> = {
  cakes: "/galerie",
  sweets: "/douceurs",
  tiramisu: "/tiramisu",
};

/** Universe of an unprefixed pathname ("/galerie/x" -> "cakes"), or null (home, 404…). */
export function universeOfPath(pathname: string): Universe | null {
  const path = pathname.split(/[?#]/)[0];
  for (const u of UNIVERSES) {
    const base = UNIVERSE_HREF[u];
    if (path === base || path.startsWith(`${base}/`)) return u;
  }
  return null;
}

export const isUniverse = (v: unknown): v is Universe => typeof v === "string" && (UNIVERSES as readonly string[]).includes(v);

/** Transition types (Link `transitionTypes`), read by transitions-css.ts. */
export const VT_FORWARD = "gp-universe-forward";
export const VT_BACK = "gp-universe-back";
export const VT_GATE = "gp-gate";

/** Forward when the target sits after the current one in the switcher. */
export function switchTypes(from: Universe | null, to: Universe): string[] {
  if (!from) return [VT_GATE];
  if (from === to) return [];
  return [UNIVERSES.indexOf(to) > UNIVERSES.indexOf(from) ? VT_FORWARD : VT_BACK];
}

/** Shared-element name of a universe's hero (home card image ↔ landing hero). */
export const heroName = (u: Universe) => `gp-hero-${u}`;

/*
  Representative image per universe for the gate and the cross-sell cards.
  Isolated here so the integrator can swap the sweets one for
  SWEETS_HERO_IMAGE (src/lib/universes.ts, /douceurs branch) after merge.
*/

/**
 * Real photo from the owner (Cake10: cake pops, "KENZA" cakesicles,
 * chocolate cakesicles), portrait 718×960. Same file and crop as
 * SWEETS_HERO_IMAGE (src/lib/universes-core.ts on the /douceurs branch), so
 * the home card morphs into the identical /douceurs hero.
 * INTEGRATOR: replace with `import { SWEETS_HERO_IMAGE } from "@/lib/universes-core"`.
 */
export const SWEETS_CARD_IMAGE = SWEETS_HERO_IMAGE;

/** The cocoa-topped box of the /tiramisu stage (same pixels: the hero morph lands on it). */
export const TIRAMISU_CARD_IMAGE = { src: "/images/tiramisu/boxes/cust-square.png", position: "50% 50%" } as const;
