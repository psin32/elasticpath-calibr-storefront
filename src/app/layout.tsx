import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Calibr by Elasticpath",
    template: "%s | Calibr by Elasticpath",
  },
  description: "Modern B2B & B2C storefront powered by Elastic Path",
  icons: {
    icon: "/favicon.ico",
  },
};

function buildThemeVars(): React.CSSProperties {
  const e = process.env;
  const norm = (v: string | undefined) =>
    v ? (v.startsWith("#") ? v : `#${v}`) : null;

  const vars: [string, string | undefined, string][] = [
    // Brand
    ["--color-brand-primary",   e.NEXT_PUBLIC_BRAND_PRIMARY,   "#000000"],
    ["--color-brand-secondary", e.NEXT_PUBLIC_BRAND_SECONDARY, "#144e31"],
    ["--color-brand-accent",    e.NEXT_PUBLIC_BRAND_ACCENT,    "#56dc9b"],
    ["--color-brand-muted",     e.NEXT_PUBLIC_BRAND_MUTED,     "#666666"],
    // Ink (neutrals)
    ["--color-ink-900", e.NEXT_PUBLIC_COLOR_INK_900, "#0e1521"],
    ["--color-ink-800", e.NEXT_PUBLIC_COLOR_INK_800, "#232c3a"],
    ["--color-ink-700", e.NEXT_PUBLIC_COLOR_INK_700, "#3d4654"],
    ["--color-ink-600", e.NEXT_PUBLIC_COLOR_INK_600, "#5c6675"],
    ["--color-ink-400", e.NEXT_PUBLIC_COLOR_INK_400, "#8c95a3"],
    ["--color-ink-300", e.NEXT_PUBLIC_COLOR_INK_300, "#c2c8d0"],
    ["--color-ink-200", e.NEXT_PUBLIC_COLOR_INK_200, "#dde1e6"],
    ["--color-ink-100", e.NEXT_PUBLIC_COLOR_INK_100, "#eef0f2"],
    ["--color-ink-50",  e.NEXT_PUBLIC_COLOR_INK_50,  "#f7f8f9"],
    // Semantic — success
    ["--color-success-600", e.NEXT_PUBLIC_COLOR_SUCCESS_600, "#18804c"],
    ["--color-success-500", e.NEXT_PUBLIC_COLOR_SUCCESS_500, "#21a765"],
    ["--color-success-400", e.NEXT_PUBLIC_COLOR_SUCCESS_400, "#2bcc7e"],
    // Semantic — error
    ["--color-error-700", e.NEXT_PUBLIC_COLOR_ERROR_700, "#a8341f"],
    ["--color-error-600", e.NEXT_PUBLIC_COLOR_ERROR_600, "#c2402b"],
    // Semantic — warning
    ["--color-warning-600", e.NEXT_PUBLIC_COLOR_WARNING_600, "#b26a00"],
  ];

  return Object.fromEntries(
    vars.map(([prop, envVal, def]) => [prop, norm(envVal) ?? def]),
  ) as React.CSSProperties;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning style={buildThemeVars()}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
