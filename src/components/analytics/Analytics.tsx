"use client";

import { useEffect } from "react";
import { cakeSlugFromPath, classifyHref, initAnalytics, placementOf, track } from "@/lib/analytics";

/**
 * Mounted once in the public [locale] layout (never in /admin).
 * Starts PostHog shortly after the page is interactive, or on the visitor's
 * first tap, whichever comes first. Records outbound contact clicks
 * (WhatsApp / call / Instagram / Facebook) from anywhere on the site with one
 * delegated listener, so no component has to know about analytics.
 */
export default function Analytics() {
  // Start PostHog without competing with the first paint.
  useEffect(() => {
    const landing = { href: window.location.href, at: new Date() };
    const start = () => {
      cleanup();
      initAnalytics(landing);
    };
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const idleId = w.requestIdleCallback?.(start, { timeout: 1000 });
    const timerId = idleId === undefined ? window.setTimeout(start, 800) : undefined;
    // A tap means the visitor may navigate: start now so the landing is kept.
    window.addEventListener("pointerdown", start, { once: true, passive: true });
    window.addEventListener("keydown", start, { once: true });

    function cleanup() {
      if (idleId !== undefined) w.cancelIdleCallback?.(idleId);
      if (timerId !== undefined) window.clearTimeout(timerId);
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
    }
    return cleanup;
  }, []);

  // One listener for every contact link on the site.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as Element | null;
      const link = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      const channel = classifyHref(link.getAttribute("href") || "");
      if (!channel) return;
      const pathname = window.location.pathname;
      track(
        `${channel}_click`,
        {
          channel,
          placement: placementOf(link),
          page: pathname,
          cake: cakeSlugFromPath(pathname),
        },
        true
      );
    }
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
