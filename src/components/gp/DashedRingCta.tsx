import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import WhatsAppIcon from "./WhatsAppIcon";
import HandNote from "./HandNote";
import { cn } from "@/lib/utils";

// Pill heights (px) per size. The ring sits RING_GAP px outside the pill, so
// its corner radius is known without measuring (SVG rx can't be "full").
const HEIGHT = { md: 52, lg: 60 } as const;
const RING_GAP = 7;

export interface DashedRingCtaProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children"> {
  href: string;
  children: React.ReactNode;
  /** "whatsapp" (default for external order links), "arrow", or none. */
  icon?: "whatsapp" | "arrow" | "none";
  size?: "md" | "lg";
  /** External link (WhatsApp…): opens a new tab with rel=noopener. Auto for http(s) hrefs. */
  external?: boolean;
  /** Handwritten reassurance next to the pill (true facts only, ≤ 5 words). */
  note?: React.ReactNode;
  /** Where the note sits: below the pill (phones) / beside it at the inline start or end. */
  notePlacement?: "below" | "start" | "end";
  /** Classes for the wrapper (layout: margins, alignment). */
  className?: string;
  /** Classes for the pill itself. */
  pillClassName?: string;
  /** Visually hidden extra context for screen readers, e.g. "(s'ouvre dans WhatsApp)". */
  srHint?: string;
}

/**
 * The main CTA: a pill in the tone's CTA colours inside a dashed ring that
 * crawls on hover, optionally with a handwritten note. Server-renderable, no JS.
 * Mark the hero one with `data-hero-cta` and the final one's section with
 * `data-final-cta` so the mobile sticky pill knows when to show.
 */
export default function DashedRingCta({
  href,
  children,
  icon,
  size = "lg",
  external,
  note,
  notePlacement = "below",
  className,
  pillClassName,
  srHint,
  ...rest
}: DashedRingCtaProps) {
  const isExternal = external ?? /^https?:\/\//.test(href);
  const resolvedIcon = icon ?? (isExternal ? "whatsapp" : "arrow");
  const h = HEIGHT[size];
  const r = h / 2 + RING_GAP;

  const pill = (
    <span className="relative inline-flex">
      <svg
        aria-hidden="true"
        focusable="false"
        className="gp-ring pointer-events-none absolute overflow-visible text-tone-cta-bg"
        style={{ inset: -RING_GAP, width: `calc(100% + ${RING_GAP * 2}px)`, height: `calc(100% + ${RING_GAP * 2}px)` }}
      >
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          rx={r}
          ry={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span
        className={cn(
          "relative inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-tone-cta-bg px-7 font-semibold text-tone-cta-fg",
          "shadow-gp-chip transition-transform duration-150 ease-gp group-hover:-translate-y-px group-active:scale-[0.97]",
          size === "lg" ? "min-h-[60px] text-[1.0625rem]" : "min-h-[52px] text-[0.9375rem]",
          pillClassName
        )}
      >
        {resolvedIcon === "whatsapp" ? <WhatsAppIcon className="h-5 w-5 shrink-0" /> : null}
        <span>{children}</span>
        {resolvedIcon === "arrow" ? (
          <ArrowRight
            aria-hidden="true"
            className="h-4 w-4 shrink-0 transition-transform duration-200 ease-gp group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
          />
        ) : null}
        {srHint ? <span className="sr-only"> ({srHint})</span> : null}
      </span>
    </span>
  );

  const linkClass = "group inline-flex rounded-full focus-visible:outline-offset-[10px]";
  const link = isExternal ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass} {...rest}>
      {pill}
    </a>
  ) : (
    <Link href={href} className={linkClass} {...rest}>
      {pill}
    </Link>
  );

  if (!note) return <div className={cn("inline-flex", className)}>{link}</div>;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-x-6 gap-y-5",
        notePlacement === "below" ? "flex-col" : "flex-row",
        className
      )}
    >
      {notePlacement === "start" ? (
        <HandNote size="sm" arrow="end" rotate={-6} as="span">
          {note}
        </HandNote>
      ) : null}
      {link}
      {notePlacement !== "start" ? (
        <HandNote size="sm" rotate={-3} arrow={notePlacement === "end" ? "start" : "none"} as="span">
          {note}
        </HandNote>
      ) : null}
    </div>
  );
}
