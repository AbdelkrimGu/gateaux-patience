"use client";

import { useEffect } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { localizePath, stripLocale } from "@/i18n/paths";
import { routing } from "@/i18n/routing";
import { UNIVERSES, UNIVERSE_HREF, universeOfPath } from "./model";
import { rememberVisit } from "./memory";

/*
  Background jobs, rendered once by the site chrome and once by the tiramisu
  page (it lives outside the chrome). Renders nothing.

  1. Prefetch (07 §4.5): once the page is idle, prefetch the three universe
     routes, so a switch is instant on 4G. (Next only prefetches in
     production; links in view are prefetched by <Link> anyway.)
  2. Memory: remember the universe page last seen (path + filter), which
     the home "Reprendre" chip offers back.
  3. Scroll on back/forward (07 §4.3): the position of each URL (path +
     ?c= filter) is kept while the visitor scrolls; after a browser
     back/forward it is restored once the page is tall enough again (lazy
     images and content-visibility make the page grow after the commit, so
     the router's own restore could land short).
*/

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

const positions = new Map<string, number>();
// Read at popstate time (the URL is already the destination's), before any
// scroll event of the incoming render can overwrite it.
let restoreY: number | null = null;
const urlKey = () => window.location.pathname + window.location.search;

export function UniverseIdle() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useParams<{ locale?: string }>()?.locale ?? routing.defaultLocale;

  useEffect(() => {
    const w = window as IdleWindow;
    const run = () => {
      const here = universeOfPath(stripLocale(window.location.pathname));
      for (const u of UNIVERSES) if (u !== here) router.prefetch(localizePath(locale, UNIVERSE_HREF[u]));
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(run, { timeout: 4000 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(run, 2500);
    return () => window.clearTimeout(t);
  }, [router, locale]);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        positions.set(urlKey(), window.scrollY);
      });
    };
    const onPop = () => {
      restoreY = positions.get(urlKey()) ?? null;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("popstate", onPop);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    rememberVisit(stripLocale(pathname) + window.location.search);
    const y = restoreY;
    restoreY = null;
    if (!y) return;
    let frames = 0;
    let raf = 0;
    const tick = () => {
      const room = document.documentElement.scrollHeight - window.innerHeight;
      if (room >= y || frames > 40) window.scrollTo({ top: Math.min(y, room), behavior: "instant" });
      else {
        frames++;
        raf = window.requestAnimationFrame(tick);
      }
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [pathname]);

  return null;
}
