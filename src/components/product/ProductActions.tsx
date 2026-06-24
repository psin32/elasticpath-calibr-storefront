"use client";

import { useAuth } from "@/context/AuthContext";
import { BundleConfigurator } from "./BundleConfigurator";
import { VariantAddToCart } from "./VariantAddToCart";
import type { BundleComponent, ProductVariation } from "@/lib/api/products";

type Props = {
  productId: string;
  lang: string;
  isBundle?: boolean;
  components?: BundleComponent[];
  initialPrice?: string;
  initialOriginalPrice?: string;
  variations?: ProductVariation[];
  variationMatrix?: Record<string, unknown>;
  childSlugs?: Record<string, string>;
  selectedOptionIds?: string[];
  parentId?: string;
};

export function ProductActions({
  productId,
  lang,
  isBundle,
  components,
  initialPrice,
  initialOriginalPrice,
  variations,
  variationMatrix,
  childSlugs,
  selectedOptionIds,
  parentId,
}: Props) {
  const { credentials } = useAuth();
  const authKey = credentials?.selected ?? "guest";

  if (isBundle && components?.length) {
    return (
      <BundleConfigurator
        productId={productId}
        components={components}
        initialPrice={initialPrice}
        initialOriginalPrice={initialOriginalPrice}
      />
    );
  }

  return (
    <VariantAddToCart
      key={authKey}
      productId={productId}
      lang={lang}
      variations={variations}
      variationMatrix={variationMatrix}
      childSlugs={childSlugs}
      selectedOptionIds={selectedOptionIds}
      parentId={parentId}
    />
  );
}
