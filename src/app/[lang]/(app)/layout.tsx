import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { PreferencesProvider } from "@/context/PreferencesContext";
import { FooterSection } from "@/components/footer/FooterSection";
import { ClientProvider } from "@/components/ClientProvider";
import { Toaster } from "sonner";
import { PromotionSuggestionsModal } from "@/components/cart/PromotionSuggestionsModal";
export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const [messages, { lang }] = await Promise.all([getMessages(), params]);

  return (
    <NextIntlClientProvider messages={messages}>
      <ClientProvider>
        <PreferencesProvider>
          <AuthProvider>
            <CartProvider>
            {children}
            <FooterSection lang={lang} />
            <PromotionSuggestionsModal lang={lang} />
            <Toaster position="bottom-right" richColors />
            </CartProvider>
          </AuthProvider>
        </PreferencesProvider>
      </ClientProvider>
    </NextIntlClientProvider>
  );
}
