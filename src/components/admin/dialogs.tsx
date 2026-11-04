"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { BTN_DANGER, BTN_PRIMARY, BTN_SECONDARY } from "./ui";

// Dialogs can stack (a picker over the price-sheet editor, a confirm over
// both): only the topmost one reacts to Escape and keeps Tab inside.
const layers: object[] = [];

export function useTopLayer(): () => boolean {
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
let ignorePops = 0; // our own history.back() calls when a dialog closes another way
let popListening = false;

function onPopState() {
  if (ignorePops > 0) {
    ignorePops--;
    return;
  }
  backStack[backStack.length - 1]?.();
}

export function useBackButton(onBack: () => void) {
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

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

/**
 * Keyboard focus for a modal: moves in on open (to `initial`, unless a field
 * inside already took it with autoFocus), stays inside on Tab while this is
 * the top layer, and goes back to the button that opened it on close.
 */
export function useDialogFocus(
  ref: RefObject<HTMLElement | null>,
  isTop: () => boolean,
  initial?: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const box = ref.current;
    if (box && !box.contains(document.activeElement)) {
      (initial?.current ?? box.querySelector<HTMLElement>(FOCUSABLE) ?? box).focus({ preventScroll: true });
    }
    const onKey = (e: KeyboardEvent) => {
      const root = ref.current;
      if (e.key !== "Tab" || !root || !isTop()) return;
      const els = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (els.length === 0) {
        e.preventDefault();
        root.focus();
        return;
      }
      const first = els[0];
      const last = els[els.length - 1];
      const active = document.activeElement;
      if (!root.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (opener && opener !== document.body && opener.isConnected) opener.focus({ preventScroll: true });
    };
    // Mount/unmount only: the dialog's own lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

const ICON_BTN =
  "inline-flex items-center justify-center w-11 h-11 rounded-full text-gp-ink/70 transition hover:bg-gp-ink/5 hover:text-gp-ink disabled:opacity-40 shrink-0";

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
  const panel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  useDialogFocus(panel, isTop, closeBtn);
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
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "bg-white w-full rounded-t-3xl sm:rounded-3xl shadow-gp-lifted flex flex-col overflow-hidden outline-none",
            size === "full" ? "h-[94dvh] sm:h-[90vh] sm:max-w-4xl" : "max-h-[90vh] sm:max-w-lg"
          )}
        >
          <div className="flex items-center justify-between gap-3 pl-5 pr-2 py-2 border-b border-gp-gold/30 bg-gp-cream shrink-0">
            <h2 className="text-lg font-semibold leading-tight text-gp-ink">{title}</h2>
            <button
              ref={closeBtn}
              type="button"
              onClick={guardCloseButton ? softClose : onClose}
              className={ICON_BTN}
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

/**
 * Every "are you sure?" of the admin. Behaves like the browser's confirm():
 * modal, Escape / phone back = Cancel, Cancel focused first, Tab stays inside.
 * `error`: the action failed, shown in the dialog so she can retry or cancel.
 */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  cancelLabel = "Annuler",
  tone = "danger",
  loading = false,
  error = null,
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
  const isTop = useTopLayer(); // the sheet underneath ignores Escape while this is open
  const box = useRef<HTMLDivElement>(null);
  const cancelBtn = useRef<HTMLButtonElement>(null);
  useDialogFocus(box, isTop, cancelBtn);
  const cancelRef = useRef(onCancel);
  const loadingRef = useRef(loading);
  useEffect(() => {
    cancelRef.current = onCancel;
    loadingRef.current = loading;
  });
  useBackButton(() => {
    if (!loadingRef.current) cancelRef.current();
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isTop() && !loadingRef.current) {
        e.preventDefault();
        cancelRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isTop]);

  return (
    <div className="fixed inset-0 !m-0 z-[60] flex items-center justify-center bg-gp-ink/50 p-4">
      <div
        ref={box}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="bg-gp-cream rounded-3xl shadow-gp-lifted max-w-sm w-full p-6 outline-none"
      >
        <div className="flex items-start gap-3 mb-5">
          <div
            className={cn(
              "w-11 h-11 rounded-full ring-1 flex items-center justify-center shrink-0",
              tone === "danger" ? "bg-red-50 text-red-700 ring-red-200" : "bg-amber-50 text-amber-700 ring-amber-200"
            )}
          >
            <AlertTriangle size={20} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold leading-tight text-gp-ink">{title}</h2>
            {children && <div className="text-sm text-gp-ink/75 mt-1.5 space-y-2">{children}</div>}
          </div>
        </div>
        {error && (
          <p role="alert" className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {error}
          </p>
        )}
        {/* Phones: stacked, full width, the confirm button nearest the thumb. */}
        <div className="flex flex-col-reverse sm:flex-row sm:flex-wrap gap-2 sm:justify-end">
          <button ref={cancelBtn} type="button" onClick={onCancel} disabled={loading} className={BTN_SECONDARY}>
            {cancelLabel}
          </button>
          {extraAction && (
            <button type="button" onClick={extraAction.onClick} disabled={loading} className={BTN_SECONDARY}>
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
