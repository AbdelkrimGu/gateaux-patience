import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const s3Bucket = process.env.S3_BUCKET || "gateaux-patience-media";
const s3Region = process.env.S3_REGION || "eu-west-3";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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
