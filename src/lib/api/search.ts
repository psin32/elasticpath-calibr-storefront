import { postMultiSearch } from "@epcc-sdk/sdks-shopper";
import { createElasticPathClient } from "@/lib/create-elastic-path-client";
import type { ProductCardData } from "./products";


export async function searchProductsByNodeSlugs(
  slugs: string[],
  limit = 24,
): Promise<ProductCardData[]> {
  if (!slugs.length) return [];

  const slugFilter = slugs.length === 1
    ? `meta.search.nodes.slug:=[\`${slugs[0]}\`]`
    : slugs.map((s) => `meta.search.nodes.slug:=[\`${s}\`]`).join(" && ");

  const client = await createElasticPathClient();

  const res = await postMultiSearch({
    client,
    query: { include: ["main_image"] },
    body: {
      searches: [
        {
          q: "*",
          filter_by: slugFilter,
          per_page: limit,
          page: 1,
        },
      ],
    },
  }).catch(() => null);

  const hits = res?.data?.results?.[0]?.hits ?? [];

  return hits.map((hit) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = (hit.document as any) ?? {};
    const attrs = doc.attributes ?? {};
    const meta = doc.meta ?? {};
    const dp = meta.display_price ?? {};
    const odp = meta.original_display_price ?? {};
    return {
      id: doc.id ?? "",
      name: attrs.name ?? "",
      slug: attrs.slug ?? "",
      description: attrs.description as string | undefined,
      priceFormatted: dp.with_tax?.formatted ?? dp.without_tax?.formatted ?? "",
      originalPriceFormatted:
        odp.without_tax?.formatted ?? odp.with_tax?.formatted ?? undefined,
      imageUrl: doc.main_image?.link?.href,
      hasVariations: Boolean(attrs.base_product),
      hasBulkBuy: false,
    };
  });
}
