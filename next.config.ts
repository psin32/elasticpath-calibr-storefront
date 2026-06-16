import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { hostname: "**.epusercontent.com" },
      { hostname: "**.cm.elasticpath.com" },
      { hostname: "**.cloudfront.net" },
      { hostname: "**.**.com" },
    ],
  },
};

export default withNextIntl(nextConfig);
