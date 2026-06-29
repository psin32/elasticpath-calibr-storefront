"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ShoppingBag, X, Trash2, ArrowRight, Minus, Plus, Eraser, Tag } from "lucide-react";
import { PromoTooltip } from "@/components/cart/PromoTooltip";
import { PromotionCarousel } from "@/components/cart/PromotionCarousel";
import { useTranslations } from "next-intl";
import { useCart } from "@/context/CartContext";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { usePreferences } from "@/context/PreferencesContext";

export function CartButton() {
  const t = useTranslations("header");
  const tCart = useTranslations("cart");
  const { items, itemCount, cartTotal, cartSubtotal, cartDiscount, cartDiscountAmount, isLoading, removeItem, updateQuantity, clearCart, promotionSuggestions } =
    useCart();
  const [confirmClear, setConfirmClear] = useState(false);
  const { cartMode } = usePreferences();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const lang = pathname.split("/")[1] ?? "en";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when open; reset confirm state on close
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setConfirmClear(false);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const drawer = isOpen && (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] animate-fade-in"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("cart")}
        className="fixed top-0 right-0 h-screen w-full max-w-lg bg-white shadow-2xl z-[9999] flex flex-col animate-slide-in-right"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <ShoppingBag size={20} className="text-gray-700" />
            <h2 className="text-base font-semibold text-gray-900">
              {t("cart")}
            </h2>
            {itemCount > 0 && (
              <span className="flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                {itemCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              confirmClear ? (
                <>
                  <span className="text-xs text-gray-500">{t("clearAll")}</span>
                  <button
                    onClick={async () => { await clearCart(); setConfirmClear(false); }}
                    disabled={isLoading}
                    className="h-7 px-2.5 rounded-md bg-red-500 text-white text-xs font-semibold hover:bg-red-600 disabled:opacity-40 transition-colors"
                  >
                    {t("clearAllConfirm")}
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="flex items-center justify-center w-7 h-7 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  disabled={isLoading}
                  title={t("clearAllItems")}
                  className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-red-400 hover:bg-gray-100 transition-colors disabled:opacity-40"
                >
                  <Eraser size={16} />
                </button>
              )
            )}
            <button
              onClick={() => setIsOpen(false)}
              aria-label={t("close")}
              className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Items — scrollable middle section */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {items.length === 0 ? (
            <EmptyCart onClose={() => setIsOpen(false)} />
          ) : (
            <>
              <ul className="divide-y divide-gray-100">
              {items.map((item) => (
                <li key={item.id} className="px-6 py-5">
                  <div className="flex gap-4 items-start">
                    {/* Thumbnail */}
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                      {item.imageHref ? (
                        <Image
                          src={item.imageHref}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag size={20} className="text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">
                        {item.name}
                      </p>
                      {item.sku && (
                        <p className="mt-0.5 text-xs text-gray-400">
                          {t("sku")}: {item.sku}
                        </p>
                      )}
                      {item.bundleComponents && item.bundleComponents.length > 0 && (
                        <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50 divide-y divide-gray-100 overflow-hidden">
                          {item.bundleComponents.map((c, idx) => (
                            <div key={idx} className="px-3 py-2 flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider leading-none mb-0.5">
                                  {c.componentName}
                                </p>
                                <p className="text-xs text-gray-700 line-clamp-2 leading-snug">
                                  {c.productName}
                                </p>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-xs font-semibold text-gray-700">
                                  ×{c.quantity}
                                </p>
                                {c.unitPriceFormatted && (
                                  <p className="text-[11px] text-gray-400 leading-tight">
                                    {c.unitPriceFormatted}
                                  </p>
                                )}
                                {c.lineTotalFormatted && c.quantity > 1 && (
                                  <p className="text-[11px] font-medium text-gray-600 leading-tight">
                                    {c.lineTotalFormatted}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="mt-0.5 text-xs text-gray-500">
                        {item.unitPriceFormatted} {t("each")}
                      </p>

                      {item.discounts?.map((d) => (
                        <PromoTooltip
                          key={d.promotionId}
                          discount={d}
                          label={d.promotionName ?? t("promotion")}
                          className="mt-1 text-[11px] text-green-700"
                        />
                      ))}

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <CartItemStepper
                          itemId={item.id}
                          quantity={item.quantity}
                          disabled={isLoading}
                          updateQuantity={updateQuantity}
                        />

                        {/* Line total */}
                        <span className="text-sm font-semibold text-gray-900">
                          {item.lineTotalOriginalFormatted && (
                            <span className="line-through mr-1.5 text-xs font-normal text-gray-400">
                              {item.lineTotalOriginalFormatted}
                            </span>
                          )}
                          {item.lineTotalFormatted}
                        </span>
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={isLoading}
                      aria-label={t("removeItem", { name: item.name })}
                      className="p-1 rounded text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {promotionSuggestions && promotionSuggestions.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <Tag size={14} className="text-[#18804C] flex-none" />
                  <h3 className="text-[13px] font-semibold text-[#0E1521]">{tCart("offersForYou")}</h3>
                </div>
                <p className="text-[11px] text-[#5C6675] mb-3">{tCart("offersEmpty")}</p>
                <PromotionCarousel suggestions={promotionSuggestions} lang={lang} flat />
              </div>
            )}
            </>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="shrink-0 border-t border-gray-100 px-6 py-5 space-y-3 bg-gray-50/60">
            {cartDiscountAmount < 0 && cartSubtotal ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{t("subtotal")}</span>
                  <span className="text-sm text-gray-500">{cartSubtotal}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-600">{t("discount")}</span>
                  <span className="text-sm font-semibold text-green-600">{cartDiscount}</span>
                </div>
                <div className="h-px bg-gray-200" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">{t("total")}</span>
                  <span className="text-lg font-bold text-gray-900">{cartTotal}</span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{t("subtotal")}</span>
                <span className="text-lg font-bold text-gray-900">{cartTotal}</span>
              </div>
            )}
            <Link
              href={`/${lang}/checkout`}
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
            >
              {t("checkout")}
              <ArrowRight size={16} />
            </Link>
            <p className="text-xs text-gray-400 text-center">
              {t("shippingNote")}
            </p>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => cartMode === "full" ? router.push(`/${lang}/cart`) : setIsOpen(true)}
        aria-label={`${t("cart")}${itemCount > 0 ? ` (${itemCount})` : ""}`}
        className="relative flex items-center justify-center w-9 h-9 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
      >
        <ShoppingBag size={20} />
        {itemCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-brand-primary text-white text-[10px] font-bold leading-none"
          >
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        )}
      </button>

      {/* Portal: renders directly on document.body, outside the header */}
      {mounted && createPortal(drawer, document.body)}
    </>
  );
}

type CartItemStepperProps = {
  itemId: string;
  quantity: number;
  disabled: boolean;
  updateQuantity: (id: string, qty: number) => void;
};

function CartItemStepper({ itemId, quantity, disabled, updateQuantity }: CartItemStepperProps) {
  const t = useTranslations("header");
  const [draft, setDraft] = useState(String(quantity));

  useEffect(() => {
    setDraft(String(quantity));
  }, [quantity]);

  const commit = (raw: string) => {
    const n = parseInt(raw, 10);
    if (!isNaN(n) && n >= 0) {
      updateQuantity(itemId, n);
    } else {
      setDraft(String(quantity));
    }
  };

  return (
    <div className="inline-flex items-center rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => updateQuantity(itemId, quantity - 1)}
        disabled={disabled}
        aria-label={t("decreaseQuantity")}
        className="flex items-center justify-center w-7 h-7 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-40"
      >
        <Minus size={12} />
      </button>
      <input
        type="number"
        inputMode="numeric"
        value={draft}
        min={0}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit((e.target as HTMLInputElement).value);
        }}
        aria-label={t("quantity")}
        className="w-8 h-7 text-center text-sm font-medium text-gray-900 bg-transparent border-x border-gray-200 focus:outline-none disabled:opacity-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        onClick={() => updateQuantity(itemId, quantity + 1)}
        disabled={disabled}
        aria-label={t("increaseQuantity")}
        className="flex items-center justify-center w-7 h-7 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-40"
      >
        <Plus size={12} />
      </button>
    </div>
  );
}

function EmptyCart({ onClose }: { onClose: () => void }) {
  const t = useTranslations("header");
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-4 py-20">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
        <ShoppingBag size={28} className="text-gray-300" />
      </div>
      <div>
        <p className="text-base font-medium text-gray-700">{t("cartEmpty")}</p>
        <p className="mt-1 text-sm text-gray-400">{t("emptyHint")}</p>
      </div>
      <button
        onClick={onClose}
        className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-brand-secondary hover:underline"
      >
        {t("browseProducts")}
        <ArrowRight size={14} />
      </button>
    </div>
  );
}
