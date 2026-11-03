"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useReveal } from "./useReveal";

export interface FanDeckCategory {
  slug: string;
  label: string;
  countLabel: string;
  href: string;
  photos: { src: string; alt: string; href: string; sensitive: boolean }[];
}

// Fixed poses (never random: server and client must agree).
const ROT = [-9, -4.5, 0.5, 4, 8.5];
const Y = [30, 9, 0, 10, 32];

/**
 * 3 · "Fan of photos": five cream-bordered prints dealt from the deck when the
 * section enters, re-dealt when another category pill is chosen. Each print
 * opens its cake page.
 */
export default function FanDeck({
  categories,
  defaultSlug,
  pillsLabel,
  seeLabel,
  seeAria,
}: {
  categories: FanDeckCategory[];
  defaultSlug: string;
  pillsLabel: string;
  seeLabel: string;
  /** Per category: accessible name of the gallery link. */
  seeAria: Record<string, string>;
}) {
  const [active, setActive] = useState(defaultSlug);
  const [switched, setSwitched] = useState(0);
  const [stageRef, reveal] = useReveal<HTMLDivElement>({ threshold: 0.3 });
  const cat = categories.find((c) => c.slug === active) ?? categories[0];
  // Best photo on top in the centre, the next ones fanned out on both sides.
  const best = cat.photos.slice(0, 5);
  const m = best.length;
  const c = (m - 1) / 2;
  const byCloseness = Array.from({ length: m }, (_, i) => i).sort(
    (a, b) => Math.abs(a - c) - Math.abs(b - c) || a - b
  );
  const photos = Array.from({ length: m }, (_, pos) => best[byCloseness.indexOf(pos)]);
  // Deal order: clean prints from the back to the front, licensed ones last.
  const dealOrder = Array.from({ length: m }, (_, pos) => pos).sort(
    (a, b) =>
      Number(photos[a].sensitive) - Number(photos[b].sensitive) ||
      byCloseness.indexOf(b) - byCloseness.indexOf(a)
  );
  const mode = switched ? "in" : reveal;

  return (
    <>
      <div
        ref={stageRef}
        data-reveal={mode}
        className="hv2-fan relative mx-auto mt-10 w-full md:mt-14"
      >
        <ul key={`${cat.slug}-${switched}`} className="contents">
          {photos.map((p, j) => {
            const slot = m === 5 ? j : j + Math.round((5 - m) / 2);
            const depth = byCloseness.indexOf(j); // 0 = on top
            return (
              <li
                key={p.src}
                className="hv2-fan-card"
                style={
                  {
                    "--k": j - c,
                    "--j": dealOrder.indexOf(j),
                    "--r": `${ROT[slot]}deg`,
                    "--y": `${Y[slot]}px`,
                    zIndex: m - depth,
                  } as React.CSSProperties
                }
              >
                <Link
                  href={p.href}
                  className="group block rounded-[18px] bg-gp-cream p-1.5 shadow-[0_24px_44px_-22px_rgb(var(--gp-ink)/0.5)] md:p-2.5"
                >
                  <span className="relative block aspect-[4/5] overflow-hidden rounded-[12px] bg-gp-champagne/60">
                    <Image
                      src={p.src}
                      alt={p.alt}
                      fill
                      sizes="(min-width: 1024px) 300px, (min-width: 768px) 26vw, 44vw"
                      className="object-cover transition-transform duration-500 ease-gp group-hover:scale-[1.04]"
                      style={{ objectPosition: "50% 42%" }}
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-10 flex flex-col items-center gap-6 md:mt-14">
        <div role="group" aria-label={pillsLabel} className="flex flex-wrap justify-center gap-2">
          {categories.map((c) => {
            const on = c.slug === cat.slug;
            return (
              <button
                key={c.slug}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  if (on) return;
                  setActive(c.slug);
                  setSwitched((v) => v + 1);
                }}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-step-small font-medium transition-colors duration-150 ease-gp",
                  on
                    ? "bg-gp-ink text-gp-cream"
                    : "text-gp-ink ring-1 ring-inset ring-gp-ink/20 hover:bg-gp-ink/[0.06]"
                )}
              >
                {c.label}
                <span className={cn("tabular text-[0.8em]", on ? "text-gp-cream/80" : "text-gp-ink/70")}>
                  {c.countLabel}
                </span>
              </button>
            );
          })}
        </div>
        <Link
          href={cat.href}
          aria-label={seeAria[cat.slug]}
          className="group inline-flex min-h-11 items-center gap-2 px-1 text-[0.9375rem] font-semibold text-gp-raspberry underline decoration-gp-raspberry/30 underline-offset-[6px] transition-colors hover:decoration-gp-raspberry"
        >
          {seeLabel}
          <ArrowRight
            aria-hidden="true"
            className="h-4 w-4 transition-transform duration-200 ease-gp group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
          />
        </Link>
      </div>
    </>
  );
}
