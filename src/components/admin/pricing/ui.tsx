"use client";

import { useCallback, useEffect, useRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { AlertTriangle, Check, Loader2, RotateCw, X } from "lucide-react";
import { formatDA } from "@/lib/pricing-units";
import { cn } from "@/lib/utils";
import { numberError } from "./draft";
import { BTN_DANGER, BTN_GHOST, BTN_PRIMARY, BTN_SECONDARY, CARD, ICON_BTN_BASE, INPUT, LABEL } from "../ui";

// Dialogs can stack (a picker over the price-sheet editor, a confirm over
// both): only the topmost one reacts to Escape.
const layers: object[] = [];

function useTopLayer(): () => boolean {
  const token = useRef({});
  useEffect(() => {
    const t = token.current;
    layers.push(t);
    return () => {
      const i = layers.lastIndexOf(t);
      if (i >= 0) layers.splice(i, 1);
    };
  }, []);
  return useCallback(() => layers[layers.length - 1] === token.current, []);
}

// Phone back button / gesture: every open Sheet adds a history entry, so
// "back" closes the topmost sheet (asking first when dirty) instead of leaving
// the page. One global listener, so stacked sheets don't all react.
const backStack: Array<() => void> = [];
let ignorePops = 0; // our own history.back() calls when a sheet closes another way
let popListening = false;

function onPopState() {
  if (ignorePops > 0) {
    ignorePops--;
    return;
  }
  backStack[backStack.length - 1]?.();
}

function useBackButton(onBack: () => void) {
  const onBackRef = useRef(onBack);
  useEffect(() => {
    onBackRef.current = onBack;
  });
  useEffect(() => {
    if (!popListening) {
      window.addEventListener("popstate", onPopState);
      popListening = true;
    }
    let pushed = true;
    let mounted = true;
    // Same URL and state (Next keeps its router data in it): only adds a step.
    window.history.pushState(window.history.state, "");
    const handler = () => {
      pushed = false; // the browser just removed our entry
      onBackRef.current();
      // Still open (asks for confirmation, or refused to close): put the entry
      // back so the next "back" still lands here.
      setTimeout(() => {
        if (mounted && !pushed) {
          window.history.pushState(window.history.state, "");
          pushed = true;
        }
      }, 0);
    };
    backStack.push(handler);
    return () => {
      mounted = false;
      const i = backStack.lastIndexOf(handler);
      if (i >= 0) backStack.splice(i, 1);
      if (pushed) {
        ignorePops++;
        window.history.back();
      }
    };
  }, []);
}

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

// The admin primitives (components/admin/ui.tsx), under the names pricing uses.
export const INPUT_CLASS = INPUT;

export const LABEL_CLASS = LABEL;

export const CARD_CLASS = CARD;

export const PRIMARY_BTN = BTN_PRIMARY;

export const SECONDARY_BTN = BTN_SECONDARY;

export const ICON_BTN = ICON_BTN_BASE;

/** Empty states, same look as EmptyState in components/admin/ui.tsx. */
export const EMPTY_ICON =
  "mx-auto mb-3 w-14 h-14 rounded-full bg-gp-champagne/70 ring-1 ring-gp-gold/50 text-gp-ink/75 flex items-center justify-center";
export const EMPTY_TITLE = "font-display text-lg font-semibold tracking-[-0.02em] text-gp-ink";

/** Action inside an amber banner (« Mettre à jour », « Appliquer… »): white on amber-700 is 5:1. */
export const AMBER_BTN =
  "mt-2 inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-full bg-amber-700 text-white text-sm font-semibold hover:bg-amber-800 transition-colors duration-150";

export function FieldError({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-xs font-medium text-red-700 mt-1", className)}>{children}</p>;
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
            missing && !message && "border-amber-500 bg-amber-50/70",
            message && "border-red-600 bg-red-50/50 focus:border-red-600 focus:ring-red-600/20",
            inputClassName
          )}
          {...rest}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gp-ink/65">
            {suffix}
          </span>
        )}
      </div>
      {showError && message && <FieldError>{message}</FieldError>}
    </div>
  );
}

/**
 * Bottom sheet on phones, centered modal from `sm` up. With `dirty`, a stray
 * tap on the backdrop (or Escape) asks before throwing her typing away.
 * `size="full"`: almost full height on phones, a wide panel on computers.
 * `guardCloseButton`: the X asks too (big editors, where X is easy to hit).
 */
export function Sheet({
  title,
  onClose,
  children,
  footer,
  dirty = false,
  size = "default",
  guardCloseButton = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  dirty?: boolean;
  size?: "default" | "full";
  guardCloseButton?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const softClose = useCallback(() => (dirty ? setConfirming(true) : onClose()), [dirty, onClose]);
  const isTop = useTopLayer();
  useBackButton(() => {
    if (!confirming) softClose();
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !confirming && isTop()) softClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [softClose, confirming, isTop]);

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-gp-ink/60 sm:p-4 motion-safe:animate-gpa-fade"
        onClick={softClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "bg-gp-paper text-gp-ink w-full rounded-t-[24px] sm:rounded-[24px] shadow-[0_-12px_40px_-12px_rgb(var(--gp-ink)/0.45)] flex flex-col",
            size === "full" ? "h-[94dvh] sm:h-[90vh] sm:max-w-4xl" : "max-h-[90vh] sm:max-w-lg"
          )}
        >
          <div className="flex items-center justify-between gap-3 pl-5 pr-2 py-2 border-b border-gp-ink/10 shrink-0">
            <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-gp-ink">{title}</h2>
            <button
              type="button"
              onClick={guardCloseButton ? softClose : onClose}
              className={cn(ICON_BTN, "hover:bg-gp-ink/[0.07] hover:text-gp-ink")}
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>
          <div className="overflow-y-auto overscroll-contain flex-1 min-h-0">{children}</div>
          {footer && (
            <div className="shrink-0 border-t border-gp-ink/10 bg-gp-cream/60 sm:rounded-b-[24px] px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {footer}
            </div>
          )}
        </div>
      </div>
      {/* Sibling, not child: clicks in the dialog must not reach the backdrop. */}
      {confirming && (
        <ConfirmDialog
          title="Abandonner les modifications ?"
          confirmLabel="Abandonner"
          cancelLabel="Continuer"
          onConfirm={() => {
            setConfirming(false);
            onClose();
          }}
          onCancel={() => setConfirming(false)}
        >
          <p>Ce que vous venez de saisir ne sera pas enregistré.</p>
        </ConfirmDialog>
      )}
    </>
  );
}

/** Same look as the delete dialog in CategoriesManager. */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  cancelLabel = "Annuler",
  tone = "danger",
  loading = false,
  onConfirm,
  onCancel,
  extraAction,
}: {
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** A third choice between cancel and confirm (« Enregistrer d'abord »). */
  extraAction?: { label: string; onClick: () => void };
}) {
  useTopLayer(); // so the sheet underneath ignores Escape while this is open
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gp-ink/60 p-4 motion-safe:animate-gpa-fade">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="bg-gp-paper text-gp-ink rounded-[24px] shadow-[0_24px_60px_-20px_rgb(var(--gp-ink)/0.6)] max-w-sm w-full p-6"
      >
        <div className="flex items-start gap-3 mb-5">
          <div
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center shrink-0",
              tone === "danger" ? "bg-red-50 text-red-700 ring-1 ring-red-200" : "bg-gp-champagne text-gp-ink ring-1 ring-gp-gold/50"
            )}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold leading-tight tracking-[-0.02em] text-gp-ink">{title}</h2>
            {children && <div className="text-sm text-gp-ink/75 mt-1.5 space-y-2">{children}</div>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className={BTN_GHOST}
          >
            {cancelLabel}
          </button>
          {extraAction && (
            <button
              type="button"
              onClick={extraAction.onClick}
              disabled={loading}
              className={BTN_SECONDARY}
            >
              {extraAction.label}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              tone === "danger" ? BTN_DANGER : BTN_PRIMARY
            )}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SectionHeader({ title, subtitle, total }: { title: string; subtitle: string; total?: number }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-2">
      <div className="min-w-0">
        <h2 className="font-display text-[17px] font-semibold tracking-[-0.02em] text-gp-ink">{title}</h2>
        <p className="text-xs text-gp-ink/70 mt-0.5">{subtitle}</p>
      </div>
      {total !== undefined && (
        <span className="text-sm font-semibold text-gp-ink tabular-nums whitespace-nowrap pt-0.5">{formatDA(total)}</span>
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
        tone === "rose" && "bg-gp-raspberry/[0.06] border-gp-raspberry/25 text-gp-ink [&_svg]:text-gp-raspberry",
        tone === "gray" && "bg-gp-paper border-gp-ink/10 text-gp-ink/90"
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
        "flex items-start gap-3 rounded-2xl border-2 p-3 text-left transition-colors duration-150",
        selected ? "border-gp-raspberry bg-gp-raspberry/[0.05]" : "border-gp-ink/15 bg-gp-paper hover:border-gp-ink/30"
      )}
    >
      <span
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
          selected ? "bg-gp-raspberry text-gp-cream" : "bg-gp-ink/[0.06] text-gp-ink/70"
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
        "w-[22px] h-[22px] rounded-md border-2 flex items-center justify-center shrink-0 transition-colors duration-150",
        checked ? "bg-gp-raspberry border-gp-raspberry text-gp-cream" : "border-gp-ink/45 bg-gp-paper"
      )}
    >
      {checked && <Check size={13} strokeWidth={3} />}
    </span>
  );
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-2xl px-4 py-3">
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
            className="mt-2 inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-full bg-gp-paper border border-red-300 text-red-800 text-sm font-medium hover:bg-red-50 transition-colors"
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
          className="mt-2 inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-full bg-gp-paper border border-red-300 text-red-800 text-sm font-medium hover:bg-red-50 transition-colors"
        >
          <RotateCw size={14} /> Recharger
        </button>
      )}
    </ErrorBox>
  );
}
