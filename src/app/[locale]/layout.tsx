import type { Metadata } from "next";
import { Playfair_Display, Inter, Cairo, Great_Vibes } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
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
    title: meta?.home_title || "Gateaux Patience",
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
        <link rel="canonical" href={`https://gateaux-patience.dz/${locale === "fr" ? "" : locale}`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Bakery",
              name: "Gateaux Patience",
              description:
                "Artisan cake designer creating custom cakes in Sidi Bel Abbès, Algeria since 2018",
              url: "https://gateaux-patience.dz",
              telephone: "+213-XXX-XXX-XXX",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Sidi Bel Abbès",
                addressCountry: "DZ",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: 35.1896,
                longitude: -0.6299,
              },
              openingHoursSpecification: {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ],
                opens: "08:00",
                closes: "22:00",
              },
              servesCuisine: "Patisserie",
              priceRange: "$$",
              hasMap: "https://maps.google.com/?q=Sidi+Bel+Abbes+Algeria",
              sameAs: [
                "https://www.facebook.com/gateauxpatience",
                "https://www.instagram.com/gateauxpatience",
              ],
              foundingDate: "2018",
              image: "https://gateaux-patience.dz/logo.png",
            }),
          }}
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
