import { hasLocale } from "next-intl";
import { routing } from "./routing";

export type AppLocale = (typeof routing.locales)[number];

/** Narrow a route param to a supported locale (falls back to the default). */
export function asLocale(value: string | undefined): AppLocale {
  return hasLocale(routing.locales, value) ? value : routing.defaultLocale;
}

export const isRtl = (locale: string) => locale === "ar";
