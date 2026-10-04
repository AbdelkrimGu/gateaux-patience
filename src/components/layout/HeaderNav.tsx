"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, usePathname as useBrowserPathname } from "next/navigation";
import { LocaleLink as Link } from "@/i18n/LocaleLink";
import { stripLocale, switchLocaleHref } from "@/i18n/paths";
import { routing } from "@/i18n/routing";
import { Icon } from "@/components/ui/Icon";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import styles from "./HeaderNav.module.css";

/*
  The interactive half of the header: desktop links (aria-current), the
  FR / ع / EN circles, and the mobile menu sheet (<dialog>: native focus
  trap, Esc, inert page). Labels arrive translated from the server <Header>.
*/

export interface NavItem {
  href: string;
  label: string;
  /** Desktop only: shown from 1200px (room next to the switcher). */
  wide?: boolean;
}

export interface HeaderNavProps {
  /** Mobile menu sheet. */
  items: NavItem[];
  /** Desktop links (after the universe switcher). */
  deskItems: NavItem[];
  langLabel: string;
  langs: Record<"fr" | "ar" | "en", { short: string; name: string }>;
  menuOpen: string;
  menuClose: string;
  navLabel: string;
  menuTitle: string;
  orderLabel: string;
  orderHref: string;
  callLabel: string;
  phoneHref: string;
  phoneDisplay: string;
}

function isCurrent(pathname: string, href: string) {
  const path = href.split(/[?#]/)[0];
  if (href.includes("?") || href.includes("#")) return false; // filtered views / anchors
  return path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);
}

function LanguageCircles({
  label,
  langs,
  pathname,
  onPick,
  className,
}: {
  label: string;
  langs: HeaderNavProps["langs"];
  pathname: string;
  onPick?: () => void;
  className?: string;
}) {
  const current = useParams<{ locale?: string }>()?.locale ?? routing.defaultLocale;
  // Plain <a>: a locale switch changes <html lang/dir>, so it is a document
  // navigation. A soft (RSC) navigation to /fr/... got a 307 without
  // Set-Cookie and bounced back to the cookie's locale (09 blocker 1).
  // The click also writes NEXT_LOCALE and keeps ?query/#hash (e.g. ?c=wedding).
  const pick = (l: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    document.cookie = `NEXT_LOCALE=${l}; path=/; max-age=31536000; samesite=lax`;
    const { search, hash } = window.location;
    if (search || hash) e.currentTarget.href = `${e.currentTarget.href.split(/[?#]/)[0]}${search}${hash}`;
    onPick?.();
  };
  return (
    <nav aria-label={label} className={cn("-mx-1.5 flex items-center", className)}>
      {routing.locales.map((l) => {
        const active = l === current;
        return (
          <a
            key={l}
            href={switchLocaleHref(l, pathname)}
            lang={l}
            hrefLang={l}
            aria-current={active ? "true" : undefined}
            onClick={pick(l)}
            // 44px hit area around a 32px circle. The accessible name starts
            // with the visible label ("FR Français"): WCAG 2.5.3.
            className="group grid size-11 place-items-center rounded-full no-underline"
          >
            <span
              aria-hidden="true"
              className={cn(
                "grid size-8 place-items-center rounded-full text-[13px] leading-none font-medium",
                active ? "bg-paillette text-sucre" : "text-paillette group-hover:bg-dragee",
                // System font for the lone "ع": avoids pulling the 22 KB Arabic Readex
                // slice into FR/EN pages for one glyph.
                l === "ar" && "pb-0.5 font-[system-ui,sans-serif] text-[15px]"
              )}
            >
              {langs[l].short}
            </span>
            <span className="sr-only">{`${langs[l].short} ${langs[l].name}`}</span>
          </a>
        );
      })}
    </nav>
  );
}

export function HeaderNav(props: HeaderNavProps) {
  const pathname = stripLocale(useBrowserPathname());
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  const close = () => dialogRef.current?.close();

  // Close the sheet when the route changes (link tapped inside it).
  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);

  return (
    <>
      <nav aria-label={props.navLabel} className="hidden desk:me-4 desk:flex desk:gap-7">
        {props.deskItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
            className={cn(
              "text-[15px] font-medium whitespace-nowrap no-underline decoration-framboise decoration-2 underline-offset-[6px] hover:underline aria-[current=page]:underline",
              item.wide && "hidden min-[1200px]:inline"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <LanguageCircles label={props.langLabel} langs={props.langs} pathname={pathname} />

      <a
        href={props.orderHref}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClasses({ size: "sm", className: "hidden desk:inline-flex" })}
      >
        {props.orderLabel}
      </a>

      <button
        type="button"
        aria-label={props.menuOpen}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="site-menu"
        onClick={() => {
          dialogRef.current?.showModal();
          setOpen(true);
        }}
        className="-me-2.5 grid size-11 place-items-center rounded-full desk:hidden"
      >
        <Icon name="menu" size={26} />
      </button>

      <dialog
        id="site-menu"
        ref={dialogRef}
        aria-label={props.menuTitle}
        className={styles.sheet}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          // Tap on the backdrop (the dialog box itself, outside the panel).
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className={styles.panel}>
          <div className="flex items-center justify-between">
            <LanguageCircles label={props.langLabel} langs={props.langs} pathname={pathname} onPick={close} />
            <button
              type="button"
              aria-label={props.menuClose}
              onClick={close}
              className="-me-2.5 grid size-11 place-items-center rounded-full"
            >
              <Icon name="close" size={26} />
            </button>
          </div>

          <nav aria-label={props.navLabel} className="mt-8 flex flex-col">
            {props.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
                className="type-band flex min-h-14 items-center justify-between gap-4 no-underline aria-[current=page]:text-framboise"
              >
                <span>{item.label}</span>
                <Icon name="chevron" size={22} className="text-ink-muted" />
              </Link>
            ))}
          </nav>

          <div className="mt-auto grid gap-3 pt-8">
            <a
              href={props.orderHref}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ block: true })}
            >
              <Icon name="whatsapp" size={22} />
              <span>{props.orderLabel}</span>
            </a>
            <a href={props.phoneHref} className={buttonClasses({ variant: "ghost", block: true })} aria-label={props.callLabel}>
              <Icon name="phone" size={20} />
              <bdi className="ltr">{props.phoneDisplay}</bdi>
            </a>
          </div>
        </div>
      </dialog>
    </>
  );
}
