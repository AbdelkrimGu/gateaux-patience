import type { Metadata, Viewport } from "next";
import { Lalezar, Readex_Pro } from "next/font/google";
import localFont from "next/font/local";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { asLocale } from "@/i18n/locale";
import { CONTACT, PHONE_E164, SITE_URL } from "@/lib/constants";
import "../globals.css";

/*
  Fonts (DESIGN.md amendment 6): max two families per locale.
    FR/EN: Dela Gothic One (display) + Readex Pro latin (body)
    AR:    Lalezar (display) + Readex Pro arabic (+ latin for digits/brand)
  Only the current locale's variables are put on <html>, so a page never
  references (and the browser never downloads) the other locale's display
  face. next/font preloads every font declared in a layout on every route
  under it, so only Readex latin (needed by all three locales) is preloaded;
  the display faces swap in from the stylesheet (size-adjusted fallbacks).
*/
// Dela is self-hosted as a 14 KB Latin subset (scripts/build-display-font.mjs):
// via next/font/google it drags ~120 Japanese unicode-range @font-face rules
// (~34 KB gz of CSS) into every page.
const dela = localFont({
  src: "../../fonts/DelaGothicOne-Latin.woff2",
  weight: "400",
  variable: "--font-dela",
  display: "swap",
  preload: false,
  fallback: ["Arial Black", "system-ui", "sans-serif"],
});
const lalezar = Lalezar({
  weight: "400",
  subsets: ["arabic"],
  variable: "--font-lalezar",
  display: "swap",
  preload: false,
});
const readex = Readex_Pro({
  subsets: ["latin"],
  variable: "--font-readex",
  display: "swap",
});
const readexArabic = Readex_Pro({
  subsets: ["arabic"],
  variable: "--font-readex-ar",
  display: "swap",
  preload: false,
});

const FONT_CLASSES = {
  fr: `${dela.variable} ${readex.variable}`,
  en: `${dela.variable} ${readex.variable}`,
  ar: `${lalezar.variable} ${readexArabic.variable} ${readex.variable}`,
} as const;

// schema.org business entity. Same @id as the /contact page's JSON-LD so
// Google merges them into one business. Only verified facts: add opening
// hours / price range / exact address here once the owner confirms them.
const BUSINESS_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Bakery",
  "@id": `${SITE_URL}/#business`,
  name: "Gâteaux Patience",
  alternateName: ["Gateaux Patience", "Gâteaux patience"],
  description:
    "Artisan cake designer creating custom cakes in Sidi Bel Abbès, Algeria since 2018",
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/contact/logo-square.jpg`,
  image: `${SITE_URL}/contact/og.jpg`,
  telephone: PHONE_E164,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Sidi Bel Abbès",
    addressRegion: "Sidi Bel Abbès",
    addressCountry: "DZ",
  },
  areaServed: { "@type": "City", name: "Sidi Bel Abbès" },
  servesCuisine: "Patisserie",
  sameAs: [CONTACT.instagram, CONTACT.facebook],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: PHONE_E164,
    contactType: "customer service",
    availableLanguage: ["French", "Arabic", "English"],
  },
  foundingDate: CONTACT.founded,
}).replace(/</g, "\\u003c");

export const viewport: Viewport = {
  themeColor: "#F7F2F4",
  viewportFit: "cover",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: asLocale(locale), namespace: "meta" });
  return {
    title: { absolute: t("home_title") },
    description: t("home_desc"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Enables static rendering for pages under [locale] (next-intl v4).
  setRequestLocale(locale);

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={FONT_CLASSES[locale]}>
      <head>
        {/* Canonical URLs are set per page (metadata.alternates), not here:
            a layout-level canonical would mark every page as a copy of home. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: BUSINESS_JSON_LD }}
        />
      </head>
      <body>
        {/* No NextIntlClientProvider here: use-intl on the client is ~12 KB gz.
            Translate in server components and pass strings as props; a client
            island that truly needs useTranslations() wraps itself in
            <IntlIsland namespaces={[...]}>. No global MotionProvider either
            (~11 KB gz): islands that use `m` wrap themselves. */}
        {children}
      </body>
    </html>
  );
}
