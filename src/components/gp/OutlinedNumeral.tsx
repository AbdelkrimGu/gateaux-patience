import { cn } from "@/lib/utils";

/**
 * Big outlined step number ("01"…) in display type. Stroke defaults to
 * raspberry; pass `stroke="gold"` / "cream" on dark sections where raspberry is too dark.
 */
export default function OutlinedNumeral({
  value,
  stroke = "raspberry",
  pad = 2,
  className,
}: {
  value: number;
  stroke?: "raspberry" | "gold" | "cream" | "champagne";
  pad?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      dir="ltr"
      className={cn("gp-outline-num inline-block font-display font-bold leading-none", className)}
      style={{ "--gp-numeral": `var(--gp-${stroke})` } as React.CSSProperties}
    >
      {String(value).padStart(pad, "0")}
    </span>
  );
}
