import { notFound } from "next/navigation";
import { Header } from "@/components/header/Header";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getNodeBySlug, buildSiteNavigation } from "@/lib/api/navigation";
import { getProductsForNode, getFeaturedProducts } from "@/lib/api/products";
import type { Metadata } from "next";
import Link from "next/link";

type Props = {
  params: Promise<{ lang: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const node = await getNodeBySlug(slug).catch(() => null);
  return {
    title: node?.name ?? "Category",
    description: `Browse ${node?.name ?? "products"} from our catalog`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { lang, slug } = await params;

  const node = await getNodeBySlug(slug).catch(() => null);
  if (!node) notFound();

  const products = await getProductsForNode(node.id);

  return (
    <div className="min-h-screen bg-white">
      <Header lang={lang} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-gray-500">
            <li>
              <Link href={`/${lang}`} className="hover:text-gray-900 transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">›</li>
            <li className="font-medium text-gray-900">{node.name}</li>
          </ol>
        </nav>

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{node.name}</h1>
          {products.length > 0 && (
            <p className="mt-2 text-sm text-gray-500">
              {products.length} product{products.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <ProductGrid products={products} lang={lang} />
      </main>
    </div>
  );
}
