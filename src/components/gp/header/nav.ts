import type { NavCategory } from "@/lib/home-data";

export type { NavCategory };

export type NavKey = "home" | "gallery" | "tiramisu" | "contact";

/** Header/drawer/footer navigation: pages, not scroll positions. */
export const NAV_ITEMS: { key: NavKey; href: string; external?: boolean }[] = [
  { key: "home", href: "/" },
  { key: "gallery", href: "/galerie" },
  { key: "tiramisu", href: "/tiramisu" },
  // /contact is the static QR page rewritten by proxy.ts: a plain <a>, not a client route.
  { key: "contact", href: "/contact", external: true },
];

/** Prefix a path with the locale ("fr" has no prefix: localePrefix "as-needed"). */
export function localePath(locale: string, path: string): string {
  if (locale === "fr") return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/** Which nav item the current (locale-less) pathname belongs to. */
export function activeNav(pathname: string): NavKey | null {
  if (pathname === "/" || pathname === "") return "home";
  if (pathname.startsWith("/galerie")) return "gallery";
  if (pathname.startsWith("/tiramisu")) return "tiramisu";
  if (pathname.startsWith("/contact")) return "contact";
  return null;
}
