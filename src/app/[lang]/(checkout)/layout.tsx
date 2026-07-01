import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";

export default async function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
      <Toaster position="top-right" />
    </NextIntlClientProvider>
  );
}
