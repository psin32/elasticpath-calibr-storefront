"use client";

import Link from "next/link";
import { ArrowRight, FileText, Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { PromoCodeInput } from "./PromoCodeInput";

type Props = {
  lang: string;
  lineCount: number;
  totalUnits: number;
};

export function CartSummaryPanel({ lang, lineCount, totalUnits }: Props) {
  const t = useTranslations("cart");
  const { isAuthenticated } = useAuth();
  const {
    cartTotal,
    cartSubtotal,
    cartDiscount,
    cartDiscountAmount,
    isLoading,
  } = useCart();

  const hasDiscount = cartDiscountAmount < 0 && !!cartSubtotal;

  return (
    <div className="bg-white border border-[#DDE1E6] rounded-[16px] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#DDE1E6] bg-[#F7F8F9]">
        <h2 className="font-semibold text-[15px] text-[#0E1521]">
          {t("orderSummary")}
        </h2>
        <p className="text-[12px] text-[#5C6675] mt-0.5">
          {t("units", { count: totalUnits })} ·{" "}
          {t("products", { count: lineCount })}
        </p>
      </div>

      {/* Totals */}
      <div className="px-6 py-5 space-y-3">
        {hasDiscount ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#5C6675]">
                {t("subtotal")}
              </span>
              <span className="text-[13px] text-[#5C6675]">{cartSubtotal}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[13px] text-[#21A765]">
                <Tag size={12} />
                {t("discount")}
              </span>
              <span className="text-[13px] font-semibold text-[#21A765]">
                {cartDiscount}
              </span>
            </div>
            <div className="h-px bg-[#DDE1E6]" />
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-semibold text-[#0E1521]">
                {t("total")}
              </span>
              <span className="text-[20px] font-bold text-[#0E1521]">
                {cartTotal}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold text-[#0E1521]">
              {t("total")}
            </span>
            <span className="text-[20px] font-bold text-[#0E1521]">
              {cartTotal}
            </span>
          </div>
        )}
      </div>

      {/* Promo code */}
      <div className="px-6 pb-4 border-t border-[#DDE1E6] pt-4">
        <PromoCodeInput />
      </div>

      {/* Actions */}
      <div className="px-6 pb-6 space-y-3">
        <Link
          href={lineCount === 0 ? "#" : `/${lang}/checkout`}
          aria-disabled={lineCount === 0}
          className={`w-full flex items-center justify-center gap-2 h-12 rounded-[11px] bg-[#0E1521] text-white font-bold text-[14px] transition-opacity${lineCount === 0 ? " opacity-40 cursor-not-allowed pointer-events-none" : " hover:opacity-90"}`}
        >
          {t("checkout")}
          <ArrowRight size={16} />
        </Link>

        {isAuthenticated && (
          <Link
            href={lineCount === 0 ? "#" : `/${lang}/quote-request`}
            aria-disabled={lineCount === 0}
            className={`w-full flex items-center justify-center gap-2 h-11 rounded-[11px] border border-[#C2C8D0] bg-white font-semibold text-[13px] text-[#3D4654] transition-colors${lineCount === 0 ? " opacity-40 cursor-not-allowed pointer-events-none" : " hover:bg-[#F7F8F9]"}`}
          >
            <FileText size={15} />
            {t("requestQuote")}
          </Link>
        )}

        <p className="text-[11px] text-[#8C95A3] text-center leading-snug">
          {t("shippingNote")}
        </p>
      </div>
    </div>
  );
}
