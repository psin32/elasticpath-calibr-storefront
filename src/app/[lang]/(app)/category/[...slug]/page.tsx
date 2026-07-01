import { Fragment } from "react";
import { notFound } from "next/navigation";
import { Header } from "@/components/header/Header";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getNodeBySlug, getHierarchyBySlug } from "@/lib/api/navigation";
import { getProductsForNode, getProductsForHierarchy } from "@/lib/api/products";
import type { Metadata } from "next";
import Link from "next/link";

type Props = {
  params: Promise<{ lang: string; slug: string[] }>;
};

function slugToLabel(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

async function resolveCategory(slug: string[]) {
  const leafSlug = slug[slug.length - 1];
  if (slug.length === 1) {
    const hierarchy = await getHierarchyBySlug(leafSlug).catch(() => null);
    if (!hierarchy) return null;
    return { id: hierarchy.id, name: hierarchy.name, isHierarchy: true as const };
  }
  const node = await getNodeBySlug(leafSlug).catch(() => null);
  if (!node) return null;
  return { id: node.id, name: node.name, isHierarchy: false as const };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await resolveCategory(slug).catch(() => null);
  const fallback = slugToLabel(slug[slug.length - 1]);
  return {
    title: category?.name ?? fallback,
    description: `Browse ${category?.name ?? fallback} from our catalog`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { lang, slug } = await params;

  const category = await resolveCategory(slug).catch(() => null);
  if (!category) notFound();

  const products = category.isHierarchy
    ? await getProductsForHierarchy(category.id)
    : await getProductsForNode(category.id);

  const breadcrumbs = slug.map((segment, i) => ({
    label: i === slug.length - 1 ? category.name : slugToLabel(segment),
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
          <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
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
