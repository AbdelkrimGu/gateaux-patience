/*
  Page transitions between the gate and the three universes (07 §4.2).
  Global on purpose: view-transition pseudo-elements and transition types
  can't live in a CSS module. Classes come from <UniversePage> (React
  <ViewTransition enter/exit> keyed by the Link transitionTypes set in
  model.ts), names from hero-morph.ts, the switcher and the header.

  React only runs enter/exit for the top-most <ViewTransition> of an
  inserted/removed tree. Between two pages of the site chrome that is the
  page's <UniversePage>; when the whole chrome comes or goes (site pages <->
  the full-screen tiramisu wizard) it is <UniverseChromeTransition> around
  <main> + footer in SiteChrome. Same classes either way (gp-forward,
  gp-back, gp-gate). Without that outer boundary the leaving page had no
  snapshot of its own and vanished at the first frame.
  The header and the phone switcher strip are named and anchored; the
  switcher indicator (with its label) glides; on a gate tap the card's
  picture morphs into the hero (gp-hero class).

  Only transform + opacity. Reduced motion: nothing moves (also covered by
  the global guard). No View Transitions support: plain, instant navigation.
*/

const CSS = `
::view-transition { pointer-events: none; }
/* RTL fix. When the root itself does not animate, React shrinks
   ::view-transition to 0x0 (so the live page stays visible). With the UA's
   inset: 0 in an RTL document that empty box resolves against the RIGHT
   edge, so every group was drawn one viewport to the right: Arabic
   transitions showed a blank page. Pin the box to the left; its children
   are positioned in physical px anyway. */
::view-transition { right: auto; left: 0; }

/* Header and phone strip (10-review M2). Leaving a scrolled page, the old
   header is off screen and the old strip is stuck at the top, while the
   new page starts at scroll 0. So: the header never moves (its group does
   not animate) but fades in instead of popping over the old content; the
   strip's group glides from its stuck spot to its resting place, in step
   with the indicator. Only the new snapshots are drawn. */
::view-transition-group(gp-site-header) { animation: none; z-index: 40; }
::view-transition-group(gp-switch-bar) {
  z-index: 40;
  animation-duration: 380ms;
  animation-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1);
}
::view-transition-old(gp-site-header),
::view-transition-old(gp-switch-bar) { display: none; }
::view-transition-new(gp-site-header) { animation: gp-vt-fade-in 180ms linear both; }
::view-transition-new(gp-switch-bar) { animation: none; }
/* Gate -> universe: no strip on the gate, so it arrives (fades in) instead
   of appearing over the gate's H1 at the first frame. */
::view-transition-new(gp-switch-bar):only-child { animation: gp-vt-fade-in 200ms linear 120ms both; }
::view-transition-new(gp-switch-ind):only-child { animation: gp-vt-fade-in 200ms linear 120ms both; }

::view-transition-group(gp-switch-ind) {
  z-index: 41;
  animation-duration: 380ms;
  animation-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1);
}

/* Leaving: the old page (or the whole site chrome) boundary. */
::view-transition-old(.gp-forward),
::view-transition-old(.gp-back) {
  animation: gp-vt-fade-out 160ms linear both, gp-vt-to-start 260ms cubic-bezier(0.4, 0, 1, 1) both;
}
::view-transition-old(.gp-back) { animation-name: gp-vt-fade-out, gp-vt-to-end; }
html[dir="rtl"]::view-transition-old(.gp-forward) { animation-name: gp-vt-fade-out, gp-vt-to-end; }
html[dir="rtl"]::view-transition-old(.gp-back) { animation-name: gp-vt-fade-out, gp-vt-to-start; }

/* Arriving: the new page's boundary. */
::view-transition-new(.gp-forward),
::view-transition-new(.gp-back) {
  animation: gp-vt-fade-in 220ms linear 40ms both, gp-vt-from-end 360ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}
::view-transition-new(.gp-back) { animation-name: gp-vt-fade-in, gp-vt-from-start; }
html[dir="rtl"]::view-transition-new(.gp-forward) { animation-name: gp-vt-fade-in, gp-vt-from-start; }
html[dir="rtl"]::view-transition-new(.gp-back) { animation-name: gp-vt-fade-in, gp-vt-from-end; }

/* Gate -> universe: the gate steps back, the universe settles in, the
   tapped card's picture morphs into the hero. */
::view-transition-old(.gp-gate) { animation: gp-vt-fade-out 180ms linear both; }
::view-transition-new(.gp-gate) { animation: gp-vt-rise 380ms cubic-bezier(0.2, 0.8, 0.2, 1) 90ms both; }
::view-transition-group(.gp-hero) {
  z-index: 42;
  animation-duration: 520ms;
  animation-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1);
}
::view-transition-old(.gp-hero),
::view-transition-new(.gp-hero) { height: 100%; object-fit: cover; }
/* The arriving picture stays opaque underneath; only the card's picture
   fades off it (normal blending: plus-lighter / two half-transparent
   layers muddied the cocoa card over the dark stage, 10-review m1). */
::view-transition-old(.gp-hero),
::view-transition-new(.gp-hero) { mix-blend-mode: normal; }
::view-transition-old(.gp-hero) { z-index: 1; animation: gp-vt-fade-out 260ms linear 40ms both; }
::view-transition-new(.gp-hero) { animation: none; opacity: 1; }

@keyframes gp-vt-to-start { to { transform: translateX(-32px); } }
@keyframes gp-vt-to-end { to { transform: translateX(32px); } }
@keyframes gp-vt-from-end { from { transform: translateX(48px); } }
@keyframes gp-vt-from-start { from { transform: translateX(-48px); } }
@keyframes gp-vt-fade-in { from { opacity: 0; } }
@keyframes gp-vt-fade-out { to { opacity: 0; } }
@keyframes gp-vt-rise { from { opacity: 0; transform: translateY(16px); } }

@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) { animation: none !important; }
}
`;

/** Inlined by <UniversePage> as a hoisted, deduped <style> (no extra
 *  render-blocking stylesheet request). Comments stripped, spaces collapsed. */
export const UNIVERSE_TRANSITIONS_CSS = CSS.replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\s+/g, " ")
  .replace(/\s*([{};,])\s*/g, "$1")
  .trim();
