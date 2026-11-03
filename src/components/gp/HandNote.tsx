import Squiggle from "./Squiggle";
import { cn } from "@/lib/utils";

export interface HandNoteProps {
  children: React.ReactNode;
  /** Degrees; keep between −8 and 8. Mirrored automatically in RTL. */
  rotate?: number;
  /** Optional drawn arrow: where it sits relative to the text (logical sides). */
  arrow?: "none" | "start" | "end" | "below-start" | "below-end";
  /** Draw a squiggle under the note. */
  underline?: boolean;
  /** Size: "md" ≈ lead × 1.2 (default), "sm" for tight spots, "lg" for hero. */
  size?: "sm" | "md" | "lg";
  as?: "p" | "span" | "div";
  className?: string;
  /** Decorative notes that repeat nearby text should be hidden from AT. */
  decorative?: boolean;
}

const SIZE = {
  sm: "text-[1.25rem] md:text-[1.4rem]",
  md: "text-[calc(var(--step-lead)*1.2)]",
  lg: "text-[calc(var(--step-lead)*1.45)]",
};

/**
 * Handwritten note (Caveat / Aref Ruqaa) in the tone accent colour, slightly
 * rotated, with an optional hand-drawn arrow or underline. Max one per phone
 * viewport; ≤ 5 words.
 */
export default function HandNote({
  children,
  rotate = -4,
  arrow = "none",
  underline = false,
  size = "md",
  as: Tag = "p",
  className,
  decorative = false,
}: HandNoteProps) {
  const arrowMark =
    arrow !== "none" ? (
      <Squiggle
        variant="arrow"
        delay={200}
        strokeWidth={2.5}
        className={cn(
          "h-[1.3em] w-[1.3em] shrink-0",
          // the path points towards the inline end; flip it for the start side
          (arrow === "start" || arrow === "below-start") && "-scale-x-100 rtl:scale-x-100"
        )}
      />
    ) : null;
  return (
    <Tag
      aria-hidden={decorative || undefined}
      className={cn(
        "relative inline-flex w-max max-w-full items-center gap-1 font-note font-semibold leading-[1.05] text-tone-accent",
        "rotate-[var(--gp-note-rot)] rtl:rotate-[calc(var(--gp-note-rot)*-1)] rtl:leading-[1.5]",
        arrow.startsWith("below") && "flex-col",
        arrow === "below-start" && "items-start",
        arrow === "below-end" && "items-end",
        SIZE[size],
        className
      )}
      style={{ "--gp-note-rot": `${rotate}deg` } as React.CSSProperties}
    >
      {arrow === "start" ? arrowMark : null}
      <span className="relative">
        {children}
        {underline ? (
          <Squiggle
            variant="squiggle"
            delay={250}
            strokeWidth={2.5}
            className="absolute inset-x-0 -bottom-[0.2em] h-[0.3em] w-full"
          />
        ) : null}
      </span>
      {arrow !== "start" ? arrowMark : null}
    </Tag>
  );
}
