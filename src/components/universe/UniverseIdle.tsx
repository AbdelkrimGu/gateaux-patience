"use client";

import { useEffect } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { localizePath, stripLocale } from "@/i18n/paths";
import { routing } from "@/i18n/routing";
import { UNIVERSES, UNIVERSE_HREF, universeOfPath } from "./model";
import { rememberVisit } from "./memory";

/*
  Two cheap background jobs, rendered once by the site chrome and once by
  the tiramisu page (it lives outside the chrome):

  1. Prefetch (07 §4.5): once the page is idle, prefetch the three universe
     routes, so a switch is instant on 4G. (Next only prefetches in
     production; links in view are prefetched by <Link> anyway.)
  2. Memory: remember the universe page last seen (path + filter), which
     the home "Reprendre" chip offers back.

  Renders nothing.
*/

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

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
    rememberVisit(stripLocale(pathname) + window.location.search);
  }, [pathname]);

  return null;
}
