"use client";

import { useState } from "react";
import { Package, Check, SlidersHorizontal, Minus, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { BundleComponentItem } from "./types";

type Props = {
  cartItemId: string;
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  imageUrl?: string;
  bundleComponents: BundleComponentItem[];
  onQuantityChange: (cartItemId: string, qty: number) => void;
  onRemove: (cartItemId: string) => void;
  disabled?: boolean;
};

export function BundleCartRow({
  cartItemId,
  name,
  sku,
  quantity,
  unitPrice,
  lineTotal,
  imageUrl,
  bundleComponents,
  onQuantityChange,
  onRemove,
  disabled,
}: Props) {
  const t = useTranslations("cart");
  const [draft, setDraft] = useState(String(quantity));

  const commitQty = (raw: string) => {
    const n = parseInt(raw, 10);
    if (!isNaN(n) && n >= 0) onQuantityChange(cartItemId, n);
    else setDraft(String(quantity));
  };

  return (
    <section className="bg-white border border-[#DDE1E6] rounded-2xl overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-[18px] border-b border-[#EEF0F2]">
        <span className="flex-none w-[46px] h-[46px] rounded-[11px] bg-gradient-to-br from-[#D6F8E5] to-[#FFB852] flex items-center justify-center text-[rgba(14,21,33,0.42)]">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={name} className="w-full h-full object-cover rounded-[11px]" />
          ) : (
            <Package size={24} />
          )}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[17px] text-[#0E1521] tracking-tight">{name}</span>
            <span className="font-mono text-[9px] tracking-[.1em] uppercase text-[#18804C] bg-[#EFFCF6] border border-[#A6EBCA] px-2 py-0.5 rounded-full">
              {t("bundle")}
            </span>
          </div>
          <div className="font-mono text-[12px] text-[#5C6675] mt-0.5">
            {sku && <span>{sku} · </span>}
            <span>{unitPrice} {t("perKit")}</span>
          </div>
        </div>

        <div className="text-right mr-4 shrink-0">
          <div className="text-[12px] text-[#5C6675]">{t("kits", { count: quantity })}</div>
          <div className="font-bold text-[17px] text-[#0E1521]">{lineTotal}</div>
        </div>

        <button
          onClick={() => onRemove(cartItemId)}
          disabled={disabled}
          className="flex items-center gap-1.5 h-9 px-3.5 rounded-[9px] border border-[#DDE1E6] bg-white text-[13px] font-semibold text-[#3D4654] hover:bg-[#F7F8F9] transition-colors disabled:opacity-40"
        >
          <Trash2 size={14} />
          {t("remove")}
        </button>
      </header>

      {/* Body */}
      <div className="flex">
        {/* Left: Components */}
        <div className="flex-1 p-[18px_22px]">
          <div className="font-mono text-[10px] tracking-[.1em] uppercase text-[#5C6675] mb-3">
            {t("whatsIncluded")}
          </div>
          <div className="grid grid-cols-2 gap-x-7 gap-y-3.5">
            {bundleComponents.map((c, idx) => (
              <div key={idx} className="flex items-start gap-[11px]">
                <span className="flex-none w-[26px] h-[26px] rounded-[8px] bg-[#EEF0F2] text-[#5C6675] flex items-center justify-center mt-0.5">
                  <Check size={14} />
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] text-[#5C6675]">{c.componentName}</div>
                  <div className="font-semibold text-[14px] text-[#0E1521] leading-snug line-clamp-2">
                    {c.productName}
                  </div>
                  {c.unitPriceFormatted && (
                    <div className="text-[12px] text-[#8C95A3] mt-0.5">{c.unitPriceFormatted}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Stepper */}
        <div className="flex-none w-[264px] border-l border-[#EEF0F2] bg-[#F7F8F9] p-[18px_22px] flex flex-col gap-4">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#18804C] bg-[#EFFCF6] border border-[#A6EBCA] px-3 py-1 rounded-full self-start">
            <Package size={14} />
            {t("stockIn")}
          </span>

          <div>
            <div className="font-mono text-[10px] tracking-[.1em] uppercase text-[#5C6675] mb-2.5">
              {t("kitsToOrder")}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onQuantityChange(cartItemId, Math.max(0, quantity - 1))}
                disabled={disabled || quantity <= 1}
                className="w-9 h-10 border border-[#DDE1E6] rounded-[10px] bg-white text-[#3D4654] flex items-center justify-center hover:bg-[#F7F8F9] transition-colors disabled:opacity-40"
              >
                <Minus size={16} />
              </button>
              <input
                type="number"
                value={draft}
                min={1}
                disabled={disabled}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={(e) => commitQty(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") commitQty((e.target as HTMLInputElement).value); }}
                className="w-14 h-10 text-center text-[14px] font-bold text-[#0E1521] border border-[#DDE1E6] rounded-[10px] bg-white outline-none focus:border-[#2BCC7E] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                onClick={() => onQuantityChange(cartItemId, quantity + 1)}
                disabled={disabled}
                className="w-9 h-10 border border-[#DDE1E6] rounded-[10px] bg-white text-[#3D4654] flex items-center justify-center hover:bg-[#F7F8F9] transition-colors disabled:opacity-40"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="flex justify-between items-baseline border-t border-[#DDE1E6] pt-3.5">
            <span className="text-[12px] text-[#5C6675]">{t("lineTotal")}</span>
            <span className="font-bold text-[18px] text-[#0E1521]">{lineTotal}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
