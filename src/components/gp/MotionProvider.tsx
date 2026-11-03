"use client";

import { LazyMotion, MotionConfig } from "motion/react";

// Animation features are code-split: `m.*` components render immediately and
// start animating once this chunk arrives (no `motion.*` in shared chunks).
const loadFeatures = () => import("./motion-features").then((mod) => mod.default);

/** Site-wide motion setup: lazy `m` features + OS reduced-motion respected. */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={loadFeatures}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
