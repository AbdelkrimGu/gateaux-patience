"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocale } from "next-intl";

/** The one easing of the site, for motion's `transition.ease`. */
export const GP_EASE = [0.22, 1, 0.36, 1] as const;

/**
 * `[ref, inView]` — becomes true the first time the element enters the
 * viewport, then stops observing. SSR / no-IntersectionObserver → true after mount.
 */
export function useInViewOnce<T extends Element = HTMLElement>({
  rootMargin = "0px 0px -12% 0px",
  threshold = 0.15,
}: { rootMargin?: string; threshold?: number } = {}): [(node: T | null) => void, boolean] {
  const [inView, setInView] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (node: T | null) => {
      observer.current?.disconnect();
      observer.current = null;
      if (!node || inView) return;
      if (typeof IntersectionObserver === "undefined") {
        setInView(true);
        return;
      }
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            setInView(true);
            observer.current?.disconnect();
          }
        },
        { rootMargin, threshold }
      );
      observer.current.observe(node);
    },
    [inView, rootMargin, threshold]
  );

  useEffect(() => () => observer.current?.disconnect(), []);
  return [ref, inView];
}

const RM_QUERY = "(prefers-reduced-motion: reduce)";
function subscribeRM(cb: () => void) {
  const mq = window.matchMedia(RM_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/**
 * True when the visitor asked for reduced motion. Hydration-safe: false on
 * the server and during hydration, then the real value (and live updates).
 * Use it to skip rAF loops / scroll-linked effects; CSS already freezes transitions.
 */
export function useReducedMotionSafe(): boolean {
  return useSyncExternalStore(
    subscribeRM,
    () => window.matchMedia(RM_QUERY).matches,
    () => false
  );
}

/** 1 in LTR, −1 in RTL: multiply horizontal motion (drift, swipe, arrows) by it. */
export function useDirSign(): 1 | -1 {
  return useLocale() === "ar" ? -1 : 1;
}
