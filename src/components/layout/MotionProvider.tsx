"use client";

import { LazyMotion, MotionConfig } from "motion/react";

// Wrap ONLY the client island that animates with `m` (not the whole app:
// MotionConfig + LazyMotion alone are ~11 KB gz). reducedMotion="user" makes
// every `m` inside respect prefers-reduced-motion; the animation features are
// fetched after hydration. Use `m` from "motion/react", never `motion.*`,
// and only where CSS can't do it (DESIGN.md amendment 9).
//
//   <MotionProvider><ChipIndicator /></MotionProvider>
const loadFeatures = () => import("./motion-features").then((mod) => mod.default);

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={loadFeatures}>{children}</LazyMotion>
    </MotionConfig>
  );
}
