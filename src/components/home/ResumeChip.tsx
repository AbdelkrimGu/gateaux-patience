"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { LocaleLink as Link } from "@/i18n/LocaleLink";
import { Icon } from "@/components/ui/Icon";
import { UNIVERSE_HREF, VT_GATE, type Universe } from "@/components/universe/model";
import { emitIntent, readLastVisit, savedTiramisuBoxes } from "@/components/universe/memory";
import styles from "./resume.module.css";

/*
  Returning visitor nicety (07 §3): "Reprendre : Tiramisu, 2 boîtes" when a
  tiramisu basket is waiting, else "Reprendre : Douceurs" for the universe
  last visited. Client-only: the server HTML (and the first client render,
  via the server snapshot) shows the plain subline; the chip then takes the
  same fixed-height slot, so nothing below moves.
*/

interface Resume {
  universe: Universe;
  href: string;
  label: string;
}

export interface ResumeStrings {
  universe: Record<Universe, string>;
  /** boxes[n - 1] = the label for n boxes (1…20). */
  boxes: string[];
}

// Storage is read once per visit of the home page (a stable snapshot for
// React); the cache is dropped when the page unmounts.
let cache: { value: Resume | null } | null = null;

function compute(strings: ResumeStrings): Resume | null {
  const boxes = savedTiramisuBoxes();
  if (boxes > 0) {
    return {
      universe: "tiramisu",
      href: UNIVERSE_HREF.tiramisu,
      label: strings.boxes[Math.min(boxes, strings.boxes.length) - 1],
    };
  }
  const last = readLastVisit();
  return last ? { universe: last.universe, href: last.path, label: strings.universe[last.universe] } : null;
}

const subscribe = () => () => {};

export function ResumeChip({ strings, fallback }: { strings: ResumeStrings; fallback: ReactNode }) {
  const resume = useSyncExternalStore(
    subscribe,
    () => (cache ??= { value: compute(strings) }).value,
    () => null
  );
  useEffect(
    () => () => {
      cache = null;
    },
    []
  );

  if (!resume) return <>{fallback}</>;
  return (
    <Link
      href={resume.href}
      transitionTypes={[VT_GATE]}
      onClick={() => emitIntent(resume.universe, "home")}
      className={styles.chip}
      data-u={resume.universe}
    >
      <span className={styles.dot} aria-hidden="true" />
      <span className="truncate">{resume.label}</span>
      <Icon name="arrow" size={18} className="shrink-0" />
    </Link>
  );
}
