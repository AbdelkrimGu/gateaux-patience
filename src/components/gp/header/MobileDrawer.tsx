"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CONTACT } from "@/lib/constants";
import { useOrderHref } from "@/lib/order";
import { BrandBadge } from "../Brand";
import DashedRingCta from "../DashedRingCta";
import HandNote from "../HandNote";
import Squiggle from "../Squiggle";
import LangSwitch from "./LangSwitch";
import { NAV_ITEMS, localePath, type NavCategory, type NavKey } from "./nav";

/** Full-screen menu for phones/tablets: big display links, categories, the order CTA. */
export default function MobileDrawer({
  open,
  onClose,
  active,
  categories,
  returnFocusTo,
}: {
  open: boolean;
  onClose: () => void;
  active: NavKey | null;
  categories: NavCategory[];
  returnFocusTo: React.RefObject<HTMLButtonElement | null>;
}) {
  const t = useTranslations("frame");
  const locale = useLocale();
  const order = useOrderHref();
  const panel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  // Focus in, Esc to close, Tab trapped, page scroll locked.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    closeBtn.current?.focus();
    const back = returnFocusTo.current;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const items = panel.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      root.style.overflow = prevOverflow;
      back?.focus();
    };
  }, [open, onClose, returnFocusTo]);

  const stagger = (n: number) => ({ "--i": n }) as React.CSSProperties;

  return (
    <div
      ref={panel}
      id="gp-drawer"
      role="dialog"
      aria-modal="true"
      aria-label={t("nav_aria")}
      data-tone="cream"
      data-open={open}
      inert={!open}
      className="gp-drawer fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-gp-cream pt-[env(safe-area-inset-top,0px)] text-gp-ink lg:hidden"
    >
      <div className="gp-container flex h-[var(--gp-header-h)] shrink-0 items-center justify-between gap-3">
        <Link href="/" onClick={onClose} className="flex items-center gap-2.5" aria-label={t("home_aria")}>
          <BrandBadge size={40} />
          <span className="font-display text-[1.0625rem] font-semibold tracking-[-0.02em] rtl:tracking-normal">
            Gateaux Patience
          </span>
        </Link>
        <button
          ref={closeBtn}
          type="button"
          onClick={onClose}
          aria-label={t("menu_close")}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-gp-ink/15 transition-transform active:scale-95"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>

      <nav aria-label={t("nav_aria")} className="gp-container flex-1 pb-8 pt-6">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item, n) => {
            const isActive = active === item.key;
            const cls =
              "relative inline-flex min-h-14 items-center font-display text-[2.6rem] font-semibold leading-none tracking-[-0.035em] rtl:text-[2.3rem] rtl:tracking-normal";
            const label = (
              <span className="relative">
                {t(item.key)}
                {isActive ? (
                  <Squiggle
                    drawn={open}
                    delay={350}
                    className="absolute inset-x-0 -bottom-1.5 h-2.5 w-full text-gp-raspberry"
                  />
                ) : null}
              </span>
            );
            return (
              <li key={item.key} data-stagger style={stagger(n)}>
                {item.external ? (
                  <a href={localePath(locale, item.href)} className={cls} onClick={onClose}>
                    {label}
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    className={cls}
                    aria-current={isActive ? "page" : undefined}
                    onClick={onClose}
                  >
                    {label}
                  </Link>
                )}
                {item.key === "gallery" && categories.length > 0 ? (
                  <ul className="mb-4 mt-1 flex flex-wrap gap-1.5">
                    {categories.map((c) => (
                      <li key={c.slug}>
                        <Link
                          href={c.href}
                          onClick={onClose}
                          className="inline-flex min-h-10 items-center rounded-full bg-gp-champagne px-3.5 text-[0.875rem] font-medium text-gp-ink transition-colors hover:bg-gp-raspberry/12"
                        >
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>

        <div data-stagger style={stagger(NAV_ITEMS.length)} className="mt-10 flex flex-col items-start gap-4">
          <DashedRingCta href={order()} srHint={t("opens_whatsapp")} onClick={onClose}>
            {t("order_full")}
          </DashedRingCta>
          <HandNote size="sm" rotate={-4} className="ms-3" decorative>
            {t("drawer_note")}
          </HandNote>
        </div>
      </nav>

      <div
        data-stagger
        style={stagger(NAV_ITEMS.length + 1)}
        className="gp-container flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-gp-ink/10 py-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]"
      >
        <LangSwitch onNavigate={onClose} />
        <div className="flex items-center gap-5 text-[0.9375rem] font-medium text-gp-ink/75">
          <a href={CONTACT.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center hover:text-gp-ink">
            Instagram
          </a>
          <a href={CONTACT.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center hover:text-gp-ink">
            Facebook
          </a>
        </div>
      </div>
    </div>
  );
}
