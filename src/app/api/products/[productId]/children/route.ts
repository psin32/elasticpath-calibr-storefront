import { NextRequest, NextResponse } from "next/server";
import {
  getByContextChildProducts,
  extractProductImage,
} from "@epcc-sdk/sdks-shopper";
import { createElasticPathClient } from "@/lib/create-elastic-path-client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;
  if (!productId) return NextResponse.json({ children: [] });

  try {
    const client = await createElasticPathClient();
    const res = await getByContextChildProducts({
      client,
      path: { product_id: productId },
      query: { include: ["main_image"], "page[limit]": BigInt(200) },
    });

    const products = res.data?.data ?? [];
    const included = res.data?.included;

    const children = products.map((product) => {
      const raw = product as any;
      const image = extractProductImage(product, included?.main_images);
      const variations: any[] = raw.meta?.child_variations ?? [];
      return {
        id: product.id ?? "",
        name: raw.attributes?.name ?? "",
        sku: raw.attributes?.sku ?? null,
        priceFormatted:
          raw.meta?.display_price?.without_tax?.formatted ??
          raw.meta?.display_price?.with_tax?.formatted ??
          "",
        imageUrl: image?.link?.href ?? null,
        variationOptions: variations.map((v: any) => ({
          variationName: v.name ?? "",
          optionName: v.option?.description ?? "",
        })),
      };
    });

    return NextResponse.json({ children });
  } catch (err) {
    console.error("Child products fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch children" },
      { status: 500 },
    );
  }
}
