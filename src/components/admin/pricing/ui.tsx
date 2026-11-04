"use client";

import { useCallback, useEffect, useRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { AlertTriangle, Check, Loader2, RotateCw, X } from "lucide-react";
import { formatDA } from "@/lib/pricing-units";
import { cn } from "@/lib/utils";
import { numberError } from "./draft";
import { BTN_DANGER, BTN_GHOST, BTN_PRIMARY, BTN_SECONDARY, CARD } from "../ui";

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

// text-base on phones: iOS zooms the page when focusing an input under 16px.
export const INPUT_CLASS =
  "w-full min-h-11 px-3 py-2.5 rounded-xl border border-gp-ink/20 bg-white focus:border-gp-raspberry focus:ring-4 focus:ring-gp-raspberry/15 outline-none transition text-base sm:text-sm text-gp-ink placeholder:text-gp-ink/45 disabled:bg-gp-cream disabled:text-gp-ink/65";

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
        // !m-0: a parent's space-y-* margin would shift a fixed overlay down.
        className="fixed inset-0 !m-0 z-50 flex items-end sm:items-center justify-center bg-gp-ink/50 sm:p-4"
        onClick={softClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "bg-white w-full rounded-t-3xl sm:rounded-3xl shadow-gp-lifted flex flex-col overflow-hidden",
            size === "full" ? "h-[94dvh] sm:h-[90vh] sm:max-w-4xl" : "max-h-[90vh] sm:max-w-lg"
          )}
        >
          <div className="flex items-center justify-between gap-3 pl-5 pr-2 py-2 border-b border-gp-gold/30 bg-gp-cream shrink-0">
            <h2 className="text-lg font-semibold leading-tight text-gp-ink">{title}</h2>
            <button
              type="button"
              onClick={guardCloseButton ? softClose : onClose}
              className={cn(ICON_BTN, "text-gp-ink/70 hover:bg-gp-ink/5 hover:text-gp-ink")}
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>
          <div className="overflow-y-auto overscroll-contain flex-1 min-h-0">{children}</div>
          {footer && (
            <div className="shrink-0 border-t border-gp-gold/25 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
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
    <div className="fixed inset-0 !m-0 z-[60] flex items-center justify-center bg-gp-ink/50 p-4">
      <div role="alertdialog" aria-modal="true" aria-label={title} className="bg-gp-cream rounded-3xl shadow-gp-lifted max-w-sm w-full p-6">
        <div className="flex items-start gap-3 mb-5">
          <div
            className={cn(
              "w-11 h-11 rounded-full ring-1 flex items-center justify-center shrink-0",
              tone === "danger" ? "bg-red-50 text-red-700 ring-red-200" : "bg-amber-50 text-amber-700 ring-amber-200"
            )}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold leading-tight text-gp-ink">{title}</h2>
            {children && <div className="text-sm text-gp-ink/75 mt-1.5 space-y-2">{children}</div>}
          </div>
        </div>
        {/* Phones: stacked, full width, the confirm button nearest the thumb. */}
        <div className="flex flex-col-reverse sm:flex-row sm:flex-wrap gap-2 sm:justify-end">
          <button type="button" onClick={onCancel} disabled={loading} className={BTN_GHOST}>
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
            className={tone === "danger" ? BTN_DANGER : BTN_PRIMARY}
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
