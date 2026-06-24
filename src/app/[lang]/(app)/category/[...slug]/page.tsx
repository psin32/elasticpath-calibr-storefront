import { Fragment } from "react";
import { notFound } from "next/navigation";
import { Header } from "@/components/header/Header";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getNodeBySlug } from "@/lib/api/navigation";
import { getProductsForNode } from "@/lib/api/products";
import type { Metadata } from "next";
import Link from "next/link";

type Props = {
  params: Promise<{ lang: string; slug: string[] }>;
};

function slugToLabel(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const leafSlug = slug[slug.length - 1];
  const node = await getNodeBySlug(leafSlug).catch(() => null);
  return {
    title: node?.name ?? slugToLabel(leafSlug),
    description: `Browse ${node?.name ?? slugToLabel(leafSlug)} from our catalog`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { lang, slug } = await params;

  const leafSlug = slug[slug.length - 1];
  const node = await getNodeBySlug(leafSlug).catch(() => null);
  if (!node) notFound();

  const products = await getProductsForNode(node.id);

  // Build breadcrumb segments from URL path
  // e.g. ["men", "clothing", "suits"] → Home › Men › Clothing › Suits
  const breadcrumbs = slug.map((segment, i) => ({
    label: i === slug.length - 1 ? node.name : slugToLabel(segment),
    href: `/${lang}/category/${slug.slice(0, i + 1).join("/")}`,
    isCurrent: i === slug.length - 1,
  }));

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
            {breadcrumbs.map((crumb) => (
              <Fragment key={crumb.href}>
                <li aria-hidden="true">›</li>
                <li>
                  {crumb.isCurrent ? (
                    <span className="font-medium text-gray-900">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="hover:text-gray-900 transition-colors">
                      {crumb.label}
                    </Link>
                  )}
                </li>
              </Fragment>
            ))}
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
