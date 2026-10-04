"use client";

import { usePathname } from "next/navigation";
import { stripLocale } from "@/i18n/paths";
import { cn } from "@/lib/utils";
import { universeOfPath, type Universe } from "./model";
import { UniverseSwitcher } from "./UniverseSwitcher";
import styles from "./universe.module.css";

/*
  The phone home of the switcher (07 §4.1): a slim strip under the header
  that sticks to the top of the screen on universe pages. The header above
  it scrolls away; the strip (52px) stays, so "Gâteaux | Douceurs |
  Tiramisu" is one tap away at any scroll depth, and the bottom of the
  screen stays the WhatsApp order bar's. Not rendered on the home page (the
  gate IS the switcher there) nor on pages outside the three universes.
  Hidden ≥900px: the desktop header carries its own copy.
*/

export function UniverseBar({ labels, label }: { labels: Record<Universe, string>; label: string }) {
  const current = universeOfPath(stripLocale(usePathname()));
  if (!current) return null;
  return <UniverseStrip current={current} labels={labels} label={label} />;
}

/**
 * The strip itself (phones only, hidden ≥900px). Also used by the tiramisu
 * wizard's first step, at the same height on screen: both carry the
 * `gp-switch-bar` view-transition name, so moving between /galerie and
 * /tiramisu the strip stays put and only the indicator glides.
 */
export function UniverseStrip({
  current,
  labels,
  label,
  className,
}: {
  current: Universe;
  labels: Record<Universe, string>;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn(styles.bar, className)}>
      <UniverseSwitcher current={current} labels={labels} label={label} />
    </div>
  );
}

/** Desktop header copy: same control, current from the URL (none on the home page). */
export function HeaderSwitcher({ labels, label }: { labels: Record<Universe, string>; label: string }) {
  const current = universeOfPath(stripLocale(usePathname()));
  return <UniverseSwitcher current={current} labels={labels} label={label} size="header" />;
}
