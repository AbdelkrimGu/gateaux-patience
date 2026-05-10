import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://gateaux-patience.dz";
  const locales = ["", "/ar", "/en"];
  const routes = ["", "/galerie", "/a-propos", "/contact"];

  const urls: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const route of routes) {
      urls.push({
        url: `${baseUrl}${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === "" ? "daily" : "weekly",
        priority: route === "" ? 1 : 0.8,
      });
    }
  }

  return urls;
}
