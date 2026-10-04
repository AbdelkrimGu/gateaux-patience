import { cn } from "@/lib/utils";
import { WORDMARK } from "./wordmark-paths";

/*
  Brand wordmark (DESIGN.md amendment 5): crown disc + "Gateaux Patience"
  outlined from Dela Gothic One, so it is identical in every locale and the
  Arabic pages never download Dela. Always LTR, never mirrored.

  <Wordmark layout="stacked" />   two lines (mobile header)
  <Wordmark layout="inline" />    one line (desktop header)
  <CrownMark />                    the disc alone (favicon-like uses)
*/

export function CrownMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("shrink-0", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <circle cx="20" cy="20" r="20" fill="#16131D" />
      <path d="M9 26.5h22l1.6-12.2-6.4 5.1L20 10.5l-6.2 8.9-6.4-5.1z" fill="#C4864A" />
      <rect x="9" y="27.8" width="22" height="3.2" rx="1.6" fill="#B8174F" />
      <circle cx="20" cy="9.6" r="2" fill="#B8174F" />
      <circle cx="7.4" cy="13.8" r="1.7" fill="#B8174F" />
      <circle cx="32.6" cy="13.8" r="1.7" fill="#B8174F" />
    </svg>
  );
}

export function WordmarkText({
  layout = "inline",
  className,
}: {
  layout?: "inline" | "stacked";
  className?: string;
}) {
  const v = WORDMARK[layout];
  return (
    <svg
      viewBox={v.viewBox}
      className={cn("block h-auto shrink-0 fill-current", className)}
      aria-hidden="true"
      focusable="false"
    >
      <path d={WORDMARK.line1} />
      <path d={WORDMARK.line2} transform={`translate(${v.line2Dx} ${v.line2Dy})`} />
    </svg>
  );
}

/**
 * Crown + text. The accessible name comes from the surrounding link
 * (aria-label), so the graphics are hidden from assistive tech.
 */
export function Wordmark({
  layout = "inline",
  className,
  textClassName,
}: {
  layout?: "inline" | "stacked";
  className?: string;
  textClassName?: string;
}) {
  return (
    <span dir="ltr" className={cn("inline-flex items-center gap-2.5 text-paillette", className)}>
      <CrownMark className={layout === "stacked" ? "size-[34px]" : "size-10"} />
      <WordmarkText
        layout={layout}
        className={cn(layout === "stacked" ? "w-[90px]" : "w-[200px]", textClassName)}
      />
    </span>
  );
}
