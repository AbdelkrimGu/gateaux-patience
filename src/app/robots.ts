import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

// /qr/*.html are the raw files behind /contact (served via rewrite).
const PRIVATE = ["/admin", "/api", "/qr/"];

// AI crawlers are welcome on the public site. A crawler that matches a named
// group ignores the `*` group entirely, so each named group repeats the
// disallows (otherwise they could crawl /admin and /api).
const AI_BOTS = ["GPTBot", "Google-Extended", "anthropic-ai", "ClaudeBot", "CCBot", "PerplexityBot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      ...AI_BOTS.map((userAgent) => ({ userAgent, allow: "/", disallow: PRIVATE })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
