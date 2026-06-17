import { NextRequest, NextResponse } from "next/server";
import { getByContextAllProducts, getByContextProductsForNode, extractProductImage } from "@epcc-sdk/sdks-shopper";
import { createElasticPathClient } from "@/lib/create-elastic-path-client";
import type { ProductCardData } from "@/lib/api/products";
import type { Product, IncludedResponse } from "@epcc-sdk/sdks-shopper";

function formatCard(product: Product, included?: IncludedResponse): ProductCardData {
  const image = extractProductImage(product, included?.main_images);
  const price =
    product.meta?.display_price?.without_tax?.formatted ??
    product.meta?.display_price?.with_tax?.formatted ??
    "";
  const originalPrice =
    product.meta?.original_display_price?.without_tax?.formatted ??
    product.meta?.original_display_price?.with_tax?.formatted;
  const variationMatrix = product.meta?.variation_matrix as Record<string, unknown> | undefined;
  const tiersAttr = (product.attributes as Record<string, unknown>)?.tiers;
  return {
    id: product.id ?? "",
    slug: product.attributes?.slug ?? product.id ?? "",
    name: product.attributes?.name ?? "",
    description: product.attributes?.description,
    priceFormatted: price,
    originalPriceFormatted: originalPrice,
    imageUrl: image?.link?.href,
    hasVariations: !!variationMatrix && Object.keys(variationMatrix).length > 0,
    hasBulkBuy: !!tiersAttr && Object.keys(tiersAttr as object).length > 0,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get("ids")?.trim();
  const nodeId = searchParams.get("nodeId")?.trim();

  if (!ids && !nodeId) return NextResponse.json({ data: [] });

  try {
    const client = await createElasticPathClient();

    if (nodeId) {
      const response = await getByContextProductsForNode({
        client,
        path: { node_id: nodeId },
        query: { include: ["main_image"], "page[limit]": BigInt(24) },
      });
      const data = (response.data?.data ?? []).map((p) =>
        formatCard(p, response.data?.included),
      );
      return NextResponse.json({ data });
    }

    // ids mode
    const response = await getByContextAllProducts({
      client,
      query: {
        filter: `in(id,${ids})`,
        include: ["main_image"],
        "page[limit]": BigInt(50),
      },
    });
    const data = (response.data?.data ?? []).map((p) =>
      formatCard(p, response.data?.included),
    );
    return NextResponse.json({ data });
  } catch (err) {
    console.error("Catalog products fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
