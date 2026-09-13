import type { Metadata } from "next";
import { Playfair_Display, Inter, Cairo, Great_Vibes } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { CONTACT, PHONE_E164, SITE_URL } from "@/lib/constants";
import "../globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-great-vibes",
  display: "swap",
});

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

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages({ locale });
  const meta = (messages as Record<string, Record<string, string>>)["meta"];

  return {
    title: { absolute: meta?.home_title || "Gateaux Patience" },
    description: meta?.home_desc,
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

  if (!routing.locales.includes(locale as "fr" | "ar" | "en")) {
    notFound();
  }

  const messages = await getMessages();
  const isRTL = locale === "ar";

  return (
    <html
      lang={locale}
      dir={isRTL ? "rtl" : "ltr"}
      className={`${playfair.variable} ${inter.variable} ${cairo.variable} ${greatVibes.variable}`}
    >
      <head>
        {/* Canonical URLs are set per page (metadata.alternates), not here:
            a layout-level canonical would mark every page as a copy of home. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: BUSINESS_JSON_LD }}
        />
      </head>
      <body
        className={`${isRTL ? "font-arabic" : "font-sans"} bg-background text-charcoal antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
