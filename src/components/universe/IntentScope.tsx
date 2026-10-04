"use client";

import type { ReactNode } from "react";
import { isUniverse } from "./model";
import { departHero } from "./hero-morph";
import { emitIntent, type IntentSource } from "./memory";

/*
  One delegated tap handler around server-rendered universe cards (the home
  gate, the cross-sell block): for a link marked `data-universe="<u>"`, it
  fires the gp:intent analytics event and names the card's picture
  (`[data-universe-media]`) for the shared-element morph into that
  universe's hero (hero-morph.ts). The links work the same without it.
*/

export function IntentScope({
  children,
  from,
  className,
}: {
  children: ReactNode;
  from: IntentSource;
  className?: string;
}) {
  return (
    <div
      className={className}
      onClickCapture={(e) => {
        const a = (e.target as Element).closest<HTMLAnchorElement>("a[data-universe]");
        const u = a?.dataset.universe;
        if (!a || !isUniverse(u)) return;
        emitIntent(u, from);
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        departHero(u, a.querySelector<HTMLElement>("[data-universe-media]"));
      }}
    >
      {children}
    </div>
  );
}
