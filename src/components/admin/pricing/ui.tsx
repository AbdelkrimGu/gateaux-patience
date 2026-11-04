"use client";

import { useEffect, type InputHTMLAttributes, type ReactNode } from "react";
import { Check, RotateCw } from "lucide-react";
import { formatDA } from "@/lib/pricing-units";
import { cn } from "@/lib/utils";
import { numberError } from "./draft";
import { BTN_PRIMARY, BTN_SECONDARY, CARD } from "../ui";

// Set when she leaves on purpose from a button of ours (« Recharger »,
// « Se reconnecter »): her drafts are kept on the phone, no browser warning.
let leavingOnPurpose = false;

export function leaveOnPurpose() {
  leavingOnPurpose = true;
}

/** Browser warning before reload / closing the tab while `active`. */
export function useBeforeUnload(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (leavingOnPurpose) return;
      e.preventDefault();
      e.returnValue = ""; // older browsers need it to show the dialog
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [active]);
}

// text-base up to lg: iOS (phones, iPad, landscape) zooms on a field under 16px.
export const INPUT_CLASS =
  "w-full min-h-11 px-3 py-2.5 rounded-xl border border-gp-ink/20 bg-white focus:border-gp-raspberry focus:ring-4 focus:ring-gp-raspberry/15 outline-none transition text-base lg:text-sm text-gp-ink placeholder:text-gp-ink/45 disabled:bg-gp-cream disabled:text-gp-ink/65";

export const LABEL_CLASS = "block text-[13px] font-medium text-gp-ink/75 mb-1";

// The pricing screens share the admin look (components/admin/ui.tsx).
export const CARD_CLASS = CARD;

export const PRIMARY_BTN = BTN_PRIMARY;

export const SECONDARY_BTN = BTN_SECONDARY;

export const ICON_BTN =
  "inline-flex items-center justify-center w-11 h-11 rounded-full text-gp-ink/65 transition disabled:opacity-40 shrink-0";

export function FieldError({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-xs text-red-700 mt-1", className)}>{children}</p>;
}

/**
 * Decimal text input: keeps whatever she types ("1,5", "1 250") and lets the
 * caller parse it. Outlined red with a short message under it when it can't
 * be read (`error` overrides the default number check; `showError={false}`
 * when the row prints the message itself). `missing`: required but empty.
 */
export function DecimalInput({
  value,
  onChange,
  suffix,
  className,
  inputClassName,
  error,
  showError = true,
  missing = false,
  ...rest
}: {
  value: string;
  onChange: (raw: string) => void;
  suffix?: string;
  className?: string;
  inputClassName?: string;
  error?: string | null;
  showError?: boolean;
  missing?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "className">) {
  const message = error === undefined ? numberError(value) : error;
  return (
    <div className={className}>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={message ? true : undefined}
          data-missing={missing && !message ? "true" : undefined}
          className={cn(
            INPUT_CLASS,
            "tabular-nums",
            suffix && "pr-10",
            missing && !message && "border-amber-400 bg-amber-50/50",
            message && "border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-100",
            inputClassName
          )}
          {...rest}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gp-ink/65">
            {suffix}
          </span>
        )}
      </div>
      {showError && message && <FieldError>{message}</FieldError>}
    </div>
  );
}

// The dialogs live with the rest of the admin look; pricing screens import them from here.
export { ConfirmDialog, Sheet } from "../dialogs";

export function SectionHeader({ title, subtitle, total }: { title: string; subtitle: string; total?: number }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-2">
      <div className="min-w-0">
        <h2 className="text-[17px] font-semibold leading-tight text-gp-ink">{title}</h2>
        <p className="text-xs text-gp-ink/70 mt-1">{subtitle}</p>
      </div>
      {total !== undefined && (
        <span className="text-sm font-semibold text-gp-ink/85 tabular-nums whitespace-nowrap pt-0.5">{formatDA(total)}</span>
      )}
    </div>
  );
}

export function EmptyHint({ children }: { children: ReactNode }) {
  return <p className="px-4 pb-4 text-sm text-gp-ink/65">{children}</p>;
}

export function Banner({
  tone,
  icon,
  children,
}: {
  tone: "amber" | "rose" | "gray";
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm",
        tone === "amber" && "bg-amber-50 border-amber-200 text-amber-800",
        tone === "rose" && "bg-gp-raspberry/5 border-gp-raspberry/25 text-gp-raspberry",
        tone === "gray" && "bg-white border-gp-gold/25 text-gp-ink/85 shadow-gp-card"
      )}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** Big tappable radio option (cost type, new size content…). */
export function ChoiceCard({
  selected,
  onClick,
  icon,
  title,
  text,
}: {
  selected: boolean;
  onClick: () => void;
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-2xl border-2 p-3 text-left transition",
        selected ? "border-gp-raspberry bg-gp-raspberry/5" : "border-gp-gold/30 bg-white hover:border-gp-ink/25"
      )}
    >
      <span
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
          selected ? "bg-gp-raspberry text-gp-cream" : "bg-gp-champagne/70 text-gp-ink/75"
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-gp-ink">{title}</span>
        <span className="block text-xs text-gp-ink/70 mt-0.5">{text}</span>
      </span>
    </button>
  );
}

/** Square checkbox look shared by the fixed-cost rows and the size dialogs. */
export function CheckMark({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition",
        checked ? "bg-gp-raspberry border-gp-raspberry text-white" : "border-gp-ink/50 bg-white"
      )}
    >
      {checked && <Check size={13} strokeWidth={3} />}
    </span>
  );
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
      {children}
    </div>
  );
}

/**
 * Server error; a conflict (edited in another tab / on the laptop) gets a
 * reload button — the page state comes from the server render, so a full
 * reload is what brings the fresh data in (the calculation draft survives it).
 * An expired session gets a link to log in again (drafts are kept locally).
 */
export function ApiErrorBox({ error }: { error: { text: string; conflict: boolean; expired?: boolean } }) {
  return (
    <ErrorBox>
      <p>{error.text}</p>
      {error.expired && (
        <>
          <p className="text-xs mt-1">Ce que vous avez saisi est gardé sur ce téléphone : vous le retrouverez après.</p>
          <a
            href="/admin/login"
            onClick={leaveOnPurpose}
            className="mt-2 inline-flex items-center gap-1.5 min-h-11 px-4 rounded-full bg-white border border-red-200 text-red-700 text-sm font-medium hover:bg-red-50 transition"
          >
            Se reconnecter
          </a>
        </>
      )}
      {error.conflict && (
        <button
          type="button"
          onClick={() => {
            leaveOnPurpose();
            window.location.reload();
          }}
          className="mt-2 inline-flex items-center gap-1.5 min-h-11 px-4 rounded-full bg-white border border-red-200 text-red-700 text-sm font-medium hover:bg-red-50 transition"
        >
          <RotateCw size={14} /> Recharger
        </button>
      )}
    </ErrorBox>
  );
}
