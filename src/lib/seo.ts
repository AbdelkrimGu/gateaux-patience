// Per-page metadata in one place (09 major 4): title, description, canonical,
// hreflang (fr/ar/en + x-default), Open Graph (url, locale, siteName, type,
// image) and Twitter. Next merges `openGraph`/`twitter` per key, so a page
// that sets them must set them completely: always go through this helper.
//
//   export async function generateMetadata({ params }) {
//     return pageMetadata({ locale, path: "/galerie", title, description,
//                           image: { url: cake.images[0], alt: title } });
//   }

import type { Metadata } from "next";
import { localizePath } from "@/i18n/paths";
import { SITE_URL } from "./constants";

export type SeoLocale = "fr" | "ar" | "en";

const LOCALES: SeoLocale[] = ["fr", "ar", "en"];
const OG_LOCALE: Record<SeoLocale, string> = { fr: "fr_DZ", ar: "ar_DZ", en: "en_US" };
export const SITE_NAME = "Gateaux Patience";

export const DEFAULT_OG_IMAGE = {
  url: "/contact/og.jpg",
  width: 1200,
  height: 630,
  alt: "Gateaux Patience, pâtisserie artisanale à Sidi Bel Abbès",
};

export interface SeoImage {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

/**
 * Remote catalogue photos (S3 originals can be several MB) go through the
 * Next image optimizer at 1200px: link-preview bots get a light JPEG.
 */
export function ogImage(src: string | undefined | null, alt?: string): SeoImage | undefined {
  if (!src) return undefined;
  if (!/^https?:\/\//.test(src)) return { url: src, alt };
  return { url: `/_next/image?url=${encodeURIComponent(src)}&w=1200&q=75`, alt };
}

/** Unprefixed site path ("/galerie/x") -> the public path for `locale`. */
const localized = (locale: SeoLocale, path: string) => localizePath(locale, path);

export function pageMetadata({
  locale,
  path,
  title,
  description,
  image,
  type = "website",
  noindex = false,
}: {
  locale: SeoLocale;
  /** Unprefixed path: "/", "/galerie", "/galerie/<slug>". */
  path: string;
  /** Full title (brand included): rendered as-is, no template. */
  title: string;
  description: string;
  image?: SeoImage;
  type?: "website" | "article";
  noindex?: boolean;
}): Metadata {
  const url = localized(locale, path);
  const images = [image ?? DEFAULT_OG_IMAGE];
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [l, localized(l, path)])),
        "x-default": localized("fr", path),
      },
    },
    openGraph: {
      type,
      siteName: SITE_NAME,
      url,
      locale: OG_LOCALE[locale],
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      title,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((i) => i.url),
    },
    robots: noindex
      ? { index: false, follow: true }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
        },
  };
}

/** Absolute URL of an unprefixed path in `locale` (JSON-LD, sitemap). */
export const absoluteUrl = (locale: SeoLocale, path: string) => `${SITE_URL}${localized(locale, path)}`;
