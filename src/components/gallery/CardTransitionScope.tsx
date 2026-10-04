"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { cakeTransitionName } from "@/components/ui/CakeCard";

/*
  Card → plate View Transition, one pair at a time (DESIGN.md amendment 9).

  If every card carried a static view-transition-name, the browser would
  snapshot all of them and fade them out ABOVE the incoming page. So cards
  are rendered without a name and this scope names exactly one mat:
  - on tap: the tapped card's mat (before the router navigates);
  - on arrival (layout effect, i.e. inside React's view-transition update,
    before the new state is captured): the card of the cake we just left,
    so "Toutes les créations" morphs the plate back into its card.
  The detail plate keeps its name (it is the one element on that page).
*/

// Slug of the detail page being unmounted in the CURRENT commit. Layout-effect
// cleanups of the old page run before the new page's layout effects, and the
// timeout clears it right after, so arriving from any other page names nothing.
let leaving: string | null = null;

/** Called by the detail page: the plate we may morph back from. */
export function useRememberCake(slug: string) {
  useLayoutEffect(
    () => () => {
      leaving = slug;
      window.setTimeout(() => {
        if (leaving === slug) leaving = null;
      }, 0);
    },
    [slug]
  );
}

const MAT = ":scope > :first-child";

function slugOf(a: HTMLAnchorElement): string | null {
  const m = /\/galerie\/([^/?#]+)$/.exec(new URL(a.href).pathname);
  return m ? decodeURIComponent(m[1]) : null;
}

function clearAll(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>("[data-vt-named]").forEach((el) => {
    el.style.viewTransitionName = "";
    delete el.dataset.vtNamed;
  });
}

function nameMat(a: HTMLAnchorElement, slug: string) {
  const mat = a.querySelector<HTMLElement>(MAT);
  if (!mat) return;
  mat.style.viewTransitionName = cakeTransitionName(slug);
  mat.dataset.vtNamed = "";
}

export function CardTransitionScope({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    const from = leaving;
    if (!root || !from) return;
    const a = [...root.querySelectorAll<HTMLAnchorElement>('a[href*="/galerie/"]')].find((x) => slugOf(x) === from);
    if (!a) return;
    nameMat(a, from);
    const t = window.setTimeout(() => clearAll(root), 1200);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      onClickCapture={(e) => {
        const root = ref.current;
        const a = (e.target as Element).closest<HTMLAnchorElement>("a[href]");
        if (!root || !a) return;
        const slug = slugOf(a);
        if (!slug) return;
        clearAll(root);
        nameMat(a, slug);
      }}
    >
      {children}
    </div>
  );
}
