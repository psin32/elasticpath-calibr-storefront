import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import path from "path";

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
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      // Prevent duplicate React versions (important for Plasmic canvas host)
      react$: path.resolve("./node_modules/next/dist/compiled/react"),
      "react-dom$": path.resolve(
        "./node_modules/next/dist/compiled/react-dom"
      ),
    };
    return config;
  },
};

export default withNextIntl(nextConfig);
