"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, ChevronDown, Menu } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { useOrderHref } from "@/lib/order";
import { cn } from "@/lib/utils";
import { BrandBadge } from "../Brand";
import Squiggle from "../Squiggle";
import WhatsAppIcon from "../WhatsAppIcon";
import type { Tone } from "../SectionTone";
import LangSwitch from "./LangSwitch";
import MobileDrawer from "./MobileDrawer";
import StickyOrderPill from "./StickyOrderPill";
import { NAV_ITEMS, activeNav, localePath, type NavCategory, type NavKey } from "./nav";

export interface SiteHeaderProps {
  /** Categories that have cakes (getNavCategories). Empty → the Galerie item has no menu. */
  categories: NavCategory[];
  /** Transparent at the top of the page (over a hero). false → always frosted. */
  overlay?: boolean;
  /** Mobile sticky "Commander sur WhatsApp" pill. */
  pill?: "auto" | "off";
}

const TONES: Tone[] = ["cream", "raspberry", "ink", "champagne"];

/**
 * Chameleon header. Takes the tone of the section under it (any `[data-tone]`
 * element), stays transparent over the hero until the page scrolls, then turns
 * frosted in that tone. Desktop: logo · nav (Galerie ▾) · FR·ع·EN · CTA.
 * Phones/tablets: logo · FR·ع·EN · burger, plus the sticky bottom order pill.
 */
export default function SiteHeader({ categories, overlay = true, pill = "auto" }: SiteHeaderProps) {
  const t = useTranslations("frame");
  const locale = useLocale();
  const pathname = usePathname();
  const order = useOrderHref();
  const active = activeNav(pathname);

  const headerRef = useRef<HTMLElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const [tone, setTone] = useState<Tone>("cream");
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawn, setDrawn] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // Draw the active-page squiggle once, after first paint.
  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Tone + scrolled state, read once per frame while scrolling. elementsFromPoint
  // respects stacking (e.g. the lifted <main> over the curtain footer).
  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      const header = headerRef.current;
      if (!header) return;
      setScrolled(window.scrollY > 8);
      // Probe just under the header's bottom edge (what the eye reads as
      // "the section below"), and resolve the tone at section level: a section
      // may override it with data-header-tone (e.g. a cream card on raspberry).
      const y = Math.min(header.offsetHeight + 1, window.innerHeight - 1);
      const stack = document.elementsFromPoint(window.innerWidth / 2, y);
      const under = stack.find((el) => !header.contains(el));
      const host = under?.closest<HTMLElement>("[data-header-tone], section[data-tone]");
      const value = (host?.dataset.headerTone ?? host?.dataset.tone) as Tone | undefined;
      setTone(value && TONES.includes(value) ? value : "cream");
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pathname]);

  const solid = scrolled || !overlay;

  return (
    <>
      <a
        href="#main"
        className="sr-only z-[70] rounded-full bg-gp-ink px-5 py-3 font-semibold text-gp-cream focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
      >
        {t("skip")}
      </a>
      <header
        ref={headerRef}
        data-tone={tone}
        data-solid={solid}
        className="gp-header fixed inset-x-0 top-0 z-40 pt-[env(safe-area-inset-top,0px)] text-tone-fg"
      >
        <div className="gp-container flex h-[var(--gp-header-h)] items-center justify-between gap-4 lg:gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 rounded-full" aria-label={t("home_aria")}>
            <BrandBadge size={40} className="md:h-11 md:w-11" />
            <span className="whitespace-nowrap font-display text-[1.0625rem] font-semibold tracking-[-0.02em] max-[359px]:sr-only md:text-[1.1875rem] rtl:tracking-normal">
              Gateaux Patience
            </span>
          </Link>

          <nav aria-label={t("nav_aria")} className="hidden items-center gap-5 lg:flex xl:gap-8">
            {NAV_ITEMS.map((item) =>
              item.key === "gallery" ? (
                <GalleryItem
                  key={item.key}
                  categories={categories}
                  active={active === "gallery"}
                  drawn={drawn}
                />
              ) : (
                <NavLink key={item.key} item={item} locale={locale} active={active === item.key} drawn={drawn}>
                  {t(item.key)}
                </NavLink>
              )
            )}
          </nav>

          <div className="flex items-center gap-1 lg:gap-3">
            <LangSwitch />
            <a
              href={order()}
              target="_blank"
              rel="noopener noreferrer"
              className="group hidden min-h-12 items-center gap-2.5 rounded-full bg-tone-cta-bg py-1.5 pe-5 ps-2 text-tone-cta-fg shadow-gp-chip transition-[transform,background-color,color] duration-150 ease-gp active:scale-[0.97] lg:inline-flex"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-tone-cta-fg/15">
                <WhatsAppIcon className="h-[18px] w-[18px]" />
              </span>
              <span className="text-start leading-tight">
                <span className="block whitespace-nowrap text-[0.9375rem] font-semibold">{t("order")}</span>
                <span className="hidden whitespace-nowrap text-[0.75rem] font-medium opacity-85 xl:block">
                  {t("order_sub")}
                </span>
              </span>
              <span className="sr-only xl:hidden"> {t("order_sub")}</span>
              <span className="sr-only"> ({t("opens_whatsapp")})</span>
            </a>
            <button
              ref={burgerRef}
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={t("menu_open")}
              aria-expanded={drawerOpen}
              aria-controls="gp-drawer"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full transition-transform active:scale-95 lg:hidden"
            >
              <Menu aria-hidden="true" className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      <MobileDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        active={active}
        categories={categories}
        returnFocusTo={burgerRef}
      />
      {pill === "auto" ? <StickyOrderPill suppressed={drawerOpen} /> : null}
    </>
  );
}

const linkClass =
  "relative inline-flex h-11 items-center whitespace-nowrap font-display text-[0.9375rem] font-medium tracking-[-0.01em] transition-colors duration-150 hover:text-tone-accent xl:text-[1.0625rem] rtl:tracking-normal";

/** The hand-drawn wavy underline under the current page's link. */
function ActiveMark({ drawn }: { drawn: boolean }) {
  return (
    <Squiggle
      drawn={drawn}
      delay={200}
      strokeWidth={2.5}
      className="absolute inset-x-[-2px] bottom-1 h-[7px] w-[calc(100%+4px)] text-tone-accent"
    />
  );
}

function NavLink({
  item,
  locale,
  active,
  drawn,
  children,
}: {
  item: { key: NavKey; href: string; external?: boolean };
  locale: string;
  active: boolean;
  drawn: boolean;
  children: React.ReactNode;
}) {
  const inner = (
    <span className="relative inline-flex items-center self-stretch">
      {children}
      {active ? <ActiveMark drawn={drawn} /> : null}
    </span>
  );
  if (item.external) {
    return (
      <a href={localePath(locale, item.href)} className={linkClass}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={item.href} className={linkClass} aria-current={active ? "page" : undefined}>
      {inner}
    </Link>
  );
}

/** "Galerie" link + a disclosure button opening the categories that have cakes. */
function GalleryItem({
  categories,
  active,
  drawn,
}: {
  categories: NavCategory[];
  active: boolean;
  drawn: boolean;
}) {
  const t = useTranslations("frame");
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const closeTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    }
    function onFocus(e: FocusEvent) {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocus);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocus);
    };
  }, [open]);

  // Hover opens on fine pointers only (touch uses the button).
  const hover = (next: boolean) => (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    window.clearTimeout(closeTimer.current);
    if (next) setOpen(true);
    else closeTimer.current = window.setTimeout(() => setOpen(false), 140);
  };

  return (
    <div ref={wrap} className="relative flex items-center" onPointerEnter={hover(true)} onPointerLeave={hover(false)}>
      <Link href="/galerie" className={linkClass} aria-current={active ? "page" : undefined}>
        <span className="relative inline-flex items-center self-stretch">
          {t("gallery")}
          {active ? <ActiveMark drawn={drawn} /> : null}
        </span>
      </Link>
      {categories.length > 0 ? (
        <>
          <button
            ref={button}
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={t("gallery_menu")}
            onClick={() => setOpen((v) => !v)}
            className="-ms-0.5 inline-flex h-11 w-7 items-center justify-center rounded-full transition-colors hover:text-tone-accent"
          >
            <ChevronDown
              aria-hidden="true"
              className={cn("h-4 w-4 transition-transform duration-200 ease-gp", open && "rotate-180")}
            />
          </button>
          <div
            id={panelId}
            hidden={!open}
            data-tone="cream"
            className="absolute start-[-14px] top-full z-10 w-[19rem] pt-2"
          >
            <div className="rounded-[22px] bg-gp-cream p-2 text-gp-ink shadow-[0_24px_50px_-20px_rgb(var(--gp-ink)/0.45)] ring-1 ring-gp-ink/[0.07]">
              <ul>
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={c.href}
                      onClick={() => setOpen(false)}
                      className="group flex min-h-12 items-center gap-3 rounded-2xl px-2 py-1.5 transition-colors hover:bg-gp-champagne/70 focus-visible:bg-gp-champagne/70"
                    >
                      <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gp-champagne">
                        {open ? (
                          <Image src={c.cover} alt="" fill sizes="40px" className="object-cover" />
                        ) : null}
                      </span>
                      <span className="flex-1 text-[0.9375rem] font-medium leading-snug">{c.label}</span>
                      <span className="tabular text-[0.8125rem] text-gp-ink/55">{c.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/galerie"
                onClick={() => setOpen(false)}
                className="mt-1 flex min-h-11 items-center justify-between gap-2 rounded-2xl border-t border-gp-ink/10 px-3 pt-1 text-[0.9375rem] font-semibold text-gp-raspberry hover:bg-gp-champagne/50"
              >
                {t("gallery_all")}
                <ArrowRight aria-hidden="true" className="h-4 w-4 rtl:-scale-x-100" />
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
