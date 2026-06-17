import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/header/Header";
import { ProductThumbnail } from "@/components/product/ProductThumbnail";
import { ProductName } from "@/components/product/ProductName";
import { ProductDescription } from "@/components/product/ProductDescription";
import { Price } from "@/components/product/Price";
import { ProductActions } from "@/components/product/ProductActions";
import { BulkBuyOffer } from "@/components/product/BulkBuyOffer";
import { Badge } from "@/components/ui/Badge/Badge";
import { getProductBySlug } from "@/lib/api/products";
import type { Metadata } from "next";
import Link from "next/link";

type Props = {
  params: Promise<{ lang: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug).catch(() => null);
  return {
    title: product?.name ?? "Product",
    description: product?.description,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { lang, slug } = await params;

  const [product, t] = await Promise.all([
    getProductBySlug(slug).catch(() => null),
    getTranslations("product"),
  ]);
  if (!product) notFound();

  return (
    <div className="min-h-screen bg-white">
      <Header lang={lang} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 text-sm text-gray-500">
            <li>
              <Link
                href={`/${lang}`}
                className="hover:text-gray-900 transition-colors"
              >
                Home
              </Link>
            </li>
            <li aria-hidden="true">›</li>
            <li className="font-medium text-gray-900 truncate max-w-xs">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left: Images */}
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
              <ProductThumbnail
                imageUrl={product.imageUrl}
                name={product.name}
                className="w-full aspect-square"
                priority
              />
            </div>

            {product.additionalImages &&
              product.additionalImages.length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  {product.additionalImages.slice(0, 4).map((url, i) => (
                    <div
                      key={i}
                      className="rounded-lg overflow-hidden border border-gray-100 bg-gray-50 aspect-square relative"
                    >
                      <ProductThumbnail
                        imageUrl={url}
                        name={`${product.name} view ${i + 1}`}
                      />
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* Right: Details */}
          <div className="flex flex-col">
            {product.saleId && product.originalPriceFormatted && (
              <div className="mb-3">
                <Badge
                  variant="error"
                  size="sm"
                  className="bg-red-500 text-white uppercase tracking-wide px-3"
                >
                  {product.saleId}
                </Badge>
              </div>
            )}

            {product.sku && (
              <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">
                SKU: {product.sku}
              </p>
            )}

            <ProductName
              name={product.name}
              as="h1"
              className="text-3xl sm:text-4xl mb-4"
            />

            {!product.isBundle && (
              <div className="mb-6">
                <Price
                  formatted={product.priceFormatted}
                  originalFormatted={product.originalPriceFormatted}
                  className="text-2xl"
                />
              </div>
            )}

            {product.bulkBuyTiers && product.bulkBuyTiers.length > 0 && (
              <div className="mb-8">
                <BulkBuyOffer tiers={product.bulkBuyTiers} />
              </div>
            )}

            <ProductActions
              productId={product.id}
              lang={lang}
              isBundle={product.isBundle}
              components={product.components}
              initialPrice={product.priceFormatted}
              initialOriginalPrice={product.originalPriceFormatted}
              variations={product.variations}
              variationMatrix={product.variationMatrix}
              childSlugs={product.childSlugs}
              selectedOptionIds={product.selectedOptionIds}
            />

            {product.description && (
              <div className="mt-8">
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-widest mb-3">
                  {t("detailsLabel")}
                </h2>
                <ProductDescription
                  description={product.description}
                  className="text-base"
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
