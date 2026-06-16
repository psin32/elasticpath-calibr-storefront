import { notFound } from "next/navigation";
import { Header } from "@/components/header/Header";
import { ProductThumbnail } from "@/components/product/ProductThumbnail";
import { ProductName } from "@/components/product/ProductName";
import { ProductDescription } from "@/components/product/ProductDescription";
import { Price } from "@/components/product/Price";
import { QuantityAddToCart } from "@/components/product/QuantityAddToCart";
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

  const product = await getProductBySlug(slug).catch(() => null);
  if (!product) notFound();

  return (
    <div className="min-h-screen bg-white">
      <Header lang={lang} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 text-sm text-gray-500">
            <li>
              <Link href={`/${lang}`} className="hover:text-gray-900 transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">›</li>
            <li className="font-medium text-gray-900 truncate max-w-xs">{product.name}</li>
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

            {product.additionalImages && product.additionalImages.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {product.additionalImages.slice(0, 4).map((url, i) => (
                  <div
                    key={i}
                    className="rounded-lg overflow-hidden border border-gray-100 bg-gray-50 aspect-square relative"
                  >
                    <ProductThumbnail imageUrl={url} name={`${product.name} view ${i + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details */}
          <div className="flex flex-col">
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

            <div className="mb-6">
              <Price
                formatted={product.priceFormatted}
                originalFormatted={product.originalPriceFormatted}
                className="text-2xl"
              />
            </div>

            {product.description && (
              <div className="mb-8">
                <ProductDescription
                  description={product.description}
                  className="text-base"
                />
              </div>
            )}

            <QuantityAddToCart productId={product.id} />
          </div>
        </div>
      </main>
    </div>
  );
}
