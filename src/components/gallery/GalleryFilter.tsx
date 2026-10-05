"use client";

import { Suspense, useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { chipClasses } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { EcrinSurface } from "@/components/ui/EcrinSurface";
import { PIPING, isWedding, type PipingName } from "@/lib/piping";
import { cn } from "@/lib/utils";
import { GRID_ID, SCOPE_ID } from "./filter-boot";
import styles from "./gallery.module.css";

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
  script in the root layout's <head> (filter-boot.ts) applies it before first
  paint for deep links (no flash of all cakes).

  Wedding view (?c=wedding, DESIGN.md amendment 1): the chip row turns into
  the écrin surface and an écrin intro with a wedding WhatsApp brief appears.
  It keys off `data-c` on the scope (Tailwind group/scope), not React state,
  so a deep link is already dark before hydration.
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

/** The wedding view's intro + brief (all strings pre-translated). */
export interface WeddingView {
  title: string;
  text: string;
  cta: string;
  opensWhatsApp: string;
  /** buildWhatsAppUrl(…) with the wedding context. */
  href: string;
}

// Wedding styling uses the literal variant `group-data-[c=wedding]/scope:`
// (Tailwind only sees literal class names; the wedding slug is "wedding").

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
  wedding,
  bars,
  children,
}: {
  chips: FilterChip[];
  filterLabel: string;
  /** Pre-translated "N créations" per slug ("" key = all). */
  countLabels: Record<string, string>;
  wedding?: WeddingView;
  /** Sticky order bars: the generic one, and the wedding one shown for ?c=wedding. */
  bars?: { general: ReactNode; wedding: ReactNode };
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
  const weddingActive = isWedding(active ?? undefined);

  return (
    <div ref={scopeRef} id={SCOPE_ID} data-c={active ?? ""} suppressHydrationWarning className="group/scope">
      <Suspense fallback={null}>
        <SearchParamSync onChange={apply} />
      </Suspense>

      <nav
        aria-label={filterLabel}
        // `ecrin` turns the focus ring dragée on paillette (globals.css).
        className={cn("sticky top-0 z-20 bg-sucre py-3 group-data-[c=wedding]/scope:sequin", weddingActive && "ecrin")}
      >
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
                className={chipClasses(
                  selected,
                  cn(
                    "h-11 desk:h-10",
                    selected
                      ? "group-data-[c=wedding]/scope:bg-sucre group-data-[c=wedding]/scope:text-paillette"
                      : "group-data-[c=wedding]/scope:bg-sucre/10 group-data-[c=wedding]/scope:text-sucre group-data-[c=wedding]/scope:hover:bg-sucre/20"
                  )
                )}
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

      {wedding && (
        // Continues the dark chip row into one full-bleed écrin band.
        <EcrinSurface className="hidden pt-3 pb-10 group-data-[c=wedding]/scope:block desk:pt-6 desk:pb-14">
          <div className="wrap grid gap-6 desk:grid-cols-[minmax(0,1fr)_auto] desk:items-end desk:gap-16">
            <div>
              <span aria-hidden="true" className="mb-5 block h-px w-12 bg-cuivre" />
              <h2 className={cn(styles.ecrinTitle, "text-sucre")}>{wedding.title}</h2>
              <p className="mt-3 max-w-[52ch] text-sucre/85">{wedding.text}</p>
            </div>
            <Button href={wedding.href} icon="whatsapp" className="w-full desk:w-auto">
              {wedding.cta}
              <span className="sr-only"> ({wedding.opensWhatsApp})</span>
            </Button>
          </div>
        </EcrinSurface>
      )}

      <p role="status" className="wrap type-meta mt-2 mb-4 text-ink-muted group-data-[c=wedding]/scope:mt-6 desk:mb-6">
        {count}
      </p>

      <div id={GRID_ID} data-c={active ?? ""} suppressHydrationWarning className="wrap">
        {children}
      </div>

      {bars && (
        <>
          <div className="group-data-[c=wedding]/scope:hidden">{bars.general}</div>
          <div className="hidden group-data-[c=wedding]/scope:block">{bars.wedding}</div>
        </>
      )}
    </div>
  );
}

/**
 * Server-side companion: CSS that hides non-matching items for each slug.
 * Render it right AFTER <GalleryFilter>. The deep-link pre-paint script
 * lives in the root layout (filter-boot.ts).
 */
export function GalleryFilterStyles({ slugs }: { slugs: string[] }) {
  const safe = slugs.filter((s) => /^[a-z0-9-]+$/.test(s));
  const css = safe.map((s) => `#${GRID_ID}[data-c="${s}"] [data-cat]:not([data-cat="${s}"]){display:none}`).join("");
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
