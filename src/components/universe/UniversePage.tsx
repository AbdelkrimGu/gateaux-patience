import { ViewTransition, type ReactNode } from "react";
import { VT_BACK, VT_FORWARD, VT_GATE } from "./model";
import { UNIVERSE_TRANSITIONS_CSS } from "./transitions-css";

/*
  Wrap the content of the home page and of every universe page in this
  (07 §4.2), e.g. /douceurs:

    <UniversePage>…sections…</UniversePage>

  It is React's <ViewTransition> keyed by the navigation's transition type
  (set by the switcher / gate / cross-sell links): universe -> universe
  slides in switcher order, gate -> universe settles in under the hero
  morph. Untyped navigations (browser back/forward, card -> detail,
  refresh) get no page animation, so the gallery's own card -> plate morph
  keeps working unchanged. Put it in each page, never in a layout (layouts
  persist, so enter/exit would never fire there).
*/

const CLASSES = {
  [VT_FORWARD]: "gp-forward",
  [VT_BACK]: "gp-back",
  [VT_GATE]: "gp-gate",
  default: "none",
};

export function UniversePage({ children }: { children: ReactNode }) {
  return (
    <>
      {/* React hoists this to <head> once per document (href + precedence). */}
      <style href="gp-universe-transitions" precedence="gp-universe">
        {UNIVERSE_TRANSITIONS_CSS}
      </style>
      <ViewTransition enter={CLASSES} exit={CLASSES} default="none">
        {children}
      </ViewTransition>
    </>
  );
}
