/*
  Card → plate (DESIGN.md amendment 9, B §8 gallery signature).

  How it works: the tapped CakeCard's U-mat and the detail page's
  LetteredBoard share `view-transition-name: cake-<slug>` (see
  CardTransitionScope). Both pages wrap their content in React's
  <ViewTransition default="none">, so App Router navigations into or out of
  them run inside document.startViewTransition (no next.config flag needed
  on Next 16.3); the browser morphs mat → plate, and plate → card via
  "Toutes les créations". Without View Transitions support it is a plain
  navigation. Browser back is committed synchronously by React, so it does
  not animate.

  The rest of the page does a short crossfade so the morph is the one thing
  that moves. Inlined (~0.5 KB) rather than a stylesheet: one fewer
  render-blocking request on both routes.
*/

const CSS = `
::view-transition{pointer-events:none}
::view-transition-group(*){animation-duration:440ms;animation-timing-function:cubic-bezier(.2,.8,.2,1)}
::view-transition-old(root),::view-transition-new(root),::view-transition-group(root){animation-duration:180ms;animation-timing-function:ease-out}
@media (prefers-reduced-motion:reduce){::view-transition-group(*),::view-transition-old(*),::view-transition-new(*){animation:none!important}}
`;

export function ViewTransitionStyles() {
  return <style dangerouslySetInnerHTML={{ __html: CSS }} />;
}
