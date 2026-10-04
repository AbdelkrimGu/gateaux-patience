"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";
import { useParams } from "next/navigation";
import { routing } from "./routing";
import { localizePath, type Locale } from "./paths";

/*
  Locale-aware link on top of next/link, without next-intl's navigation
  runtime and without needing a NextIntlClientProvider (the locale comes from
  the [locale] route param). Usable from server and client components.

    <LocaleLink href="/galerie">…</LocaleLink>         -> /galerie, /ar/galerie
    <LocaleLink href="/galerie" locale="fr">…</LocaleLink>

  With localePrefix "as-needed", FR is unprefixed. To SWITCH language use
  switchLocaleHref() from ./paths: it always prefixes (/fr/…), so the middleware updates
  the NEXT_LOCALE cookie before redirecting to the clean URL.
*/

export type LocaleLinkProps = Omit<ComponentProps<typeof NextLink>, "href"> & {
  href: string;
  locale?: Locale;
};

export function LocaleLink({ href, locale, ...rest }: LocaleLinkProps) {
  const params = useParams<{ locale?: string }>();
  const current = locale ?? params?.locale ?? routing.defaultLocale;
  return <NextLink href={localizePath(current, href)} {...rest} />;
}
