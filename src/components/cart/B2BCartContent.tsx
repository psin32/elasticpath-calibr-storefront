"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ShoppingBag, LayoutList, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCart } from "@/context/CartContext";
import { CartPageHeader } from "./CartPageHeader";
import { BundleCartRow } from "./BundleCartRow";
import { MatrixCartRow } from "./MatrixCartRow";
import { SimpleCartRow } from "./SimpleCartRow";
import type {
  LineGroup,
  ProductInfo,
  ChildProduct,
  CartItemEntry,
} from "./types";

const COOKIE_KEY = "cart_view_mode";
const ENV_DEFAULT =
  (process.env.NEXT_PUBLIC_CART_VIEW_MODE as "list" | "grid" | undefined) ??
  "list";

function readViewModeCookie(): "list" | "grid" {
  if (typeof document === "undefined") return ENV_DEFAULT;
  const match = document.cookie.match(/(?:^|;\s*)cart_view_mode=([^;]*)/);
  const val = match?.[1];
  return val === "list" || val === "grid" ? val : ENV_DEFAULT;
}

function writeViewModeCookie(mode: "list" | "grid") {
  document.cookie = `${COOKIE_KEY}=${mode}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

type Props = { lang: string };

export function B2BCartContent({ lang }: Props) {
  const t = useTranslations("cart");
  const { items, cartTotal, isLoading, addItem, updateQuantity, removeItem } =
    useCart();

  const productInfoCache = useRef<Map<string, ProductInfo>>(new Map());
  const childrenCache = useRef<Map<string, ChildProduct[]>>(new Map());

  const [groups, setGroups] = useState<LineGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [viewMode, setViewModeState] = useState<"list" | "grid">(ENV_DEFAULT);

  // Sync from cookie after hydration
  useEffect(() => {
    const saved = readViewModeCookie();
    if (saved !== viewMode) setViewModeState(saved);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setViewMode = useCallback((mode: "list" | "grid") => {
    writeViewModeCookie(mode);
    setViewModeState(mode);
  }, []);

  const rebuild = useCallback(async () => {
    setGroupsLoading(true);

    // List mode: skip API calls, map items directly to simple/bundle rows
    if (viewMode === "list") {
      const lineGroups: LineGroup[] = items.map((item) => {
        if (item.bundleComponents && item.bundleComponents.length > 0) {
          return {
            kind: "bundle" as const,
            cartItemId: item.id,
            name: item.name,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.unitPriceFormatted,
            lineTotal: item.lineTotalFormatted,
            imageUrl: item.imageHref,
            bundleComponents: item.bundleComponents,
          };
        }
        return {
          kind: "simple" as const,
          cartItemId: item.id,
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPriceFormatted,
          lineTotal: item.lineTotalFormatted,
          lineTotalOriginal: item.lineTotalOriginalFormatted,
          imageUrl: item.imageHref,
          discounts: item.discounts,
        };
      });
      setGroups(lineGroups);
      setGroupsLoading(false);
      return;
    }

    // 1. Collect parent IDs from custom_inputs — only these items are treated as child products
    const parentIds = new Set<string>();
    for (const item of items) {
      const pid = item.customInputs?.parent_product_id;
      if (pid) parentIds.add(pid);
    }

    // 2. Fetch product info for parent products (name/sku/price for matrix header)
    //    and for non-child items (to detect bundles vs simple)
    const nonChildProductIds = [
      ...new Set(
        items
          .filter(
            (i) =>
              !i.customInputs?.parent_product_id && !i.bundleComponents?.length,
          )
          .map((i) => i.productId),
      ),
    ];
    const idsToFetch = [
      ...Array.from(parentIds).filter(
        (id) => !productInfoCache.current.has(id),
      ),
      ...nonChildProductIds.filter((id) => !productInfoCache.current.has(id)),
    ];
    if (idsToFetch.length > 0) {
      const results = await Promise.all(
        idsToFetch.map((id) =>
          fetch(`/api/products/${id}`)
            .then((r) => r.json())
            .catch(() => null),
        ),
      );
      idsToFetch.forEach((id, i) => {
        if (results[i] && !results[i].error)
          productInfoCache.current.set(id, results[i]);
      });
    }

    // 3. Fetch children for parent IDs not yet cached
    const newParentIds = Array.from(parentIds).filter(
      (id) => !childrenCache.current.has(id),
    );
    if (newParentIds.length > 0) {
      const results = await Promise.all(
        newParentIds.map((id) =>
          fetch(`/api/products/${id}/children`)
            .then((r) => r.json())
            .catch(() => ({ children: [] })),
        ),
      );
      newParentIds.forEach((id, i) => {
        childrenCache.current.set(id, results[i].children ?? []);
      });
    }

    // 4. Build line groups
    const seenParents = new Set<string>();
    const lineGroups: LineGroup[] = [];

    for (const item of items) {
      // Bundle — embedded component data takes priority
      if (item.bundleComponents && item.bundleComponents.length > 0) {
        lineGroups.push({
          kind: "bundle",
          cartItemId: item.id,
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPriceFormatted,
          lineTotal: item.lineTotalFormatted,
          imageUrl: item.imageHref,
          bundleComponents: item.bundleComponents,
        });
        continue;
      }

      // Child product — only when parent_product_id is in custom_inputs
      const parentId = item.customInputs?.parent_product_id;
      if (parentId) {
        if (!seenParents.has(parentId)) {
          seenParents.add(parentId);
          const parentInfo = productInfoCache.current.get(parentId);
          const children = childrenCache.current.get(parentId) ?? [];

          // Gather all sibling cart items for this parent
          const siblingCartItems: Map<string, CartItemEntry> = new Map();
          for (const si of items) {
            if (si.customInputs?.parent_product_id === parentId) {
              siblingCartItems.set(si.productId, {
                cartItemId: si.id,
                quantity: si.quantity,
              });
            }
          }

          lineGroups.push({
            kind: "matrix",
            matrixGroup: {
              parentId,
              parentName: parentInfo?.name ?? item.name,
              parentSku: parentInfo?.sku ?? undefined,
              parentPriceFormatted: parentInfo?.priceFormatted,
              children,
            },
            cartItemsByProductId: siblingCartItems,
          });
        }
        continue;
      }

      // Simple product
      lineGroups.push({
        kind: "simple",
        cartItemId: item.id,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPriceFormatted,
        lineTotal: item.lineTotalFormatted,
        lineTotalOriginal: item.lineTotalOriginalFormatted,
        imageUrl: item.imageHref,
        discounts: item.discounts,
      });
    }

    setGroups(lineGroups);
    setGroupsLoading(false);
  }, [items, viewMode]);

  useEffect(() => {
    rebuild();
  }, [rebuild]);

  const handleMatrixQtyChange = useCallback(
    async (productId: string, cartItemId: string | null, newQty: number) => {
      if (newQty <= 0 && cartItemId) {
        await removeItem(cartItemId);
      } else if (newQty > 0 && !cartItemId) {
        // Find the child in the cache to build custom_inputs
        let customInputs: Record<string, string> | undefined;
        for (const [parentId, children] of childrenCache.current) {
          const child = children.find((c) => c.id === productId);
          if (child && child.variationOptions.length > 0) {
            customInputs = {
              parent_product_id: parentId,
              options: child.variationOptions
                .map((o) => o.optionName)
                .join(" / "),
            };
            break;
          }
        }
        await addItem(productId, newQty, customInputs);
      } else if (newQty > 0 && cartItemId) {
        await updateQuantity(cartItemId, newQty);
      }
    },
    [addItem, updateQuantity, removeItem],
  );

  const handleSimpleQtyChange = useCallback(
    (cartItemId: string, qty: number) => {
      if (qty <= 0) removeItem(cartItemId);
      else updateQuantity(cartItemId, qty);
    },
    [updateQuantity, removeItem],
  );

  const totalUnits = items.reduce((s, i) => s + i.quantity, 0);
  const lineCount = groups.length;

  const isEmpty = !isLoading && !groupsLoading && items.length === 0;

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-[30px] pb-20">
      <CartPageHeader
        lang={lang}
        totalUnits={totalUnits}
        lineCount={lineCount}
        grandTotal={cartTotal}
      />

      <div className="h-px bg-[#DDE1E6] my-7" />

      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-24 gap-5">
          <div className="w-20 h-20 rounded-full bg-[#EEF0F2] flex items-center justify-center">
            <ShoppingBag size={36} className="text-[#C2C8D0]" />
          </div>
          <div className="text-center">
            <p className="text-[18px] font-semibold text-[#0E1521]">
              {t("emptyTitle")}
            </p>
            <p className="text-[14px] text-[#5C6675] mt-1">{t("emptyHint")}</p>
          </div>
          <Link
            href={`/${lang}`}
            className="mt-2 h-11 px-6 rounded-[11px] bg-[#0E1521] text-white font-semibold text-[14px] flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            {t("browseCatalog")}
          </Link>
        </div>
      )}

      {!isEmpty && (
        <>
          {/* View toggle toolbar */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] text-[#5C6675]">
              {t("units", { count: totalUnits })} ·{" "}
              {t("products", { count: lineCount })}
            </p>
            <div className="flex items-center gap-[3px] bg-[#EEF0F2] rounded-[8px] p-[3px]">
              <button
                onClick={() => setViewMode("list")}
                title={t("viewList")}
                aria-pressed={viewMode === "list"}
                className={[
                  "w-8 h-7 rounded-[6px] flex items-center justify-center transition-colors",
                  viewMode === "list"
                    ? "bg-white shadow-sm text-[#0E1521]"
                    : "text-[#5C6675] hover:text-[#0E1521]",
                ].join(" ")}
              >
                <LayoutList size={15} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                title={t("viewGrid")}
                aria-pressed={viewMode === "grid"}
                className={[
                  "w-8 h-7 rounded-[6px] flex items-center justify-center transition-colors",
                  viewMode === "grid"
                    ? "bg-white shadow-sm text-[#0E1521]"
                    : "text-[#5C6675] hover:text-[#0E1521]",
                ].join(" ")}
              >
                <LayoutGrid size={15} />
              </button>
            </div>
          </div>

          {(isLoading || groupsLoading) && groups.length === 0 ? (
            <div className="flex flex-col gap-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-32 rounded-2xl bg-white border border-[#DDE1E6] animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {groups.map((group, idx) => {
                if (group.kind === "bundle") {
                  return (
                    <BundleCartRow
                      key={group.cartItemId}
                      {...group}
                      onQuantityChange={handleSimpleQtyChange}
                      onRemove={removeItem}
                      disabled={isLoading}
                    />
                  );
                }
                if (group.kind === "matrix") {
                  return (
                    <MatrixCartRow
                      key={group.matrixGroup.parentId}
                      matrixGroup={group.matrixGroup}
                      cartItemsByProductId={group.cartItemsByProductId}
                      onQuantityChange={handleMatrixQtyChange}
                      disabled={isLoading}
                    />
                  );
                }
                return (
                  <SimpleCartRow
                    key={group.cartItemId + idx}
                    {...group}
                    onQuantityChange={handleSimpleQtyChange}
                    onRemove={removeItem}
                    disabled={isLoading}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
