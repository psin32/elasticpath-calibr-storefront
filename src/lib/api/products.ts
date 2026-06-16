import {
  getByContextAllProducts,
  getByContextProduct,
  getByContextProductsForNode,
  extractProductImage,
  type Product,
  type ElasticPathFile,
  type IncludedResponse,
} from "@epcc-sdk/sdks-shopper";
import { createElasticPathClient } from "@/lib/create-elastic-path-client";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  priceFormatted: string;
  originalPriceFormatted?: string;
  imageUrl?: string;
  description?: string;
};

export type ProductDetailData = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  priceFormatted: string;
  originalPriceFormatted?: string;
  sku?: string;
  imageUrl?: string;
  additionalImages?: string[];
};

function formatProduct(
  product: Product,
  included?: IncludedResponse,
): ProductCardData {
  const image = extractProductImage(product, included?.main_images);
  const price =
    product.meta?.display_price?.without_tax?.formatted ??
    product.meta?.display_price?.with_tax?.formatted ??
    "";
  const originalPrice =
    product.meta?.original_display_price?.without_tax?.formatted ??
    product.meta?.original_display_price?.with_tax?.formatted;
  return {
    id: product.id ?? "",
    slug: product.attributes?.slug ?? product.id ?? "",
    name: product.attributes?.name ?? "",
    description: product.attributes?.description,
    priceFormatted: price,
    originalPriceFormatted: originalPrice,
    imageUrl: image?.link?.href,
  };
}

function formatProductDetail(
  product: Product,
  included?: IncludedResponse,
): ProductDetailData {
  const mainImage = extractProductImage(product, included?.main_images);
  const additionalImages = (included?.files ?? [])
    .filter((f) => f.link?.href && f.id !== mainImage?.id)
    .map((f) => f.link!.href!)
    .filter(Boolean);

  return {
    id: product.id ?? "",
    slug: product.attributes?.slug ?? product.id ?? "",
    name: product.attributes?.name ?? "",
    description: product.attributes?.description,
    priceFormatted:
      product.meta?.display_price?.without_tax?.formatted ??
      product.meta?.display_price?.with_tax?.formatted ??
      "",
    originalPriceFormatted:
      product.meta?.original_display_price?.without_tax?.formatted ??
      product.meta?.original_display_price?.with_tax?.formatted,
    sku: product.attributes?.sku,
    imageUrl: mainImage?.link?.href,
    additionalImages,
  };
}

export async function getFeaturedProducts(
  limit = 8,
): Promise<ProductCardData[]> {
  const client = await createElasticPathClient();
  const response = await getByContextAllProducts({
    client,
    query: {
      include: ["main_image"],
      "page[limit]": BigInt(limit),
    },
  });
  const products = response.data?.data ?? [];
  return products.map((p) => formatProduct(p, response.data?.included));
}

export async function getProductsForNode(
  nodeId: string,
  limit = 24,
): Promise<ProductCardData[]> {
  const client = await createElasticPathClient();
  const response = await getByContextProductsForNode({
    client,
    path: { node_id: nodeId },
    query: {
      include: ["main_image"],
      "page[limit]": BigInt(limit),
    },
  });
  const products = response.data?.data ?? [];
  return products.map((p) => formatProduct(p, response.data?.included));
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductDetailData | null> {
  const client = await createElasticPathClient();
  const response = await getByContextAllProducts({
    client,
    query: {
      filter: `eq(slug,${slug})`,
      include: ["main_image", "files"],
    },
  });
  const product = response.data?.data?.[0];
  if (!product) return null;
  return formatProductDetail(product, response.data?.included);
}

export async function getProductById(
  productId: string,
): Promise<ProductDetailData | null> {
  const client = await createElasticPathClient();
  const response = await getByContextProduct({
    client,
    path: { product_id: productId },
    query: { include: ["main_image", "files"] },
  });
  const product = response.data?.data;
  if (!product) return null;
  return formatProductDetail(
    product,
    response.data?.included as IncludedResponse,
  );
}
