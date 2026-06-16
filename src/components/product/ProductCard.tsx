"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ProductThumbnail } from "./ProductThumbnail";
import { ProductName } from "./ProductName";
import { Price } from "./Price";
import { AddToCart } from "./AddToCart";
import { QuickViewButton } from "./QuickViewButton";
import type { ProductCardData } from "@/lib/api/products";

type ProductCardProps = {
  product: ProductCardData;
  lang: string;
  priority?: boolean;
};

export function ProductCard({ product, lang, priority = false }: ProductCardProps) {
  const t = useTranslations("product");

  return (
    <article className="group flex flex-col rounded-xl border border-gray-100 bg-white overflow-hidden hover:shadow-md transition-shadow duration-200">
      <Link href={`/${lang}/products/${product.slug}`} className="relative block">
        <ProductThumbnail
          imageUrl={product.imageUrl}
          name={product.name}
          priority={priority}
        />
        {product.hasBulkBuy && (
          <span className="absolute top-2 left-2 rounded-md bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
            {t("bulkBuyTag")}
          </span>
        )}
        {product.hasVariations && (
          <span className={`absolute ${product.hasBulkBuy ? "top-8" : "top-2"} left-2 rounded-md bg-red-600 px-2 py-0.5 text-xs font-semibold text-white`}>
            {t("variationTag")}
          </span>
        )}
      </Link>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <Link href={`/${lang}/products/${product.slug}`} className="block">
          <ProductName name={product.name} as="h3" className="text-sm hover:underline" />
        </Link>

        {product.description && (
          <p className="text-xs text-gray-500 line-clamp-1">{product.description}</p>
        )}

        <div className="flex items-center justify-between mt-auto pt-2">
          <Price formatted={product.priceFormatted} originalFormatted={product.originalPriceFormatted} className="text-base" />
          {product.hasVariations ? (
            <QuickViewButton product={product} lang={lang} />
          ) : (
            <AddToCart productId={product.id} />
          )}
        </div>
      </div>
    </article>
  );
}
