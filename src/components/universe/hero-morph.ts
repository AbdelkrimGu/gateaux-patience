/*
  Home card image -> universe hero, one shared element at a time (07 §4.2).

  Same rule as the gallery's CardTransitionScope (see its header): nothing
  carries a static view-transition-name, otherwise every named element is
  snapshotted on every navigation. Instead:
  - on tap, the gate names the tapped card's image `gp-hero-<universe>`;
  - when the destination commits (a layout effect in the switcher, i.e.
    inside React's view-transition update, before the new snapshot), the
    landing hero gets the same name, and both names are cleared right after.

  Landing hero per universe: the element marked `data-gp-hero="<universe>"`
  (tiramisu stage, /douceurs hero), else, for the cakes gallery, the first
  card's photo mat, which shows the same photo as the home card.
*/

import { heroName, type Universe } from "./model";

let pending: Universe | null = null;
let pendingAt = 0;

const named = new Set<HTMLElement>();

function name(el: HTMLElement, u: Universe) {
  el.style.viewTransitionName = heroName(u);
  el.style.setProperty("view-transition-class", "gp-hero");
  named.add(el);
}

export function clearHeroNames() {
  for (const el of named) {
    el.style.viewTransitionName = "";
    el.style.removeProperty("view-transition-class");
  }
  named.clear();
}

/** Gate side: call in the card's click handler (before the router navigates). */
export function departHero(u: Universe, image: HTMLElement | null) {
  clearHeroNames();
  if (!image || !("startViewTransition" in document)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  pending = u;
  pendingAt = Date.now();
  name(image, u);
}

function landingFor(u: Universe): HTMLElement | null {
  const marked = document.querySelector<HTMLElement>(`[data-gp-hero="${u}"]`);
  if (marked) return marked;
  if (u === "cakes") {
    return document.querySelector<HTMLElement>('#main a[href*="/galerie/"] > :first-child');
  }
  return null;
}

/** Destination side: call from a layout effect when `u` becomes the current universe. */
export function landHero(u: Universe) {
  if (pending !== u || Date.now() - pendingAt > 8000) return;
  pending = null;
  const el = landingFor(u);
  if (el) name(el, u);
  // The transition captures the names synchronously after this commit;
  // drop them once it is over so later navigations start clean.
  window.setTimeout(clearHeroNames, 1200);
}
