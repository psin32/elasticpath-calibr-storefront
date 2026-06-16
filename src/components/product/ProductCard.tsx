import Link from "next/link";
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
  return (
    <article className="group flex flex-col rounded-xl border border-gray-100 bg-white overflow-hidden hover:shadow-md transition-shadow duration-200">
      <Link href={`/${lang}/products/${product.slug}`} className="block">
        <ProductThumbnail
          imageUrl={product.imageUrl}
          name={product.name}
          priority={priority}
        />
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
