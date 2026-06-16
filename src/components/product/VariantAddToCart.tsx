"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ProductVariation } from "@/lib/api/products";
import { ProductVariationSelector } from "./ProductVariationSelector";
import { QuantityAddToCart } from "./QuantityAddToCart";

type Props = {
  productId: string;
  lang: string;
  variations?: ProductVariation[];
  variationMatrix?: Record<string, unknown>;
  childSlugs?: Record<string, string>;
  selectedOptionIds?: string[];
  navigateOnSelect?: boolean;
  onVariantResolved?: (childId: string | null) => void;
};

export function VariantAddToCart({
  productId,
  lang,
  variations,
  variationMatrix,
  childSlugs,
  selectedOptionIds,
  navigateOnSelect = true,
  onVariantResolved,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const t = useTranslations("product");

  const initialSelectedOptions = useMemo(() => {
    if (!selectedOptionIds?.length || !variations?.length) return {};
    const result: Record<string, string> = {};
    for (const variation of variations) {
      const match = variation.options.find((o) => selectedOptionIds.includes(o.id));
      if (match) result[variation.id] = match.id;
    }
    return result;
  }, [selectedOptionIds, variations]);

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(
    initialSelectedOptions,
  );

  const [resolvedProductId, setResolvedProductId] = useState<string | null>(
    selectedOptionIds?.length ? productId : null,
  );

  const hasVariations = !!variations?.length && !!variationMatrix;
  const allSelected = hasVariations && variations!.every((v) => selectedOptions[v.id]);
  const effectiveProductId = hasVariations ? (resolvedProductId ?? productId) : productId;

  function handleOptionChange(variationId: string, optionId: string) {
    setSelectedOptions((prev) => ({ ...prev, [variationId]: optionId }));
  }

  function handleProductResolved(childId: string | null) {
    setResolvedProductId(childId);
    onVariantResolved?.(childId);
    if (navigateOnSelect && childId && childSlugs?.[childId]) {
      startTransition(() => {
        router.replace(`/${lang}/products/${childSlugs[childId]}`);
      });
    }
  }

  return (
    <div className="space-y-6">
      {hasVariations && (
        <ProductVariationSelector
          variations={variations!}
          variationMatrix={variationMatrix!}
          selectedOptions={selectedOptions}
          onOptionChange={handleOptionChange}
          onProductResolved={handleProductResolved}
        />
      )}

      <div className="relative group/cart">
        <div className={hasVariations && !allSelected ? "opacity-50 pointer-events-none" : ""}>
          <QuantityAddToCart productId={effectiveProductId} />
        </div>
        {hasVariations && !allSelected && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/cart:opacity-100 transition-opacity pointer-events-none z-10">
            {t("selectAllOptions")}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </div>
        )}
      </div>
    </div>
  );
}
