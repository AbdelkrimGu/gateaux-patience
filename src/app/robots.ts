import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /qr/*.html are the raw files behind /contact (served via rewrite).
        disallow: ["/admin", "/api", "/qr/"],
      },
      // Allow AI crawlers explicitly
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
      },
      {
        userAgent: "anthropic-ai",
        allow: "/",
      },
      {
        userAgent: "CCBot",
        allow: "/",
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
      },
    ],
    sitemap: "https://gateaux-patience.dz/sitemap.xml",
  };
}
