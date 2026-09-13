import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

// Public, indexable routes only (hero-* previews are noindex, /a-propos doesn't exist).
const ROUTES = ["", "/galerie", "/tiramisu", "/contact"];
const LOCALES = ["fr", "ar", "en"] as const;

const localized = (locale: (typeof LOCALES)[number], route: string) =>
  `${SITE_URL}${locale === "fr" ? "" : `/${locale}`}${route}` || `${SITE_URL}/`;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return LOCALES.flatMap((locale) =>
    ROUTES.map((route) => ({
      url: localized(locale, route),
      lastModified,
      changeFrequency: route === "" || route === "/galerie" ? "weekly" : "monthly",
      priority: route === "" ? 1 : route === "/contact" ? 0.9 : 0.8,
      alternates: {
        languages: Object.fromEntries(LOCALES.map((l) => [l, localized(l, route)])),
      },
    }))
  );
}
