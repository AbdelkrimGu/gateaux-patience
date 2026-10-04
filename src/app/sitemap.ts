import type { MetadataRoute } from "next";
import { getSitemapCakes } from "@/lib/cakes-data";
import { absoluteUrl, type SeoLocale } from "@/lib/seo";

// Public, indexable routes only (/ui-kit and /admin are not listed).
const ROUTES = ["/", "/galerie", "/douceurs", "/tiramisu", "/contact"] as const;
const LOCALES: SeoLocale[] = ["fr", "ar", "en"];

// Regenerated like the catalogue pages; a DB error keeps the last good copy.
export const revalidate = 300;

const alternates = (path: string) => ({
  languages: Object.fromEntries(LOCALES.map((l) => [l, absoluteUrl(l, path)])),
});

const validDate = (iso: string | undefined) => {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime()) ? d : undefined;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cakes = await getSitemapCakes();
  // Home and /galerie change when a cake does: date them by the latest edit
  // (a stable value, unlike new Date() on every regeneration).
  const latest = cakes
    .map((c) => validDate(c.updatedAt))
    .filter((d): d is Date => !!d)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  const pages: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    ROUTES.map((route) => ({
      url: absoluteUrl(locale, route),
      ...(latest && (route === "/" || route === "/galerie") ? { lastModified: latest } : {}),
      changeFrequency: route === "/" || route === "/galerie" ? ("weekly" as const) : ("monthly" as const),
      priority: route === "/" ? 1 : route === "/contact" ? 0.9 : 0.8,
      alternates: alternates(route),
    }))
  );

  const details: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    cakes.map((cake) => {
      const path = `/galerie/${cake.slug}`;
      const lastModified = validDate(cake.updatedAt);
      return {
        url: absoluteUrl(locale, path),
        ...(lastModified ? { lastModified } : {}),
        changeFrequency: "monthly" as const,
        priority: 0.6,
        alternates: alternates(path),
      };
    })
  );

  return [...pages, ...details];
}
