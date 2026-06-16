import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Elasticpath Calibr",
    template: "%s | Elasticpath Calibr",
  },
  description: "Modern B2B & B2C storefront powered by Elastic Path",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
