import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const s3Bucket = process.env.S3_BUCKET || "gateaux-patience-media";
const s3Region = process.env.S3_REGION || "eu-west-3";

// Netlify sets CONTEXT at build time: production | branch-deploy | deploy-preview | dev.
// Previews must never be indexed (they share the production content).
const isPreviewBuild = Boolean(process.env.CONTEXT) && process.env.CONTEXT !== "production";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return isPreviewBuild
      ? [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }]
      : [];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Next 16 changed these defaults; pin the Next 14 behaviour for parity.
    minimumCacheTTL: 60,
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: `${s3Bucket}.s3.${s3Region}.amazonaws.com`,
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: `s3.${s3Region}.amazonaws.com`,
        pathname: `/${s3Bucket}/**`,
      },
    ],
  },
};

export default withNextIntl(nextConfig);
