"use client";

// Side-effect import: runs all registerComponent() calls before PlasmicCanvasHost boots.
import "@/components/plasmic/plasmic-registrations";
import { PLASMIC } from "@/components/plasmic/plasmic-loader";
import { PlasmicCanvasHost } from "@plasmicapp/loader-nextjs";
import { NextIntlClientProvider } from "next-intl";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import enMessages from "../../../messages/en.json";

export default function PlasmicHostPage() {
  if (!PLASMIC) {
    return (
      <p style={{ padding: "2rem", fontFamily: "monospace" }}>
        Plasmic is not configured. Set NEXT_PUBLIC_PLASMIC_PROJECT_ID and
        NEXT_PUBLIC_PLASMIC_API_TOKEN in your .env file.
      </p>
    );
  }

  return (
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <AuthProvider>
        <CartProvider>
          <PlasmicCanvasHost />
        </CartProvider>
      </AuthProvider>
    </NextIntlClientProvider>
  );
}
