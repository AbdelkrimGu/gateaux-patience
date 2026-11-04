import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * Admin look ("Crème & velours"): cream table, white paper cards with a gold
 * hairline, cocoa-ink text, raspberry pills for the action, red only for
 * deleting. No hooks here, so server pages can use it too.
 */

export const CARD = "bg-white rounded-2xl border border-gp-gold/25 shadow-gp-card";

// 44px tall everywhere: she taps with one thumb.
const BTN_BASE =
  "inline-flex items-center justify-center gap-2 min-h-11 px-5 rounded-full text-sm font-semibold transition duration-150 ease-gp active:translate-y-px disabled:opacity-50 disabled:pointer-events-none";

export const BTN_PRIMARY = cn(BTN_BASE, "bg-gp-raspberry text-gp-cream shadow-gp-chip hover:bg-gp-raspberry/90");

export const BTN_SECONDARY = cn(
  BTN_BASE,
  "border border-gp-ink/15 bg-white text-gp-ink/85 hover:border-gp-ink/30 hover:bg-gp-cream"
);

export const BTN_GHOST = cn(BTN_BASE, "px-4 text-gp-ink/75 hover:bg-gp-ink/5 hover:text-gp-ink");

export const BTN_DANGER = cn(BTN_BASE, "bg-red-700 text-white hover:bg-red-800");

/** Secondary action that pairs with the raspberry one (AI helpers…): ink pill. */
export const BTN_INK = cn(BTN_BASE, "bg-gp-ink text-gp-cream hover:bg-gp-ink/85");

export const ICON_BUTTON =
  "inline-flex items-center justify-center w-11 h-11 rounded-full text-gp-ink/65 transition duration-150 hover:bg-gp-ink/5 hover:text-gp-ink disabled:opacity-40 disabled:pointer-events-none shrink-0";

export const ICON_BUTTON_DANGER = cn(ICON_BUTTON, "hover:bg-red-50 hover:text-red-700");

export const FIELD =
  "w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-gp-ink/20 bg-white text-base sm:text-sm text-gp-ink placeholder:text-gp-ink/45 outline-none transition focus:border-gp-raspberry focus:ring-4 focus:ring-gp-raspberry/15 disabled:bg-gp-cream disabled:text-gp-ink/65";

export const FIELD_LABEL = "block text-[13px] font-medium text-gp-ink/75 mb-1.5";

/** Title block of every admin page, with the gold doily edge under it. */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-gp-ink/65 mb-1">{eyebrow}</p>
          )}
          <h1 className="text-[1.75rem] md:text-[2.125rem] font-semibold leading-[1.05] tracking-[-0.03em] text-gp-ink">
            {title}
          </h1>
          {subtitle && <p className="mt-1.5 text-sm text-gp-ink/70">{subtitle}</p>}
          <div aria-hidden className="ga-lace w-28 mt-3" />
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export type ChipTone = "success" | "warning" | "neutral" | "accent";

const CHIP_TONES: Record<ChipTone, string> = {
  success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  warning: "bg-amber-50 text-amber-800 ring-amber-200",
  neutral: "bg-gp-ink/5 text-gp-ink/75 ring-gp-ink/10",
  accent: "bg-gp-raspberry/5 text-gp-raspberry ring-gp-raspberry/20",
};

/** Small status pill (Publié, Brouillon, Nouveau…). */
export function StatusChip({ tone, children, className }: { tone: ChipTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        CHIP_TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Empty list: a calm paper card with one way forward. */
export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={cn(CARD, "px-6 py-12 text-center")}>
      <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gp-champagne/70 text-gp-raspberry ring-1 ring-gp-gold/40">
        {icon}
      </span>
      <h2 className="text-lg font-semibold text-gp-ink">{title}</h2>
      {text && <p className="mx-auto mt-1 max-w-sm text-sm text-gp-ink/70">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** On/off switch (a real button, so it works with the keyboard and screen readers). */
export function Switch({
  checked,
  onChange,
  label,
  onClass = "bg-emerald-600",
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  /** Colour when on. */
  onClass?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      // 44px tap area around a 24px track.
      className="relative inline-flex h-11 w-14 shrink-0 items-center justify-center rounded-full"
    >
      <span
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors duration-150",
          checked ? onClass : "bg-gp-ink/45"
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-150 ease-gp",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </span>
    </button>
  );
}
