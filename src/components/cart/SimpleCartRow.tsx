"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

type Props = {
  cartItemId: string;
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  imageUrl?: string;
  onQuantityChange: (cartItemId: string, qty: number) => void;
  onRemove: (cartItemId: string) => void;
  disabled?: boolean;
};

export function SimpleCartRow({
  cartItemId,
  name,
  sku,
  quantity,
  unitPrice,
  lineTotal,
  imageUrl,
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
    <section className="bg-white border border-[#DDE1E6] rounded-[14px] overflow-hidden">
      <div className="flex items-center gap-3 px-[18px] py-[13px] bg-[#F7F8F9] border-b border-[#DDE1E6] flex-wrap">
        <span className="font-bold text-[15px] text-[#0E1521]">{name}</span>
        {sku && <span className="font-mono text-[11px] text-[#5C6675]">{sku}</span>}
        {unitPrice && <span className="text-[12px] text-[#5C6675]">· {unitPrice}{t("perUnit")}</span>}
        <div className="flex-1" />
        <span className="font-extrabold text-[15px] text-[#0E1521]">{lineTotal}</span>
      </div>

      <div className="flex items-center gap-4 px-[18px] py-3.5 flex-wrap">
        {/* Thumbnail */}
        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#EEF0F2] border border-[#DDE1E6] flex-none">
          {imageUrl ? (
            <Image src={imageUrl} alt={name} fill sizes="48px" className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag size={18} className="text-[#C2C8D0]" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-[#5C6675]">{unitPrice} {t("each")}</p>
        </div>

        {/* Inline stepper */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={() => onQuantityChange(cartItemId, Math.max(0, quantity - 1))}
            disabled={disabled || quantity <= 1}
            className="w-[30px] h-[34px] border border-[#DDE1E6] rounded-[7px] bg-white text-[#3D4654] flex items-center justify-center hover:bg-[#EEF0F2] transition-colors disabled:opacity-40"
          >
            <Minus size={14} />
          </button>
          <input
            type="number"
            value={draft}
            min={0}
            disabled={disabled}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => commitQty(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") commitQty((e.target as HTMLInputElement).value); }}
            className="w-[54px] h-[34px] text-center text-[14px] font-bold text-[#0E1521] border border-[#DDE1E6] rounded-[7px] bg-white outline-none focus:border-[#2BCC7E] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            onClick={() => onQuantityChange(cartItemId, quantity + 1)}
            disabled={disabled}
            className="w-[30px] h-[34px] border border-[#DDE1E6] rounded-[7px] bg-white text-[#3D4654] flex items-center justify-center hover:bg-[#EEF0F2] transition-colors disabled:opacity-40"
          >
            <Plus size={14} />
          </button>
        </div>

        <button
          onClick={() => onRemove(cartItemId)}
          disabled={disabled}
          className="flex items-center gap-1.5 h-[30px] px-3 rounded-[7px] border border-[#DDE1E6] bg-white text-[12px] font-semibold text-[#5C6675] hover:bg-[#EEF0F2] transition-colors disabled:opacity-40"
        >
          <Trash2 size={13} />
          {t("remove")}
        </button>
      </div>
    </section>
  );
}
