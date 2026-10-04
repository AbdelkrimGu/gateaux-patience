"use client";

import type { ReactNode } from "react";
import { isUniverse } from "@/components/universe/model";
import { departHero } from "@/components/universe/hero-morph";
import { emitIntent } from "@/components/universe/memory";

/*
  One delegated tap handler for the three server-rendered gate cards:
  names the tapped card's photo for the shared-element morph into the
  universe's hero (hero-morph.ts) and fires the gp:intent analytics event.
  The links work the same without it (plain navigation).
*/

export function GateScope({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={className}
      onClickCapture={(e) => {
        const a = (e.target as Element).closest<HTMLAnchorElement>("a[data-gate]");
        const u = a?.dataset.gate;
        if (!a || !isUniverse(u)) return;
        emitIntent(u, "home");
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        departHero(u, a.querySelector<HTMLElement>("[data-gate-media]"));
      }}
    >
      {children}
    </div>
  );
}
