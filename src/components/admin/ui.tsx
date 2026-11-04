import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

// Admin look ("Soirée royale", working register). Ink shell + gold accents for
// navigation and mastheads; cream paper for the work. Raspberry marks what is
// selected or active; red is kept for deleting only, so it never looks like
// the main action. Every control is at least 44px tall for her thumb.

/** Main action on paper: cocoa-ink pill (16:1 on paper). */
export const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2 rounded-full bg-gp-ink text-gp-cream text-sm font-semibold hover:bg-gp-ink/85 active:bg-gp-ink/80 disabled:opacity-45 disabled:cursor-not-allowed transition-colors duration-150 shadow-[0_8px_18px_-12px_rgb(var(--gp-ink)/0.6)]";

/** Main action on the ink shell: gold pill with ink text (6.5:1). */
export const BTN_GOLD =
  "inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2 rounded-full bg-gp-gold text-gp-ink text-sm font-semibold hover:bg-gp-champagne active:bg-gp-champagne/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150";

export const BTN_SECONDARY =
  "inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2 rounded-full border border-gp-ink/25 bg-gp-paper text-gp-ink text-sm font-medium hover:border-gp-ink/45 hover:bg-gp-cream disabled:opacity-45 disabled:cursor-not-allowed transition-colors duration-150";

export const BTN_GHOST =
  "inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-full text-gp-ink/80 text-sm font-medium hover:bg-gp-ink/[0.06] hover:text-gp-ink disabled:opacity-45 transition-colors duration-150";

/** Delete, only inside a confirmation. */
export const BTN_DANGER =
  "inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2 rounded-full bg-red-700 text-white text-sm font-semibold hover:bg-red-800 disabled:opacity-50 transition-colors duration-150";

/** Square icon button (edit, remove…). Colour of the hover is added per use. */
export const ICON_BTN_BASE =
  "inline-flex items-center justify-center w-11 h-11 rounded-full text-gp-ink/65 transition-colors duration-150 disabled:opacity-40 shrink-0";

// text-base on phones: iOS zooms the page when focusing an input under 16px.
// Border at ink/45 so the field's edge reads at 3:1 on paper.
export const INPUT =
  "w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-gp-ink/45 bg-gp-paper text-base sm:text-sm text-gp-ink placeholder:text-gp-ink/45 focus:border-gp-raspberry focus:ring-2 focus:ring-gp-raspberry/20 outline-none transition-colors duration-150 disabled:bg-gp-ink/[0.04] disabled:text-gp-ink/50 disabled:border-gp-ink/20";

export const LABEL = "block text-[13px] font-medium text-gp-ink/80 mb-1.5";

export const CARD =
  "bg-gp-paper rounded-2xl border border-gp-ink/10 shadow-[0_14px_30px_-24px_rgb(var(--gp-ink)/0.45)]";

/** AI helpers (translate, describe): champagne with a gold edge, apart from the main action. */
export const BTN_AI =
  "inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-1.5 rounded-full bg-gp-champagne text-gp-ink text-[13px] font-semibold ring-1 ring-inset ring-gp-gold/70 hover:bg-gp-champagne/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150";

/** Title of a card on paper. */
export const SECTION_TITLE = "block font-display text-[17px] font-semibold tracking-[-0.02em] text-gp-ink mb-3";

/** Small caps line above a title (eyebrow). */
export const EYEBROW = "text-[11px] font-semibold uppercase tracking-[0.16em]";

/**
 * Ink masthead at the top of each page: it continues the ink top bar, then a
 * cream "sheet" with rounded corners rises over its bottom edge. Sits first in
 * AdminShell's <main> and bleeds over its padding.
 */
export function PageHeader({
  title,
  eyebrow,
  subtitle,
  actions,
  width = "5xl",
}: {
  title: ReactNode;
  eyebrow?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  width?: "4xl" | "5xl";
}) {
  return (
    <div data-surface="ink" className="-mx-4 md:-mx-8 mb-5 md:mb-7 px-4 md:px-8 bg-gp-ink text-gp-cream">
      <div
        className={cn(
          "mx-auto pt-3 md:pt-10 pb-11 md:pb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
          width === "4xl" ? "max-w-4xl" : "max-w-5xl"
        )}
      >
        <div className="min-w-0">
          {eyebrow && <p className={cn(EYEBROW, "text-gp-gold mb-1.5")}>{eyebrow}</p>}
          <h1 className="font-display text-[28px] md:text-[36px] font-semibold leading-[1.02] tracking-[-0.03em] text-gp-cream">
            {title}
          </h1>
          {subtitle && <p className="mt-2 text-sm text-gp-cream/75 max-w-[60ch]">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {/* The paper sheet's top edge. */}
      <div aria-hidden className="relative top-px h-7 -mt-7 -mx-4 md:-mx-8 rounded-t-[28px] bg-gp-cream" />
    </div>
  );
}

/** "← Gâteaux" in a masthead's eyebrow slot. */
export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 -my-3 py-3 pr-2 text-gp-gold hover:text-gp-champagne transition-colors"
    >
      <ChevronLeft size={14} strokeWidth={2.5} />
      {children}
    </Link>
  );
}

export type PillTone = "new" | "seen" | "done" | "published" | "draft" | "featured";

const PILL_TONES: Record<PillTone, string> = {
  new: "bg-emerald-100 text-emerald-800",
  seen: "bg-amber-100 text-amber-800",
  done: "bg-gp-ink/[0.07] text-gp-ink/75",
  published: "bg-emerald-100 text-emerald-800",
  draft: "bg-gp-ink/[0.07] text-gp-ink/75",
  featured: "bg-gp-champagne text-gp-ink",
};

export function StatusPill({ tone, children, className }: { tone: PillTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap",
        PILL_TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Nothing here yet: a calm card with one way forward. */
export function EmptyState({
  icon,
  title,
  children,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(CARD, "px-6 py-12 text-center", className)}>
      <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-gp-champagne/70 ring-1 ring-gp-gold/50 text-gp-ink/75 flex items-center justify-center">
        {icon}
      </div>
      <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-gp-ink">{title}</h2>
      {children && <p className="text-sm text-gp-ink/70 mt-1 max-w-[42ch] mx-auto">{children}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

/**
 * On/off switch. A real button with role="switch" so it works with the
 * keyboard and screen readers; the visible label sits next to it.
 */
export function Switch({
  checked,
  onChange,
  label,
  tone = "raspberry",
  id,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  tone?: "raspberry" | "emerald";
  id?: string;
}) {
  const on = tone === "emerald" ? "bg-emerald-600" : "bg-gp-raspberry";
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative inline-flex items-center justify-center w-14 h-11 shrink-0 rounded-full"
    >
      <span
        aria-hidden
        className={cn(
          "relative block w-12 h-7 rounded-full transition-colors duration-150",
          checked ? on : "bg-gp-ink/30"
        )}
      >
        <span
          className={cn(
            "absolute top-1 left-1 w-5 h-5 rounded-full bg-gp-paper shadow-[0_2px_4px_rgb(var(--gp-ink)/0.3)] transition-transform duration-150",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </span>
    </button>
  );
}
