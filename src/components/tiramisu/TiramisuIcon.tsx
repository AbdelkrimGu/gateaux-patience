import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

/*
  Wizard-only glyphs the shared set (src/components/ui/Icon.tsx) doesn't
  have. Same drawing rules (B §9): 24 grid, 2px round strokes, currentColor,
  decorative unless `label` is given. None of these is directional.
  If the shared set grows these names, switch to it and delete this file.
*/

const GLYPHS = {
  plus: ["M12 5v14", "M5 12h14"],
  minus: ["M5 12h14"],
  trash: ["M4.5 7h15", "M9.5 7V5h5v2", "M6.5 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.8-12", "M10 11v5.5", "M14 11v5.5"],
  pencil: ["M15.5 4.5l4 4L9 19H5v-4z", "M13 7l4 4"],
  rotate: ["M5 12a7 7 0 1 0 2.1-5", "M5 4.5V8h3.5"],
  info: ["M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17Z", "M12 11v5", "M12 7.8h.01"],
  alert: ["M12 4l8.5 15h-17z", "M12 10v4", "M12 16.8h.01"],
  bag: ["M5.5 8h13l-1 12h-11z", "M9 8V6.5a3 3 0 0 1 6 0V8"],
  // disclosure chevron (vertical, so it never needs mirroring)
  down: ["M6 9.5l6 6 6-6"],
} as const;

export type TiramisuGlyph = keyof typeof GLYPHS;

export function TIcon({
  name,
  size = 20,
  label,
  className,
  ...rest
}: Omit<SVGProps<SVGSVGElement>, "name"> & { name: TiramisuGlyph; size?: number; label?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      className={cn("shrink-0", className)}
      {...rest}
    >
      {GLYPHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

/** Spinner for the submit button (rotation is CSS; stops under reduced motion). */
export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0 animate-spin", className)}
    >
      <path d="M12 3.5a8.5 8.5 0 1 1-8.5 8.5" />
    </svg>
  );
}
