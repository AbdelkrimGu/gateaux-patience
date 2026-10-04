"use client";

import { useEffect, useRef, useState } from "react";
import NextLink from "next/link";
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
}

export interface HeaderNavProps {
  items: NavItem[];
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
  return (
    <nav aria-label={label} className={cn("flex items-center gap-0.5", className)}>
      {routing.locales.map((l) => {
        const active = l === current;
        return (
          <NextLink
            key={l}
            href={switchLocaleHref(l, pathname)}
            prefetch={false}
            lang={l}
            hrefLang={l}
            aria-label={langs[l].name}
            aria-current={active ? "true" : undefined}
            onClick={onPick}
            className={cn(
              "grid size-8 place-items-center rounded-full text-[13px] leading-none font-medium no-underline",
              active ? "bg-paillette text-sucre" : "text-paillette hover:bg-dragee",
              // System font for the lone "ع": avoids pulling the 22 KB Arabic Readex
              // slice into FR/EN pages for one glyph.
              l === "ar" && "pb-0.5 font-[system-ui,sans-serif] text-[15px]"
            )}
          >
            {langs[l].short}
          </NextLink>
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
      <nav aria-label={props.navLabel} className="hidden desk:me-6 desk:flex desk:gap-7">
        {props.items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
            className="text-[15px] font-medium no-underline decoration-framboise decoration-2 underline-offset-[6px] hover:underline aria-[current=page]:underline"
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
