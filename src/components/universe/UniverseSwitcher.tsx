"use client";

import { useLayoutEffect, useState } from "react";
import { LocaleLink as Link } from "@/i18n/LocaleLink";
import { cn } from "@/lib/utils";
import { UNIVERSES, UNIVERSE_HREF, switchTypes, type Universe } from "./model";
import { emitIntent } from "./memory";
import { landHero } from "./hero-morph";
import styles from "./universe.module.css";

/*
  [Gâteaux | Douceurs | Tiramisu] (07 §4.1). Three links in a pill track;
  the current one carries aria-current="page" and sits on a gliding
  indicator in that universe's colour (pink, mint, cocoa: the colour fields
  of the home cards).

  - With View Transitions, the indicator has a view-transition-name and
    the page transition glides it from the old spot to the new one (also
    across pages that render their own switcher: site chrome -> the
    tiramisu wizard); its label crossfades on the way. The three routes are
    prefetched at idle, so the commit is near-instant.
  - Without them, it moves on tap (optimistic CSS transform), before the
    route has even answered.
  - Each link tags its navigation forward/back by switcher order
    (Link transitionTypes); transitions-css.ts slides the page that
    way, mirrored in RTL.
  - RTL: the track flips with `dir`; the indicator's travel is mirrored in CSS.
*/

export interface UniverseSwitcherProps {
  current: Universe | null;
  labels: Record<Universe, string>;
  /** universe.switcher_label */
  label: string;
  className?: string;
  /** "strip": phone sticky strip / wizard. "header": desktop header. */
  size?: "strip" | "header";
}

export function UniverseSwitcher({ current, labels, label, className, size = "strip" }: UniverseSwitcherProps) {
  // Optimistic target, valid only while `current` is still the page it was set on.
  const [pending, setPending] = useState<{ to: Universe; from: Universe | null } | null>(null);

  // Arriving from a home card: name this page's hero for the shared-element
  // morph (runs inside the view-transition update, see hero-morph.ts).
  useLayoutEffect(() => {
    if (current) landHero(current);
  }, [current]);

  const shown = pending && pending.from === current ? pending.to : current;
  const index = shown ? UNIVERSES.indexOf(shown) : -1;

  return (
    <nav
      aria-label={label}
      className={cn(styles.switcher, size === "header" && styles.header, className)}
      data-u={shown ?? undefined}
      style={{ "--i": Math.max(index, 0) } as React.CSSProperties}
    >
      {shown && (
        // Named inline: a CSS module would hash the view-transition-name.
        // The three labels are stacked: the target's fades in mid-glide
        // (not before the pill moves).
        <span aria-hidden="true" className={styles.indicator} style={{ viewTransitionName: "gp-switch-ind" }}>
          {UNIVERSES.map((u) => (
            <span key={u} className={styles.indLabel} data-on={u === shown ? "" : undefined}>
              {labels[u]}
            </span>
          ))}
        </span>
      )}
      <ul className={styles.track}>
        {UNIVERSES.map((u) => (
          <li key={u} className="flex">
            <Link
              href={UNIVERSE_HREF[u]}
              aria-current={u === current ? "page" : undefined}
              data-on={u === shown ? "" : undefined}
              transitionTypes={switchTypes(current, u)}
              onClick={(e) => {
                if (u === current) return;
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                // With View Transitions the page transition glides the pill
                // (old spot -> new spot). An optimistic CSS glide on top of it
                // got snapshotted mid-way and jumped at the end (10-review M2).
                if (!("startViewTransition" in document)) setPending({ to: u, from: current });
                emitIntent(u, current ?? "home");
              }}
              className={styles.segment}
            >
              {labels[u]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
