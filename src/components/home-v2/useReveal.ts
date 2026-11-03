"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * "idle" → server HTML / no JS / reduced motion: the final, readable state.
 * "wait" → armed before first paint because the element is still below the
 *           fold (nobody sees the switch), waiting to enter.
 * "in"   → entered: CSS plays the section's one motion moment.
 *
 * Elements already on screen at hydration stay "idle" (no flash, no replay).
 */
export type RevealState = "idle" | "wait" | "in";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function useReveal<T extends HTMLElement>({
  threshold = 0.25,
  rootMargin = "0px 0px -8% 0px",
}: { threshold?: number; rootMargin?: string } = {}) {
  const ref = useRef<T>(null);
  const [state, setState] = useState<RevealState>("idle");

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) return; // already visible: keep the final state
    setState("wait"); // armed before paint, offscreen only
    // Fire when enough of it is visible — or once it is well inside / past the
    // viewport (fast flings can skip a single threshold), so it never stays hidden.
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[entries.length - 1];
        if (!e) return;
        const vh = window.innerHeight;
        const need = Math.min(threshold, (0.8 * vh) / Math.max(1, e.boundingClientRect.height));
        if ((e.isIntersecting && e.intersectionRatio >= need) || e.boundingClientRect.top < vh * 0.5) {
          setState("in");
          io.disconnect();
        }
      },
      { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1], rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin]);

  return [ref, state] as const;
}
