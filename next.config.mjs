import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const s3Bucket = process.env.S3_BUCKET || "gateaux-patience-media";
const s3Region = process.env.S3_REGION || "eu-west-3";

/** @type {import('next').NextConfig} */
const nextConfig = {
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
