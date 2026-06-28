"use client";

import { useState, useEffect } from "react";
import { X, Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCart } from "@/context/CartContext";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/Button";
import type { ProductCardData } from "@/lib/api/products";

export function PromotionSuggestionsModal({ lang }: { lang: string }) {
  const { promotionSuggestions, clearPromotionSuggestions } = useCart();
  const t = useTranslations("cart");
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!promotionSuggestions?.length) {
      setProducts([]);
      return;
    }
    const skus = [
      ...new Set(
        promotionSuggestions.flatMap((s) => s.targets.flatMap((tgt) => tgt.skus)),
      ),
    ];
    if (!skus.length) return;

    setLoading(true);
    fetch(`/api/catalog/products?skus=${encodeURIComponent(skus.join(","))}`)
      .then((r) => r.json())
      .then((body) => setProducts(body.data ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [promotionSuggestions]);

  if (!promotionSuggestions?.length) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="fixed inset-0 bg-black/40"
        onClick={clearPromotionSuggestions}
        aria-hidden="true"
      />
      <div className="relative bg-white w-full sm:max-w-4xl rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[80vh]">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-brand-primary flex-shrink-0" />
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {t("promotionModalTitle")}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {promotionSuggestions.map((s) => s.info).join(" · ")}
              </p>
            </div>
          </div>
          <button
            onClick={clearPromotionSuggestions}
            className="ml-4 rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label={t("promotionModalDismiss")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 flex-1">
          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-gray-100 overflow-hidden animate-pulse"
                >
                  <div className="aspect-square bg-gray-100" />
                  <div className="p-3 space-y-2">
                    <div className="h-3.5 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && products.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  lang={lang}
                />
              ))}
            </div>
          )}

          {!loading && products.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">
              {t("promotionModalNoProducts")}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100">
          <Button variant="outline" className="w-full" onClick={clearPromotionSuggestions}>
            {t("promotionModalDismiss")}
          </Button>
        </div>
      </div>
    </div>
  );
}
