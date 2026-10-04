// Pure locale/path helpers (server + client). See LocaleLink.tsx.
import { routing } from "./routing";

export type Locale = (typeof routing.locales)[number];
const PREFIX = new RegExp(`^/(${routing.locales.join("|")})(?=[/?#]|$)`);

export function localizePath(locale: string, href: string): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  if (locale === routing.defaultLocale) return href;
  return href === "/" ? `/${locale}` : /^\/[?#]/.test(href) ? `/${locale}${href.slice(1)}` : `/${locale}${href}`;
}

/** Strip the locale prefix from a browser pathname ("/ar/galerie" -> "/galerie"). */
export function stripLocale(pathname: string): string {
  return pathname.replace(PREFIX, "") || "/";
}

export function switchLocaleHref(target: Locale, unprefixedPath: string): string {
  return `/${target}${unprefixedPath === "/" ? "" : unprefixedPath}`;
}
