"use client";

import { useMemo, useState, useEffect, type ReactNode } from "react";
import {
  InstantSearch,
  useHits,
  useInstantSearch,
  usePagination,
  useStats,
  useHierarchicalMenu,
  useRange,
  useClearRefinements,
} from "react-instantsearch";
import { useTranslations } from "next-intl";
import CatalogSearchInstantSearchAdapter from "@elasticpath/catalog-search-instantsearch-adapter";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEpClient } from "@/components/ClientProvider";
import { ProductCard } from "@/components/product/ProductCard";
import { Pagination } from "@/components/ui/Pagination/Pagination";
import { Button } from "@/components/ui/Button";
import { SEARCH_INDEX_NAME } from "@/lib/instantsearch-routing";
import { EP_CURRENCY_CODE } from "@/lib/currency";
import type { ProductCardData } from "@/lib/api/products";

const HIERARCHICAL_ATTRIBUTES = [
  "meta.search.categories.lvl0",
  "meta.search.categories.lvl1",
  "meta.search.categories.lvl2",
];

function hitToCard(hit: Record<string, unknown>): ProductCardData {
  const attrs = (hit.attributes as Record<string, any>) ?? {};
  const meta = (hit.meta as Record<string, any>) ?? {};
  const dp = meta.display_price ?? {};
  const odp = meta.original_display_price ?? {};
  const mainImage = hit.main_image as { link?: { href?: string } } | undefined;
  const productTypes = meta.product_types as string[] | undefined;
  const tiersAttr = attrs.tiers;

  return {
    id: (hit.objectID as string) ?? (hit.id as string) ?? "",
    name: attrs.name ?? "",
    slug: attrs.slug ?? "",
    description: attrs.description as string | undefined,
    priceFormatted: dp.with_tax?.formatted ?? dp.without_tax?.formatted ?? "",
    originalPriceFormatted:
      odp.without_tax?.formatted ?? odp.with_tax?.formatted ?? undefined,
    imageUrl: mainImage?.link?.href,
    hasVariations: Boolean(attrs.base_product),
    hasBulkBuy: !!tiersAttr && Object.keys(tiersAttr as object).length > 0,
    isBundle:
      !!productTypes?.includes("bundle") ||
      !!(attrs.components && Object.keys(attrs.components as object).length > 0),
  };
}

// ─── Filter Components ────────────────────────────────────────────────────────

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        className="flex w-full items-center justify-between py-3 text-sm font-semibold text-gray-900 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        {title}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-gray-400 flex-shrink-0 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open && <div className="pb-4 space-y-0.5">{children}</div>}
    </div>
  );
}

function CategoryFilter() {
  const t = useTranslations("search");
  const { items, refine, canToggleShowMore, isShowingMore, toggleShowMore } =
    useHierarchicalMenu({
      attributes: HIERARCHICAL_ATTRIBUTES,
      limit: 8,
      showMore: true,
      showMoreLimit: 30,
      sortBy: ["count:desc"],
    });

  if (!items.length)
    return (
      <p className="text-xs text-gray-400">{t("noCategoriesAvailable")}</p>
    );

  function renderItems(list: typeof items, depth = 0): ReactNode {
    return list.map((item) => (
      <div key={item.value}>
        <button
          onClick={() => refine(item.value)}
          className={cn(
            "w-full flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors text-left",
            item.isRefined
              ? "font-semibold text-brand-primary bg-brand-primary/5"
              : "text-gray-700 hover:bg-gray-50",
            depth > 0 && "pl-5",
          )}
        >
          <span className="truncate">{item.label}</span>
          <span className="ml-2 text-xs text-gray-400 flex-shrink-0">
            {item.count}
          </span>
        </button>
        {item.data && item.data.length > 0 && (
          <div className="mt-0.5">{renderItems(item.data, depth + 1)}</div>
        )}
      </div>
    ));
  }

  return (
    <div>
      {renderItems(items)}
      {canToggleShowMore && (
        <button
          onClick={toggleShowMore}
          className="mt-2 text-xs font-medium text-brand-primary hover:underline px-2"
        >
          {isShowingMore ? t("showLess") : t("showMore")}
        </button>
      )}
    </div>
  );
}

function PriceRangeFilter({
  currencyCode = EP_CURRENCY_CODE,
}: {
  currencyCode?: string;
}) {
  const t = useTranslations("search");
  const { start, range, canRefine, refine } = useRange({
    attribute: `price.${currencyCode}.float_price`,
  });
  const [minInput, setMinInput] = useState("");
  const [maxInput, setMaxInput] = useState("");

  useEffect(() => {
    setMinInput(Number.isFinite(start[0]) ? String(start[0]) : "");
    setMaxInput(Number.isFinite(start[1]) ? String(start[1]) : "");
  }, [start[0], start[1]]); // eslint-disable-line react-hooks/exhaustive-deps

  const apply = () => {
    const min = minInput !== "" ? Number(minInput) : -Infinity;
    const max = maxInput !== "" ? Number(maxInput) : Infinity;
    refine([min, max]);
  };

  if (!canRefine)
    return <p className="text-xs text-gray-400">{t("priceUnavailable")}</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">
            {t("priceMin")}
          </label>
          <input
            type="number"
            value={minInput}
            placeholder={range.min != null ? String(range.min) : "0"}
            onChange={(e) => setMinInput(e.target.value)}
            onBlur={apply}
            onKeyDown={(e) => e.key === "Enter" && apply()}
            className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
          />
        </div>
        <span className="text-gray-400 pb-2 text-sm flex-shrink-0">—</span>
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">
            {t("priceMax")}
          </label>
          <input
            type="number"
            value={maxInput}
            placeholder={range.max != null ? String(range.max) : "∞"}
            onChange={(e) => setMaxInput(e.target.value)}
            onBlur={apply}
            onKeyDown={(e) => e.key === "Enter" && apply()}
            className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
          />
        </div>
      </div>
      {range.min != null && range.max != null && (
        <p className="text-xs text-gray-400">
          {t("priceAvailableRange", { min: range.min, max: range.max })}
        </p>
      )}
    </div>
  );
}

function ClearFiltersButton() {
  const t = useTranslations("search");
  const { canRefine, refine } = useClearRefinements();
  if (!canRefine) return null;
  return (
    <button
      onClick={refine}
      className="text-xs text-brand-primary hover:underline font-medium"
    >
      {t("clearAll")}
    </button>
  );
}

function FilterSidebar() {
  const t = useTranslations("search");
  return (
    <div>
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-1">
        <span className="text-sm font-semibold text-gray-900">
          {t("filters")}
        </span>
        <ClearFiltersButton />
      </div>
      <FilterSection title={t("categories")}>
        <CategoryFilter />
      </FilterSection>
      <FilterSection title={t("price")} defaultOpen={false}>
        <PriceRangeFilter />
      </FilterSection>
    </div>
  );
}

// ─── Category Results ─────────────────────────────────────────────────────────

function CategoryInner({
  lang,
  categoryName,
}: {
  lang: string;
  categoryName: string;
}) {
  const t = useTranslations("search");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { status, error, results } = useInstantSearch();
  const { hits } = useHits<Record<string, unknown>>();
  const { nbHits } = useStats();
  const { currentRefinement, nbPages, refine: goToPage } = usePagination();

  const isLoading =
    (!results && status !== "error") ||
    status === "loading" ||
    status === "stalled";
  const currentPage = currentRefinement + 1;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{categoryName}</h1>
          {!isLoading && nbHits > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              {nbHits} product{nbHits !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="lg:hidden"
          onClick={() => setMobileFiltersOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4 mr-1.5" />
          {t("filters")}
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <strong className="font-semibold">{t("errorPrefix")}</strong>{" "}
          {error.message}
        </div>
      )}

      <div className="flex gap-8">
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <FilterSidebar />
        </aside>

        <div className="flex-1 min-w-0">
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-gray-100 bg-white overflow-hidden animate-pulse"
                >
                  <div className="aspect-square bg-gray-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-4 bg-gray-100 rounded w-1/4 mt-2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && hits.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {hits.map((hit) => (
                  <ProductCard
                    key={hit.objectID as string}
                    product={hitToCard(hit)}
                    lang={lang}
                  />
                ))}
              </div>
              {nbPages > 1 && (
                <div className="mt-10 flex justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={nbPages}
                    onPageChange={(page) => goToPage(page - 1)}
                  />
                </div>
              )}
            </>
          )}

          {!isLoading && hits.length === 0 && !error && (
            <div className="py-20 text-center">
              <p className="text-gray-500 text-base">{t("noResults")}</p>
            </div>
          )}
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="relative ml-auto h-full w-80 max-w-full bg-white shadow-xl overflow-y-auto p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">
                {t("filters")}
              </h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-md p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <FilterSidebar />
            <div className="mt-auto pt-6">
              <Button
                className="w-full"
                onClick={() => setMobileFiltersOpen(false)}
              >
                {t("viewResults")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Root Provider ────────────────────────────────────────────────────────────

type Props = {
  lang: string;
  categoryName: string;
  slugs: string[];
};

export function CategorySearchClient({ lang, categoryName, slugs }: Props) {
  const epClient = useEpClient();

  // Stable string so useMemo doesn't reconstruct the client on every render
  const slugKey = slugs.join(",");

  const searchClient = useMemo(() => {
    const nodeSlugFilter = slugs
      .map((s) => `meta.search.nodes.slug:=[\`${s}\`]`)
      .join(" && ");

    const adapter = new CatalogSearchInstantSearchAdapter({
      client: epClient as any,
      include: ["main_image"],
      additionalSearchParameters: {
        query_by: "name,description,sku",
        per_page: 12,
        filter_by: nodeSlugFilter,
        facet_by:
          "meta.search.categories.lvl0,meta.search.categories.lvl1,meta.search.categories.lvl2",
      },
    });

    return adapter.searchClient;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [epClient, slugKey]);

  return (
    <InstantSearch
      indexName={SEARCH_INDEX_NAME}
      searchClient={searchClient}
      future={{ preserveSharedStateOnUnmount: true }}
    >
      <CategoryInner lang={lang} categoryName={categoryName} />
    </InstantSearch>
  );
}
