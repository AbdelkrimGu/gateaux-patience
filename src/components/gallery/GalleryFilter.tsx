"use client";

import { Suspense, useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { chipClasses } from "@/components/ui/Chip";
import { PIPING, type PipingName } from "@/lib/piping";

/*
  Gallery filter (B §7 chips, B §8 "chip filtering is instant, no animation").

  The grid is rendered on the SERVER (children) with one `data-cat` per item;
  this island only owns which category is active. Filtering is pure CSS:
  the wrapper gets `data-c="<slug>"` and the per-slug rules from
  <GalleryFilterStyles> hide the other items (display:none, so their lazy
  images never load). No card re-renders, no hydration swap of the LCP image.

  URL: `?c=<slug>`. Chips are real links (shareable, open-in-new-tab); a plain
  click pushes the URL with history.pushState, which the App Router syncs
  into useSearchParams, so back/forward also drive the filter. The page stays
  static: `?c=` is read on the client only (inside <Suspense>), and an inline
  script applies it before first paint for deep links (no flash of all cakes).
*/

export interface FilterChip {
  /** Category slug; null = "all". */
  slug: string | null;
  label: string;
  count: number;
  /** Localized href, e.g. /ar/galerie?c=wedding */
  href: string;
  dot?: PipingName;
}

export const GRID_ID = "gp-gallery-grid";

function SearchParamSync({ onChange }: { onChange: (c: string | null) => void }) {
  const params = useSearchParams();
  const c = params.get("c");
  useEffect(() => onChange(c), [c, onChange]);
  return null;
}

export function GalleryFilter({
  chips,
  filterLabel,
  countLabels,
  children,
}: {
  chips: FilterChip[];
  filterLabel: string;
  /** Pre-translated "N créations" per slug ("" key = all). */
  countLabels: Record<string, string>;
  children: ReactNode;
}) {
  const [active, setActive] = useState<string | null>(null);
  const scopeRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const known = useRef(new Set(chips.map((c) => c.slug).filter(Boolean) as string[]));

  const apply = useCallback((c: string | null) => {
    setActive(c && known.current.has(c) ? c : null);
  }, []);

  // Keep the selected chip visible in the scrolling row (deep links, back).
  useEffect(() => {
    const row = rowRef.current;
    const chip = row?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!row || !chip) return;
    const r = row.getBoundingClientRect();
    const b = chip.getBoundingClientRect();
    if (b.left < r.left || b.right > r.right) {
      row.scrollBy({
        left: b.left - r.left - (r.width - b.width) / 2,
        behavior: "instant",
      });
    }
  }, [active]);

  const onChipClick = (e: MouseEvent<HTMLAnchorElement>, chip: FilterChip) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (chip.slug === active) return;
    window.history.pushState(null, "", chip.href);
    setActive(chip.slug);
    // If the visitor has scrolled into the grid, bring its top back under
    // the sticky chips (instant: filtering has no motion).
    const scope = scopeRef.current;
    const row = rowRef.current;
    if (scope && row) {
      const top = scope.getBoundingClientRect().top;
      if (top < 0) window.scrollBy({ top: top, behavior: "instant" });
    }
  };

  const count = countLabels[active ?? ""] ?? countLabels[""];

  return (
    <div ref={scopeRef}>
      <Suspense fallback={null}>
        <SearchParamSync onChange={apply} />
      </Suspense>

      <nav aria-label={filterLabel} className="sticky top-0 z-20 bg-sucre py-3">
        <div
          ref={rowRef}
          className="wrap flex snap-x gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {chips.map((chip) => {
            const selected = (chip.slug ?? null) === active;
            return (
              <a
                key={chip.slug ?? "all"}
                href={chip.href}
                onClick={(e) => onChipClick(e, chip)}
                aria-current={selected ? "true" : undefined}
                data-chip={chip.slug ?? ""}
                className={chipClasses(selected, "h-11 desk:h-10")}
              >
                {chip.dot && (
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-full"
                    style={{
                      background: selected ? PIPING[chip.dot].tint : PIPING[chip.dot].piping,
                    }}
                  />
                )}
                <span>{chip.label}</span>
                <span className="font-normal opacity-70">{chip.count}</span>
              </a>
            );
          })}
        </div>
      </nav>

      <p role="status" className="wrap type-meta mt-2 mb-4 text-ink-muted desk:mb-6">
        {count}
      </p>

      <div id={GRID_ID} data-c={active ?? ""} suppressHydrationWarning className="wrap">
        {children}
      </div>
    </div>
  );
}

/**
 * Server-side companion: CSS that hides non-matching items for each slug,
 * plus a tiny pre-paint script that reads ?c= for deep links. Render it
 * right AFTER <GalleryFilter>.
 */
export function GalleryFilterStyles({ slugs }: { slugs: string[] }) {
  const safe = slugs.filter((s) => /^[a-z0-9-]+$/.test(s));
  const css = safe.map((s) => `#${GRID_ID}[data-c="${s}"] [data-cat]:not([data-cat="${s}"]){display:none}`).join("");
  const list = JSON.stringify(safe);
  const js = `(function(){try{var c=new URLSearchParams(location.search).get("c");if(c&&${list}.indexOf(c)>-1)document.getElementById("${GRID_ID}").setAttribute("data-c",c)}catch(e){}})()`;
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <script dangerouslySetInnerHTML={{ __html: js }} />
    </>
  );
}
