"use client";

import { useCallback, useEffect, useRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { AlertTriangle, Check, Loader2, RotateCw, X } from "lucide-react";
import { formatDA } from "@/lib/pricing-units";
import { cn } from "@/lib/utils";
import { numberError } from "./draft";

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
  "w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-base sm:text-sm text-gray-800 placeholder:text-gray-300 disabled:bg-gray-50 disabled:text-gray-400";

export const LABEL_CLASS = "block text-xs font-medium text-gray-500 mb-1";

export const CARD_CLASS = "bg-white rounded-2xl border border-gray-100 shadow-sm";

export const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-2 min-h-[40px] px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 disabled:opacity-50 transition shadow-sm";

export const SECONDARY_BTN =
  "inline-flex items-center justify-center gap-2 min-h-[40px] px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition";

export const ICON_BTN =
  "inline-flex items-center justify-center w-10 h-10 rounded-lg text-gray-400 transition disabled:opacity-40 shrink-0";

export function FieldError({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-xs text-red-600 mt-1", className)}>{children}</p>;
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
            missing && !message && "border-amber-300",
            message && "border-red-300 focus:border-red-400 focus:ring-red-100",
            inputClassName
          )}
          {...rest}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
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
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:p-4"
        onClick={softClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "bg-white w-full rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col",
            size === "full" ? "h-[94dvh] sm:h-[90vh] sm:max-w-4xl" : "max-h-[90vh] sm:max-w-lg"
          )}
        >
          <div className="flex items-center justify-between gap-3 pl-5 pr-2 py-2 border-b border-gray-100 shrink-0">
            <h2 className="font-semibold text-gray-800">{title}</h2>
            <button
              type="button"
              onClick={guardCloseButton ? softClose : onClose}
              className={cn(ICON_BTN, "hover:bg-gray-100 hover:text-gray-600")}
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>
          <div className="overflow-y-auto overscroll-contain flex-1 min-h-0">{children}</div>
          {footer && (
            <div className="shrink-0 border-t border-gray-100 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div role="alertdialog" aria-modal="true" className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
        <div className="flex items-start gap-3 mb-5">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              tone === "danger" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-500"
            )}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">{title}</h2>
            {children && <div className="text-sm text-gray-500 mt-1 space-y-2">{children}</div>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="min-h-[40px] px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
          >
            {cancelLabel}
          </button>
          {extraAction && (
            <button
              type="button"
              onClick={extraAction.onClick}
              disabled={loading}
              className="min-h-[40px] px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              {extraAction.label}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition",
              tone === "danger" ? "bg-red-500 hover:bg-red-600" : "bg-rose-500 hover:bg-rose-600"
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
        <h2 className="font-semibold text-gray-800">{title}</h2>
        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
      </div>
      {total !== undefined && (
        <span className="text-sm font-semibold text-gray-700 tabular-nums whitespace-nowrap pt-0.5">{formatDA(total)}</span>
      )}
    </div>
  );
}

export function EmptyHint({ children }: { children: ReactNode }) {
  return <p className="px-4 pb-4 text-sm text-gray-400">{children}</p>;
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
        tone === "rose" && "bg-rose-50 border-rose-200 text-rose-800",
        tone === "gray" && "bg-white border-gray-100 text-gray-700 shadow-sm"
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
        "flex items-start gap-3 rounded-xl border-2 p-3 text-left transition",
        selected ? "border-rose-400 bg-rose-50" : "border-gray-100 hover:border-gray-200"
      )}
    >
      <span
        className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
          selected ? "bg-rose-500 text-white" : "bg-gray-100 text-gray-500"
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-gray-800">{title}</span>
        <span className="block text-xs text-gray-500 mt-0.5">{text}</span>
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
        checked ? "bg-rose-500 border-rose-500 text-white" : "border-gray-300 bg-white"
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
            className="mt-2 inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-lg bg-white border border-red-200 text-red-700 text-sm font-medium hover:bg-red-50 transition"
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
          className="mt-2 inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-lg bg-white border border-red-200 text-red-700 text-sm font-medium hover:bg-red-50 transition"
        >
          <RotateCw size={14} /> Recharger
        </button>
      )}
    </ErrorBox>
  );
}
