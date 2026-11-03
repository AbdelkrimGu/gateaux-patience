"use client";

import { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { useMotionValueEvent, useScroll } from "motion/react";
import { useDirSign, useReducedMotionSafe } from "@/components/gp/hooks";
import type { HomePhoto } from "@/lib/home-data";
import { cn } from "@/lib/utils";

/** How far each row travels across the section's scroll, in % of its own width. */
const TRAVEL = 20;

/**
 * 8 · Two rows of photo tiles that drift in opposite directions as the
 * section scrolls past (scroll-linked, never autoplay; mirrored in RTL).
 * Reduced motion: still rows you can swipe.
 */
export default function StripRows({ rows }: { rows: [HomePhoto[], HomePhoto[]] }) {
  const ref = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLUListElement | null)[]>([]);
  const dir = useDirSign();
  const reduced = useReducedMotionSafe();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  // Row 1 travels toward the start, row 2 toward the end. Transform only.
  const paint = useCallback(() => {
    const p = scrollYProgress.get();
    const shifts = [-TRAVEL * p, -TRAVEL * (1 - p)];
    rowRefs.current.forEach((el, r) => {
      if (el) el.style.transform = `translate3d(${(shifts[r] * dir).toFixed(2)}%, 0, 0)`;
    });
  }, [scrollYProgress, dir]);

  // Reduced motion: no scroll writes at all (rows stay put and scroll sideways).
  useMotionValueEvent(scrollYProgress, "change", () => {
    if (!reduced) paint();
  });
  useEffect(() => {
    if (reduced) rowRefs.current.forEach((el) => el && (el.style.transform = ""));
    else paint();
  }, [paint, reduced]);

  return (
    <div ref={ref} className="space-y-3 md:space-y-4">
      {rows.map((row, r) => (
        <div key={r} className="gp-strip-row overflow-hidden">
          <ul
            ref={(el) => {
              rowRefs.current[r] = el;
            }}
            className={cn("flex w-max gap-3 will-change-transform md:gap-4", r === 1 && "ps-[8vw]")}
          >
            {row.map((p, i) => (
              <li
                key={p.src + i}
                className={cn(
                  "relative shrink-0 overflow-hidden rounded-[20px] bg-gp-cream/50 md:rounded-[26px]",
                  r === 0
                    ? "h-[11.5rem] w-[11.5rem] md:h-[20rem] md:w-[20rem]"
                    : "h-[9.5rem] w-[9.5rem] md:h-[15rem] md:w-[15rem]"
                )}
              >
                {/* Fixed intrinsic size: a 1x/2x srcset instead of ~16 widths per tile. */}
                <Image
                  src={p.src}
                  alt={p.alt}
                  width={r === 0 ? 320 : 240}
                  height={r === 0 ? 320 : 240}
                  className="h-full w-full object-cover"
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
