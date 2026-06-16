import {
  getByContextAllProducts,
  getByContextProduct,
  getByContextProductsForNode,
  extractProductImage,
  type Product,
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
  hasVariations?: boolean;
};

export type ProductVariationOption = {
  id: string;
  name: string;
  description?: string;
  sortOrder?: number;
};

export type ProductVariation = {
  id: string;
  name: string;
  options: ProductVariationOption[];
  sortOrder?: number;
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
  variations?: ProductVariation[];
  variationMatrix?: Record<string, unknown>;
  childSlugs?: Record<string, string>;
  selectedOptionIds?: string[];
  productType?: string;
};

function extractChildIds(matrix: Record<string, unknown>): string[] {
  const ids: string[] = [];
  function traverse(node: unknown) {
    if (typeof node === "string") {
      ids.push(node);
    } else if (node && typeof node === "object") {
      Object.values(node as Record<string, unknown>).forEach(traverse);
    }
  }
  traverse(matrix);
  return [...new Set(ids)];
}

async function buildChildSlugs(
  client: Awaited<ReturnType<typeof createElasticPathClient>>,
  matrix: Record<string, unknown>,
): Promise<Record<string, string>> {
  const childIds = extractChildIds(matrix);
  if (!childIds.length) return {};
  const responses = await Promise.all(
    childIds.map((id) =>
      getByContextProduct({ client, path: { product_id: id }, query: {} }).catch(() => null),
    ),
  );
  const slugMap: Record<string, string> = {};
  for (const r of responses) {
    const p = r?.data?.data;
    if (p?.id && p.attributes?.slug) {
      slugMap[p.id] = p.attributes.slug;
    }
  }
  return slugMap;
}

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
  const variationMatrix = product.meta?.variation_matrix as Record<string, unknown> | undefined;
  return {
    id: product.id ?? "",
    slug: product.attributes?.slug ?? product.id ?? "",
    name: product.attributes?.name ?? "",
    description: product.attributes?.description,
    priceFormatted: price,
    originalPriceFormatted: originalPrice,
    imageUrl: image?.link?.href,
    hasVariations: !!variationMatrix && Object.keys(variationMatrix).length > 0,
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

  const variations: ProductVariation[] = (product.meta?.variations ?? [])
    .map((v) => ({
      id: v.id ?? "",
      name: v.name ?? "",
      sortOrder: v.sort_order ?? 0,
      options: (v.options ?? [])
        .sort((a, b) => (b.sort_order ?? 0) - (a.sort_order ?? 0))
        .map((o) => ({ id: o.id ?? "", name: o.name ?? "", description: o.description ?? undefined, sortOrder: o.sort_order ?? 0 })),
    }))
    .filter((v) => v.id && v.options.length > 0)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const selectedOptionIds = product.meta?.child_option_ids?.length
    ? (product.meta.child_option_ids as string[])
    : undefined;

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
    variations: variations.length > 0 ? variations : undefined,
    variationMatrix: product.meta?.variation_matrix as Record<string, unknown> | undefined,
    selectedOptionIds,
    productType: product.meta?.product_types?.[0],
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

  const formatted = formatProductDetail(product, response.data?.included);

  if (formatted.productType === "child") {
    // Fetch parent product to get the full variation list and child slug map
    const parentId =
      (product.attributes as Record<string, unknown>)?.base_product_id as string | undefined ??
      (product.relationships?.parent?.data as { id?: string } | undefined)?.id;

    if (parentId) {
      const parentRes = await getByContextProduct({
        client,
        path: { product_id: parentId },
        query: {},
      });
      const parentProduct = parentRes.data?.data;
      if (parentProduct) {
        const parentFormatted = formatProductDetail(parentProduct, undefined);
        if (parentFormatted.variations) formatted.variations = parentFormatted.variations;
        if (parentFormatted.variationMatrix) {
          formatted.variationMatrix = parentFormatted.variationMatrix;
          formatted.childSlugs = await buildChildSlugs(client, parentFormatted.variationMatrix);
        }
      }
    }
  } else if (formatted.variationMatrix && Object.keys(formatted.variationMatrix).length > 0) {
    // Parent product — fetch child slugs for navigation
    formatted.childSlugs = await buildChildSlugs(client, formatted.variationMatrix);
  }

  return formatted;
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
