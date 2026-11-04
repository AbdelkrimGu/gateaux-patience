"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { BTN_DANGER, BTN_GHOST, BTN_PRIMARY, BTN_SECONDARY, ICON_BTN_BASE } from "./ui";

// Shared by every admin screen (cakes, orders, categories, pricing), so all
// sheets and confirmations behave and look the same.

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

// Phone back button / gesture: every open dialog adds a history entry, so
// "back" closes the topmost one (asking first when dirty) instead of leaving
// the page. One global listener, so stacked dialogs don't all react.
const backStack: Array<() => void> = [];
// Our own history.back() calls when a dialog closes another way, with the URL
// that was showing then: the step back lands on the entry from before the
// dialog, whose URL can be stale (e.g. ?tab= changed while it was open).
const ownBacks: string[] = [];
let popListening = false;

function onPopState() {
  const url = ownBacks.shift();
  if (url !== undefined) {
    if (url !== window.location.href) window.history.replaceState(window.history.state, "", url);
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
        // Next tick: effects of the same update (a tab switch writing ?tab=) run first.
        setTimeout(() => {
          ownBacks.push(window.location.href);
          window.history.back();
        }, 0);
      }
    };
  }, []);
}

/** Keeps Tab / Shift+Tab inside `container` (a modal dialog). */
function trapTab(e: ReactKeyboardEvent, container: HTMLElement | null) {
  if (e.key !== "Tab" || !container) return;
  const focusables = Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => el.offsetParent !== null);
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = document.activeElement;
  if (e.shiftKey && (active === first || active === container)) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  }
}

/**
 * Focus moves into the dialog (to `initial`, unless a field already took it
 * with autoFocus) and goes back to what opened it when the dialog closes.
 */
function useDialogFocus(container: React.RefObject<HTMLElement | null>, initial?: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = container.current;
    if (dialog && !dialog.contains(document.activeElement)) {
      (initial?.current ?? dialog).focus({ preventScroll: true });
    }
    return () => {
      const active = document.activeElement;
      if (opener?.isConnected && (!active || active === document.body || dialog?.contains(active))) {
        opener.focus({ preventScroll: true });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef);
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
          ref={dialogRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => isTop() && trapTab(e, dialogRef.current)}
          className={cn(
            "bg-gp-paper text-gp-ink w-full rounded-t-[24px] sm:rounded-[24px] shadow-[0_-12px_40px_-12px_rgb(var(--gp-ink)/0.45)] flex flex-col outline-none",
            size === "full" ? "h-[94dvh] sm:h-[90vh] sm:max-w-4xl" : "max-h-[90vh] sm:max-w-lg"
          )}
        >
          <div className="flex items-center justify-between gap-3 pl-5 pr-2 py-2 border-b border-gp-ink/10 shrink-0">
            <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-gp-ink">{title}</h2>
            <button
              type="button"
              onClick={guardCloseButton ? softClose : onClose}
              className={cn(ICON_BTN_BASE, "hover:bg-gp-ink/[0.07] hover:text-gp-ink")}
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

/**
 * Every confirmation in the admin (delete, replace, discard). Escape and the
 * phone's back button cancel; « Annuler » has the focus on open, so a stray
 * Enter never deletes anything. `error`: shown above the buttons after a failure.
 */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  cancelLabel = "Annuler",
  tone = "danger",
  loading = false,
  error,
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
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  /** A third choice between cancel and confirm (« Enregistrer d'abord »). */
  extraAction?: { label: string; onClick: () => void };
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const isTop = useTopLayer(); // the sheet underneath ignores Escape while this is open
  useDialogFocus(dialogRef, cancelRef);
  const cancelIfIdle = () => {
    if (!loading) onCancel();
  };
  useBackButton(cancelIfIdle);
  // Opened while still busy (the category check): « Annuler » was disabled, so give it the focus once it is ready.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!loading && dialog && !dialog.contains(document.activeElement)) cancelRef.current?.focus({ preventScroll: true });
  }, [loading]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isTop() && !loading) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isTop, loading, onCancel]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gp-ink/60 p-4 motion-safe:animate-gpa-fade">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="gpa-confirm-title"
        onKeyDown={(e) => trapTab(e, dialogRef.current)}
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
          <div className="min-w-0">
            <h2 id="gpa-confirm-title" className="font-display text-lg font-semibold leading-tight tracking-[-0.02em] text-gp-ink break-words">
              {title}
            </h2>
            {children && <div className="text-sm text-gp-ink/75 mt-1.5 space-y-2">{children}</div>}
          </div>
        </div>
        {error && (
          <p role="alert" className="flex items-start gap-2 mb-4 text-sm font-medium text-red-800 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2 justify-end">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={loading} className={BTN_GHOST}>
            {cancelLabel}
          </button>
          {extraAction && (
            <button type="button" onClick={extraAction.onClick} disabled={loading} className={BTN_SECONDARY}>
              {extraAction.label}
            </button>
          )}
          <button type="button" onClick={onConfirm} disabled={loading} className={tone === "danger" ? BTN_DANGER : BTN_PRIMARY}>
            {loading && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
