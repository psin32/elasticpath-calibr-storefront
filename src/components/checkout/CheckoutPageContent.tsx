"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ShoppingBag } from "lucide-react";
import { CheckoutForm } from "./CheckoutForm";
import { OrderSummary } from "./OrderSummary";
import { useCart } from "@/context/CartContext";
import { useCheckout } from "@/hooks/use-checkout";
import { useAccountAddresses } from "@/hooks/use-account-addresses";

type Props = { lang: string };

export function CheckoutPageContent({ lang }: Props) {
  const t = useTranslations("checkout");
  const { items, cartTotal } = useCart();
  const { submitCheckout, isLoading, error } = useCheckout(lang);
  const { addresses } = useAccountAddresses();

  if (items.length === 0) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-6">
          <ShoppingBag size={28} className="text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("emptyCart")}</h1>
        <p className="text-gray-500 mb-8">{t("emptyCartSubtitle")}</p>
        <Link
          href={`/${lang}`}
          className="inline-flex items-center px-6 py-3 rounded-lg bg-brand-primary text-white font-medium text-sm hover:opacity-90 transition-opacity"
        >
          {t("continueShopping")}
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <nav className="mb-8">
        <ol className="flex items-center gap-2 text-sm text-gray-500">
          <li>
            <Link href={`/${lang}`} className="hover:text-gray-900 transition-colors">
              {t("home")}
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li className="font-medium text-gray-900">{t("title")}</li>
        </ol>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">{t("title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 items-start">
        <CheckoutForm
          onSubmit={submitCheckout}
          isLoading={isLoading}
          error={error}
          savedAddresses={addresses}
        />
        <div className="lg:sticky lg:top-8">
          <OrderSummary items={items} cartTotal={cartTotal} />
        </div>
      </div>
    </main>
  );
}
