"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { CartItemDiscount } from "@/context/CartContext";
import { PromoTooltip } from "./PromoTooltip";

type Props = {
  cartItemId: string;
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  lineTotalOriginal?: string;
  imageUrl?: string;
  discounts?: CartItemDiscount[];
  isSubscription?: boolean;
  subscriptionPlanName?: string;
  subscriptionFrequency?: string;
  onQuantityChange: (cartItemId: string, qty: number) => void;
  onRemove: (cartItemId: string) => void;
  disabled?: boolean;
};

export function SimpleCartRowList({
  cartItemId,
  name,
  sku,
  quantity,
  unitPrice,
  lineTotal,
  lineTotalOriginal,
  imageUrl,
  discounts,
  isSubscription,
  subscriptionPlanName,
  subscriptionFrequency,
  onQuantityChange,
  onRemove,
  disabled,
}: Props) {
  const t = useTranslations("cart");
  const [draft, setDraft] = useState(String(quantity));

  useEffect(() => {
    setDraft(String(quantity));
  }, [quantity]);

  const commitQty = (raw: string) => {
    const n = parseInt(raw, 10);
    if (isNaN(n) || n < 0) { setDraft(String(quantity)); return; }
    if (n === quantity) { setDraft(String(quantity)); return; }
    onQuantityChange(cartItemId, n);
  };

  return (
    <div className={isSubscription ? "relative mt-3" : undefined}>
      {isSubscription && (
        <div className="absolute -top-3 left-0 right-0 flex justify-center z-10 pointer-events-none">
          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-semibold bg-blue-600 text-white shadow-sm">
            {t("subscription")}
          </span>
        </div>
      )}
    <article className={`bg-white border rounded-[16px] p-5 flex gap-5 transition-colors ${isSubscription ? "border-blue-600 hover:border-blue-700" : "border-[#DDE1E6] hover:border-[#C2C8D0]"}`}>
      {/* Image */}
      <div className="relative w-[100px] h-[100px] flex-none rounded-[12px] overflow-hidden bg-[#EEF0F2] border border-[#DDE1E6] self-start">
        {imageUrl ? (
          <Image src={imageUrl} alt={name} fill sizes="100px" className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag size={28} className="text-[#C2C8D0]" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        {/* Name + remove */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-semibold text-[15px] text-[#0E1521] leading-snug">{name}</p>
            {sku && (
              <p className="text-[12px] text-[#8C95A3] font-mono mt-0.5">{t("sku")}: {sku}</p>
            )}
            {isSubscription && (subscriptionPlanName || subscriptionFrequency) && (
              <p className="text-[12px] text-[#5C6675] mt-0.5">
                {[subscriptionPlanName, subscriptionFrequency].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <button
            onClick={() => onRemove(cartItemId)}
            disabled={disabled}
            aria-label={t("remove")}
            className="flex-none p-1.5 rounded-[8px] text-[#C2C8D0] hover:text-[#C2402B] hover:bg-[#FFF0EE] transition-colors disabled:opacity-40"
          >
            <Trash2 size={15} />
          </button>
        </div>

        {/* Unit price */}
        <p className="text-[13px] text-[#5C6675]">
          {unitPrice} <span className="text-[#8C95A3]">{t("perUnit")}</span>
        </p>

        {/* Discount badges */}
        {discounts?.map((d) => (
          <PromoTooltip
            key={d.promotionId}
            discount={d}
            label={d.promotionName ?? t("promotion")}
            className="text-[12px] text-green-700 w-fit"
          />
        ))}

        {/* Quantity + line total */}
        <div className="mt-auto pt-3 flex items-center justify-between gap-4 flex-wrap">
          {/* Stepper */}
          <div className="flex items-center rounded-[10px] border border-[#DDE1E6] overflow-hidden">
            <button
              onClick={() => onQuantityChange(cartItemId, Math.max(0, quantity - 1))}
              disabled={disabled || quantity <= 1}
              aria-label={t("decreaseQuantity")}
              className="w-9 h-9 flex items-center justify-center text-[#5C6675] hover:bg-[#EEF0F2] transition-colors disabled:opacity-40"
            >
              <Minus size={13} />
            </button>
            <input
              type="number"
              inputMode="numeric"
              value={draft}
              min={0}
              disabled={disabled}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={(e) => commitQty(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") commitQty((e.target as HTMLInputElement).value); }}
              aria-label={t("quantity")}
              className="w-12 h-9 text-center text-[14px] font-semibold text-[#0E1521] bg-transparent border-x border-[#DDE1E6] focus:outline-none focus:border-x-[#2BCC7E] disabled:opacity-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={() => onQuantityChange(cartItemId, quantity + 1)}
              disabled={disabled}
              aria-label={t("increaseQuantity")}
              className="w-9 h-9 flex items-center justify-center text-[#5C6675] hover:bg-[#EEF0F2] transition-colors disabled:opacity-40"
            >
              <Plus size={13} />
            </button>
          </div>

          {/* Line total */}
          <div className="text-right">
            {lineTotalOriginal && (
              <p className="text-[12px] text-[#9BA3AF] line-through leading-none mb-0.5">{lineTotalOriginal}</p>
            )}
            <p className={`text-[17px] font-bold leading-none ${lineTotalOriginal ? "text-[#C2402B]" : "text-[#0E1521]"}`}>
              {lineTotal}
            </p>
          </div>
        </div>
      </div>
    </article>
    </div>
  );
}
