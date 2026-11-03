"use client";

import { useInViewOnce } from "./hooks";
import { cn } from "@/lib/utils";

/**
 * Hand-drawn SVG marks. Every path uses pathLength=1 so it can be drawn with
 * `stroke-dashoffset` (CSS `.gp-draw`) or with motion's `pathLength`.
 * Paths are deliberately a little irregular — they should look drawn by hand.
 */
export const MARKS = {
  /** Long wavy underline (nav active link, key phrases). */
  underline: {
    viewBox: "0 0 300 12",
    paths: ["M2 7 C 40 2, 70 10, 110 6 S 190 3, 230 7 S 280 9, 298 5"],
    stretch: true,
  },
  /** Tighter double-wave squiggle. */
  squiggle: {
    viewBox: "0 0 120 16",
    paths: ["M3 9 C 13 2, 21 2, 29 9 S 45 16, 55 9 S 71 2, 81 9 S 99 16, 117 7"],
    stretch: true,
  },
  /** Curved arrow pointing down-end (towards the inline end, then down). */
  arrow: {
    viewBox: "0 0 64 64",
    paths: ["M8 10 C 30 6, 50 18, 50 44", "M40 36 L 50 46 L 58 34"],
    stretch: false,
  },
  /** Loose hand-drawn ellipse to circle a word. */
  circle: {
    viewBox: "0 0 200 80",
    paths: ["M150 8 C 100 -2, 18 6, 8 36 C 0 62, 70 78, 128 72 C 186 66, 202 36, 176 18 C 160 8, 120 6, 96 10"],
    stretch: true,
  },
  /** Three quick strokes ("///"), the reference's hero accent. */
  ticks: {
    viewBox: "0 0 60 60",
    paths: ["M14 40 L 26 16", "M30 44 L 44 22", "M8 26 L 14 12"],
    stretch: false,
  },
  /** Four-point sparkle. */
  sparkle: {
    viewBox: "0 0 40 40",
    paths: ["M20 4 C 21 14, 26 19, 36 20 C 26 21, 21 26, 20 36 C 19 26, 14 21, 4 20 C 14 19, 19 14, 20 4 Z"],
    stretch: false,
  },
} as const;

export type MarkVariant = keyof typeof MARKS;

export interface SquiggleProps {
  variant?: MarkVariant;
  /** Controlled: draw when true. Omitted → draws itself the first time it scrolls into view. */
  drawn?: boolean;
  /** ms */
  delay?: number;
  /** ms */
  duration?: number;
  strokeWidth?: number;
  /** Mirror horizontally in RTL (arrows). Default true for arrow/ticks. */
  mirrorRtl?: boolean;
  className?: string;
}

/** A hand-drawn mark that draws itself (stroke-dashoffset) once in view. Colour = currentColor. */
export default function Squiggle({
  variant = "underline",
  drawn,
  delay = 0,
  duration = 800,
  strokeWidth = 3,
  mirrorRtl,
  className,
}: SquiggleProps) {
  const [ref, inView] = useInViewOnce<SVGSVGElement>();
  const mark = MARKS[variant];
  const isDrawn = drawn ?? inView;
  const mirror = mirrorRtl ?? (variant === "arrow" || variant === "ticks");
  const step = mark.paths.length > 1 ? duration / mark.paths.length / 2 : 0;

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      focusable="false"
      viewBox={mark.viewBox}
      preserveAspectRatio={mark.stretch ? "none" : "xMidYMid meet"}
      data-drawn={isDrawn}
      className={cn("gp-draw pointer-events-none overflow-visible", mirror && "rtl:-scale-x-100", className)}
      fill="none"
    >
      {mark.paths.map((d, i) => (
        <path
          key={i}
          d={d}
          pathLength={1}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect={mark.stretch ? "non-scaling-stroke" : undefined}
          style={
            {
              "--gp-draw-ms": `${duration}ms`,
              "--gp-draw-delay": `${delay + i * step}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </svg>
  );
}

/**
 * Wraps a word/phrase with a hand-drawn underline that draws in on view.
 * Keep phrases short: the wrapper is inline-block (does not wrap inside).
 */
export function DrawnUnderline({
  children,
  variant = "underline",
  drawn,
  delay = 150,
  className,
  markClassName,
}: {
  children: React.ReactNode;
  variant?: "underline" | "squiggle";
  drawn?: boolean;
  delay?: number;
  className?: string;
  /** Colour/size of the mark, e.g. "text-gp-raspberry". Default: tone accent. */
  markClassName?: string;
}) {
  return (
    <span className={cn("relative inline-block", className)}>
      {children}
      <Squiggle
        variant={variant}
        drawn={drawn}
        delay={delay}
        className={cn(
          "absolute inset-x-0 -bottom-[0.18em] h-[0.32em] w-full text-tone-accent",
          markClassName
        )}
      />
    </span>
  );
}
