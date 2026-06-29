"use client";

import Link from "next/link";
import { Tag } from "lucide-react";
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
  variant?: "default" | "flat";
  /** Promotion label shown as a badge — only rendered in flat variant */
  promoInfo?: string;
  stackedPrice?: boolean;
};

export function ProductCard({
  product,
  lang,
  priority = false,
  variant = "default",
  promoInfo,
  stackedPrice = false,
}: ProductCardProps) {
  const t = useTranslations("product");

  if (variant === "flat") {
    return (
      <article className="group flex flex-col h-full rounded-xl border border-gray-100 bg-white overflow-hidden hover:shadow-md transition-shadow duration-200">
        <Link href={`/${lang}/products/${product.slug}`} className="relative block">
          <ProductThumbnail imageUrl={product.imageUrl} name={product.name} priority={priority} />
        </Link>

        <div className="p-3 flex flex-col gap-2 flex-1">
          <Link href={`/${lang}/products/${product.slug}`} className="block">
            <ProductName name={product.name} as="h3" className="text-xs hover:underline line-clamp-2" />
          </Link>

          <Price
            formatted={product.priceFormatted}
            originalFormatted={product.originalPriceFormatted}
            className="text-sm"
            stacked={stackedPrice}
          />

          {promoInfo && (
            <span className="inline-flex items-center gap-1 self-start text-[10px] font-semibold text-[#18804C] bg-[#EFFCF6] border border-[#A6EBCA] rounded-full px-2 py-0.5 leading-none">
              <Tag className="h-2.5 w-2.5 flex-none" />
              {promoInfo}
            </span>
          )}

          <div className="mt-auto pt-1">
            {product.hasVariations ? (
              <QuickViewButton product={product} lang={lang} />
            ) : (
              <AddToCart productId={product.id} variant="full" className="py-2 text-xs" />
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex flex-col h-full rounded-xl border border-gray-100 bg-white overflow-hidden hover:shadow-md transition-shadow duration-200">
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
          <ProductName name={product.name} as="h3" className="text-sm hover:underline line-clamp-3" />
        </Link>

        {product.description && (
          <p className="text-xs text-gray-500 line-clamp-1">{product.description}</p>
        )}

        <div className="flex items-center justify-between mt-auto pt-2">
          <Price formatted={product.priceFormatted} originalFormatted={product.originalPriceFormatted} className="text-base" stacked={stackedPrice} />
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
