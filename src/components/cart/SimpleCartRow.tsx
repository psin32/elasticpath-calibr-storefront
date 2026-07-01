"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { CartItemDiscount, ProductField } from "@/context/CartContext";
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
  productFields?: ProductField[];
  onQuantityChange: (cartItemId: string, qty: number) => void;
  onRemove: (cartItemId: string) => void;
  disabled?: boolean;
  bulkMode?: boolean;
  pendingQty?: number;
  onPendingChange?: (cartItemId: string, qty: number) => void;
};

export function SimpleCartRow({
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
  productFields,
  onQuantityChange,
  onRemove,
  disabled,
  bulkMode = false,
  pendingQty,
  onPendingChange,
}: Props) {
  const t = useTranslations("cart");
  const [draft, setDraft] = useState(String(quantity));

  const isPending = bulkMode && pendingQty !== undefined && pendingQty !== quantity;

  useEffect(() => {
    setDraft(bulkMode && pendingQty !== undefined ? String(pendingQty) : String(quantity));
  }, [quantity, bulkMode, pendingQty]);

  const commitQty = (raw: string) => {
    const n = parseInt(raw, 10);
    if (isNaN(n) || n < 0) {
      setDraft(bulkMode && pendingQty !== undefined ? String(pendingQty) : String(quantity));
      return;
    }
    if (bulkMode) {
      onPendingChange?.(cartItemId, n);
      return;
    }
    if (n === quantity) { setDraft(String(quantity)); return; }
    onQuantityChange(cartItemId, n);
  };

  const effectiveQty = bulkMode && pendingQty !== undefined ? pendingQty : quantity;

  return (
    <div className={isSubscription ? "relative mt-3" : undefined}>
      {isSubscription && (
        <div className="absolute -top-3 left-0 right-0 flex justify-center z-10 pointer-events-none">
          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-semibold bg-blue-600 text-white shadow-sm">
            {t("subscription")}
          </span>
        </div>
      )}
    <section className={`bg-white border rounded-[14px] overflow-hidden ${isSubscription ? "border-blue-600" : "border-ink-200"}`}>
      <div className="flex items-center gap-3 px-[18px] py-[13px] bg-ink-50 border-b border-ink-200 flex-wrap">
        <span className="font-bold text-[15px] text-ink-900">{name}</span>
        {sku && <span className="font-mono text-[11px] text-ink-600">{sku}</span>}
        {isSubscription && (subscriptionPlanName || subscriptionFrequency) && (
          <span className="text-[12px] text-ink-600">
            {[subscriptionPlanName, subscriptionFrequency].filter(Boolean).join(" · ")}
          </span>
        )}
        {unitPrice && (
          <span className="text-[12px] text-ink-600">· {unitPrice}{t("perUnit")}</span>
        )}
        <div className="flex-1" />
        <span className="font-extrabold text-[15px] text-ink-900">
          {lineTotalOriginal && (
            <span className="line-through mr-1.5 text-[13px] font-normal text-ink-400">{lineTotalOriginal}</span>
          )}
          {lineTotal}
        </span>
      </div>
      {discounts?.map((d) => (
        <PromoTooltip
          key={d.promotionId}
          discount={d}
          label={d.promotionName ?? t("promotion")}
          className="px-[18px] py-1.5 bg-green-50 border-b border-green-100 text-[12px] text-green-700"
        />
      ))}

      {productFields && productFields.length > 0 && (
        <div className="px-[18px] py-2 border-b border-ink-100 flex flex-col gap-0.5">
          {productFields.map((f) => (
            <span key={f.key} className="text-[12px] text-ink-600">
              <span className="font-medium text-ink-700">{f.label}:</span> {f.value}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 px-[18px] py-3.5 flex-wrap">
        {/* Thumbnail */}
        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-ink-100 border border-ink-200 flex-none">
          {imageUrl ? (
            <Image src={imageUrl} alt={name} fill sizes="48px" className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag size={18} className="text-ink-300" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-ink-600">{unitPrice} {t("each")}</p>
        </div>

        {/* Inline stepper */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={() => {
              if (bulkMode) onPendingChange?.(cartItemId, Math.max(0, effectiveQty - 1));
              else onQuantityChange(cartItemId, Math.max(0, quantity - 1));
            }}
            disabled={disabled || effectiveQty <= 1}
            className="w-[30px] h-[34px] border border-ink-200 rounded-[7px] bg-white text-ink-700 flex items-center justify-center hover:bg-ink-100 transition-colors disabled:opacity-40"
          >
            <Minus size={14} />
          </button>
          <div className="relative">
            <input
              type="number"
              value={draft}
              min={0}
              disabled={disabled}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={(e) => commitQty(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") commitQty((e.target as HTMLInputElement).value); }}
              className={[
                "w-[54px] h-[34px] text-center text-[14px] font-bold text-ink-900 rounded-[7px] border outline-none transition-colors",
                "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                isPending
                  ? "border-amber-300 bg-amber-50 focus:border-amber-400"
                  : "border-ink-200 bg-white focus:border-success-400",
              ].join(" ")}
            />
            {isPending && (
              <span className="absolute -top-1 -right-1 w-[6px] h-[6px] rounded-full bg-amber-400" />
            )}
          </div>
          <button
            onClick={() => {
              if (bulkMode) onPendingChange?.(cartItemId, effectiveQty + 1);
              else onQuantityChange(cartItemId, quantity + 1);
            }}
            disabled={disabled}
            className="w-[30px] h-[34px] border border-ink-200 rounded-[7px] bg-white text-ink-700 flex items-center justify-center hover:bg-ink-100 transition-colors disabled:opacity-40"
          >
            <Plus size={14} />
          </button>
        </div>

        <button
          onClick={() => onRemove(cartItemId)}
          disabled={disabled}
          className="flex items-center gap-1.5 h-[30px] px-3 rounded-[7px] border border-ink-200 bg-white text-[12px] font-semibold text-ink-600 hover:bg-ink-100 transition-colors disabled:opacity-40"
        >
          <Trash2 size={13} />
          {t("remove")}
        </button>
      </div>
    </section>
    </div>
  );
}
