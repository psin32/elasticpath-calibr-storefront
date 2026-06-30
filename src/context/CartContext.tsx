"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import {
  initializeCart,
  manageCarts,
  getCartItems,
  getCarts,
  createACart,
  deleteACart,
  updateACart,
  updateACartItem,
  deleteACartItem,
  deleteAllCartItems,
  type CartItemObject,
  type CartsResponse,
  type CartResponse,
  deleteAPromotionViaPromotionCode,
} from "@epcc-sdk/sdks-shopper";
import type { Client } from "@hey-api/client-fetch";
import { createEpClient } from "@/lib/api/ep-client";
import { useAuth } from "@/context/AuthContext";

export type AppliedPromoCode = {
  id: string;
  code: string;
  name?: string;
  discountFormatted?: string;
};

export type PromotionSuggestion = {
  promotion_id: string;
  code: string;
  info: string;
  targets: Array<{
    skus: string[];
    quantity: number;
  }>;
};

export type BundleComponentItem = {
  componentName: string;
  productName: string;
  quantity: number;
  unitPriceFormatted?: string;
  lineTotalFormatted?: string;
};

export type CartItemDiscount = {
  promotionId: string;
  promotionName?: string;
  promotionDescription?: string;
  code: string;
  amountFormatted: string;
};

export type CartLineItem = {
  id: string;
  productId: string;
  sku?: string;
  name: string;
  quantity: number;
  unitPriceAmount: number;
  currency: string;
  unitPriceFormatted: string;
  lineTotalFormatted: string;
  lineTotalOriginalFormatted?: string;
  imageHref?: string;
  bundleComponents?: BundleComponentItem[];
  customInputs?: Record<string, string>;
  discounts?: CartItemDiscount[];
  isSubscription?: boolean;
  subscriptionPlanName?: string;
  subscriptionFrequency?: string;
};

export type CartSummary = {
  id: string;
  name: string;
  description?: string;
  totalFormatted?: string;
  itemCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

const CART_STORAGE_KEY = "_store_ep_cart";

type CartContextValue = {
  items: CartLineItem[];
  itemCount: number;
  cartTotal: string;
  cartTotalAmount: number;
  cartSubtotal: string;
  cartDiscount: string;
  cartDiscountAmount: number;
  cartShipping: string;
  cartShippingAmount: number;
  refreshCart: () => Promise<void>;
  cartId: string | null;
  allCarts: CartSummary[];
  isLoading: boolean;
  isInitializing: boolean;
  addItem: (
    productId: string,
    quantity?: number,
    customInputs?: Record<string, string>,
    subscriptionConfig?: { offeringId: string; plan: string; pricing_option: string; planName: string; frequency: string; imageUrl?: string },
  ) => Promise<PromotionSuggestion[] | undefined>;
  addItems: (
    items: Array<{ productId: string; quantity: number }>,
  ) => Promise<PromotionSuggestion[] | undefined>;
  addBundleItem: (
    productId: string,
    selectedOptions: Record<string, Record<string, number>>,
    quantity?: number,
  ) => Promise<PromotionSuggestion[] | undefined>;
  removeItem: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  switchCart: (newCartId: string) => Promise<void>;
  createCart: (name: string) => Promise<string | null>;
  updateCart: (id: string, name: string, description?: string) => Promise<void>;
  deleteCart: (targetCartId: string) => Promise<void>;
  clearCartById: (targetCartId: string) => Promise<void>;
  promotionSuggestions: PromotionSuggestion[] | null;
  clearPromotionSuggestions: () => void;
  showPromotionModal: boolean;
  dismissPromotionModal: () => void;
  appliedPromoCodes: AppliedPromoCode[];
  applyPromoCode: (
    code: string,
  ) => Promise<{ success: boolean; error?: string }>;
  removePromoCode: (code: string) => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

function toCartLineItem(
  item: CartItemObject,
  promotionsById?: Map<string, { name: string; description?: string }>,
): CartLineItem {
  const withTax = item.meta?.display_price?.with_tax;
  const raw = item as any;

  let bundleComponents: BundleComponentItem[] | undefined;
  const selectedOptions: Record<string, Record<string, number>> | undefined =
    raw.bundle_configuration?.selected_options;

  if (selectedOptions) {
    const componentProducts: any[] =
      raw.bundle_configuration?.component_products ?? [];
    const components: Record<string, { name: string }> = raw.components ?? {};
    const result: BundleComponentItem[] = [];

    for (const [componentSlug, selections] of Object.entries(selectedOptions)) {
      const componentName = components[componentSlug]?.name ?? componentSlug;
      for (const [productId, quantity] of Object.entries(selections)) {
        const product = componentProducts.find((p: any) => p.id === productId);
        const productName = product?.attributes?.name ?? productId;
        const dp = product?.meta?.display_price;
        const dpx = product?.meta?.display_price_extended;
        const unitPriceFormatted =
          dp?.with_tax?.formatted ?? dp?.without_tax?.formatted;
        const lineTotalFormatted =
          dpx?.with_tax?.value?.formatted ?? dpx?.without_tax?.value?.formatted;
        result.push({
          componentName,
          productName,
          quantity,
          unitPriceFormatted,
          lineTotalFormatted,
        });
      }
    }

    if (result.length > 0) bundleComponents = result;
  }

  const customInputs =
    raw.custom_inputs &&
    typeof raw.custom_inputs === "object" &&
    Object.keys(raw.custom_inputs).length > 0
      ? (raw.custom_inputs as Record<string, string>)
      : undefined;

  // Applied discounts from rule promotions
  const rawDiscounts:
    | Array<{
        id: string;
        code: string;
        promotion_source?: string;
        amount: { amount: number; currency: string };
      }>
    | undefined = Array.isArray(raw.discounts) ? raw.discounts : undefined;

  // Formatted discount amounts live in meta.display_price.discounts keyed by discount code
  const dpDiscounts: Record<string, { formatted?: string }> =
    raw.meta?.display_price?.discounts ?? {};

  const discounts: CartItemDiscount[] | undefined = rawDiscounts?.length
    ? rawDiscounts.map((d) => {
        const promo = promotionsById?.get(d.id);
        return {
          promotionId: d.id,
          promotionName: promo?.name,
          promotionDescription: promo?.description,
          code: d.code,
          amountFormatted:
            dpDiscounts[d.code]?.formatted ?? `${d.amount.amount}`,
        };
      })
    : undefined;

  const dp = raw.meta?.display_price;
  const lineTotalOriginalFormatted: string | undefined = discounts?.length
    ? (dp?.without_discount?.value?.formatted ?? undefined)
    : undefined;

  const isSubscription = raw.type === "subscription_item";
  const imageHref =
    (raw.custom_inputs?.image_url as string | undefined) ||
    (item.image?.href || undefined);

  const subscriptionMeta = isSubscription
    ? (raw.custom_inputs?.subscription as { plan_name?: string; frequency?: string } | undefined)
    : undefined;

  return {
    id: item.id ?? "",
    productId: item.product_id ?? "",
    sku: item.sku ?? undefined,
    name: item.name ?? "",
    quantity: item.quantity ?? 1,
    unitPriceAmount: (withTax as any)?.unit?.amount ?? 0,
    currency: (withTax as any)?.unit?.currency ?? "USD",
    unitPriceFormatted: (withTax as any)?.unit?.formatted ?? "",
    lineTotalFormatted: (withTax as any)?.value?.formatted ?? "",
    lineTotalOriginalFormatted,
    imageHref,
    bundleComponents,
    customInputs,
    discounts,
    isSubscription: isSubscription || undefined,
    subscriptionPlanName: subscriptionMeta?.plan_name ?? undefined,
    subscriptionFrequency: subscriptionMeta?.frequency ?? undefined,
  };
}

function extractAppliedPromoCodes(responseData: any): AppliedPromoCode[] {
  const seen = new Map<string, AppliedPromoCode>();

  // Cart-level promotion_items (explicit promo code entry)
  ((responseData?.data ?? []) as any[])
    .filter((i) => i.type === "promotion_item")
    .forEach((i) => {
      const code = (i.code ?? i.sku) as string;
      if (code && !seen.has(code)) {
        seen.set(code, {
          id: i.id as string,
          code,
          name: i.name as string | undefined,
          discountFormatted: i.meta?.display_price?.with_tax?.value
            ?.formatted as string | undefined,
        });
      }
    });

  // Line-item discounts whose code doesn't start with auto_ (manual promo codes)
  ((responseData?.data ?? []) as any[])
    .filter((i) => i.type === "cart_item" && Array.isArray(i.discounts))
    .forEach((item) => {
      (item.discounts as any[])
        .filter((d) => d.code && !String(d.code).startsWith("auto_"))
        .forEach((d) => {
          if (!seen.has(d.code)) {
            seen.set(d.code, {
              id: d.id as string,
              code: d.code as string,
            });
          }
        });
    });

  return Array.from(seen.values());
}

function filterSuggestions(
  raw: PromotionSuggestion[] | undefined,
): PromotionSuggestion[] {
  return (raw ?? []).filter((s) =>
    s.targets.some((t) => Array.isArray(t.skus) && t.skus.length > 0),
  );
}

function parseCartResponse(response: CartsResponse): {
  items: CartLineItem[];
  cartTotal: string;
  cartTotalAmount: number;
  cartSubtotal: string;
  cartDiscount: string;
  cartDiscountAmount: number;
  cartShipping: string;
  cartShippingAmount: number;
} {
  // Build promotion name lookup from included.promotions (present when include=promotions was passed)
  const promotionsById = new Map<
    string,
    { name: string; description?: string }
  >();
  const includedPromos = (response as any)?.included?.promotions;
  if (Array.isArray(includedPromos)) {
    includedPromos.forEach((p: any) => {
      if (p?.id && p?.name)
        promotionsById.set(p.id, {
          name: p.name,
          description: p.description ?? undefined,
        });
    });
  }

  const rawItems = (response.data ?? []).filter(
    (i): i is CartItemObject =>
      (i as CartItemObject).type === "cart_item" ||
      (i as any).type === "subscription_item" ||
      (i as CartItemObject).type === undefined,
  );
  const items = rawItems.map((item) => toCartLineItem(item, promotionsById));
  const cartTotal =
    response.meta?.display_price?.with_tax?.formatted ??
    response.meta?.display_price?.without_tax?.formatted ??
    "";
  const cartTotalAmount =
    (response.meta?.display_price?.with_tax as any)?.amount ??
    (response.meta?.display_price?.without_tax as any)?.amount ??
    0;
  const cartSubtotal =
    (response.meta?.display_price as any)?.without_discount?.formatted ?? "";
  const cartDiscount =
    (response.meta?.display_price as any)?.discount?.formatted ?? "";
  const cartDiscountAmount =
    (response.meta?.display_price as any)?.discount?.amount ?? 0;
  const cartShipping =
    (response.meta?.display_price as any)?.shipping?.formatted ?? "";
  const cartShippingAmount =
    (response.meta?.display_price as any)?.shipping?.amount ?? 0;
  return {
    items,
    cartTotal,
    cartTotalAmount,
    cartSubtotal,
    cartDiscount,
    cartDiscountAmount,
    cartShipping,
    cartShippingAmount,
  };
}

function toCartSummary(
  c: CartResponse,
  itemCountOverride?: number,
): CartSummary {
  return {
    id: c.id ?? "",
    name: c.name ?? c.id ?? "Cart",
    description: c.description ?? undefined,
    totalFormatted:
      (c as any).meta?.display_price?.with_tax?.formatted ??
      (c as any).meta?.display_price?.without_tax?.formatted ??
      undefined,
    itemCount: itemCountOverride ?? (c as any).meta?.item_count ?? undefined,
    createdAt: (c as any).meta?.timestamps?.created_at ?? undefined,
    updatedAt:
      ((c as any).meta?.timestamps?.updated_at as string | undefined) ??
      undefined,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [epClient, setEpClient] = useState<Client | null>(null);
  const [cartId, setCartId] = useState<string | null>(null);
  const [items, setItems] = useState<CartLineItem[]>([]);
  const [cartTotal, setCartTotal] = useState("");
  const [cartTotalAmount, setCartTotalAmount] = useState(0);
  const [cartSubtotal, setCartSubtotal] = useState("");
  const [cartDiscount, setCartDiscount] = useState("");
  const [cartDiscountAmount, setCartDiscountAmount] = useState(0);
  const [cartShipping, setCartShipping] = useState("");
  const [cartShippingAmount, setCartShippingAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [allCarts, setAllCarts] = useState<CartSummary[]>([]);
  const [appliedPromoCodes, setAppliedPromoCodes] = useState<
    AppliedPromoCode[]
  >([]);
  const [promotionSuggestions, setPromotionSuggestionsRaw] = useState<
    PromotionSuggestion[] | null
  >(null);
  const promotionSuggestionsRef = useRef<PromotionSuggestion[] | null>(null);

  // Restore from sessionStorage on mount (GET endpoint does not return promotion_suggestions)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("ep_promo_suggestions");
      if (stored) {
        const parsed = JSON.parse(stored) as PromotionSuggestion[];
        if (parsed.length) {
          setPromotionSuggestionsRaw(parsed);
          promotionSuggestionsRef.current = parsed;
        }
      }
    } catch {}
  }, []);

  const setPromotionSuggestions = useCallback(
    (suggestions: PromotionSuggestion[] | null) => {
      promotionSuggestionsRef.current = suggestions;
      setPromotionSuggestionsRaw(suggestions);
      try {
        if (suggestions && suggestions.length) {
          sessionStorage.setItem(
            "ep_promo_suggestions",
            JSON.stringify(suggestions),
          );
        } else {
          sessionStorage.removeItem("ep_promo_suggestions");
        }
      } catch {}
    },
    [],
  );

  const clearPromotionSuggestions = useCallback(
    () => setPromotionSuggestions(null),
    [setPromotionSuggestions],
  );

  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const dismissPromotionModal = useCallback(
    () => setShowPromotionModal(false),
    [],
  );

  const prevIsAuthRef = useRef<boolean | null>(null);
  const mergedInSessionRef = useRef(false);

  // Initialise EP client + load active cart once on mount
  useEffect(() => {
    const client = createEpClient({ "EP-Inventories-Multi-Location": "true" });
    setEpClient(client);

    initializeCart()
      .then(async (id) => {
        setCartId(id);
        const itemsRes = await getCartItems({
          client,
          path: { cartID: id },
          query: { include: "promotions" } as any,
        });
        if (itemsRes.data) {
          const parsed = parseCartResponse(itemsRes.data as any);
          setItems(parsed.items);
          setCartTotal(parsed.cartTotal);
          setCartTotalAmount(parsed.cartTotalAmount);
          setCartSubtotal(parsed.cartSubtotal);
          setCartDiscount(parsed.cartDiscount);
          setCartDiscountAmount(parsed.cartDiscountAmount);
          setCartShipping(parsed.cartShipping);
          setCartShippingAmount(parsed.cartShippingAmount);
          setAppliedPromoCodes(extractAppliedPromoCodes(itemsRes.data));
        }
        setIsInitializing(false);
      })
      .catch((err) => {
        console.error(err);
        setIsInitializing(false);
      });
  }, []);

  // On login: load account carts and merge the guest cart if needed.
  // On logout: clear cart list and create a fresh guest cart.
  useEffect(() => {
    if (!epClient) return;

    const wasAuth = prevIsAuthRef.current;
    prevIsAuthRef.current = isAuthenticated;

    if (!isAuthenticated) {
      setAllCarts([]);
      mergedInSessionRef.current = false;
      // On actual logout (not just initial render), create a fresh guest cart
      // so the user doesn't continue operating on their account cart.
      if (wasAuth === true) {
        createACart({
          client: epClient,
          body: { data: { name: "Cart" } } as any,
        })
          .then((res) => {
            const newId = res.data?.data?.id;
            if (newId) {
              localStorage.setItem(CART_STORAGE_KEY, newId);
              setCartId(newId);
              setItems([]);
              setCartTotal("");
            }
          })
          .catch(console.error);
      }
      return;
    }

    // Not yet ready: cartId resolves asynchronously via initializeCart()
    if (!cartId || mergedInSessionRef.current) return;

    (async () => {
      const res = await getCarts({ client: epClient }).catch(() => null);
      const allCartsRaw: any[] = res?.data?.data ?? [];
      const nonQuoteCarts = allCartsRaw.filter((c: any) => !c.is_quote);

      // Count cart_item refs from each cart's relationships (excludes promotions)
      // relationships.items.data is always populated when items exist — no reverse lookup needed
      setAllCarts(
        allCartsRaw.map((c: any) => {
          const itemRefs: any[] | null = c.relationships?.items?.data ?? null;
          const countFromRels =
            itemRefs !== null
              ? itemRefs.filter((i: any) => i.type === "cart_item").length
              : undefined;
          return toCartSummary(c, countFromRels);
        }),
      );

      // cartId is already an account cart — nothing to merge
      if (nonQuoteCarts.some((c: any) => c.id === cartId)) {
        mergedInSessionRef.current = true;
        return;
      }

      // cartId is a guest cart — merge it into an account cart
      let accountCartId = nonQuoteCarts[0]?.id as string | undefined;

      if (!accountCartId) {
        const createRes = await createACart({
          client: epClient,
          body: { data: { name: "Cart" } } as any,
        }).catch(() => null);
        accountCartId = createRes?.data?.data?.id;
        if (!accountCartId) return;
        setAllCarts((prev) => [
          ...prev,
          toCartSummary(createRes!.data!.data! as CartResponse),
        ]);
      }

      await manageCarts({
        client: epClient,
        path: { cartID: accountCartId },
        body: {
          data: { type: "cart_items", cart_id: cartId },
          options: { add_all_or_nothing: false },
        } as any,
      }).catch(console.error);

      localStorage.setItem(CART_STORAGE_KEY, accountCartId);
      mergedInSessionRef.current = true;

      // Load the merged account cart items with promotion details
      const mergedItemsRes = await getCartItems({
        client: epClient,
        path: { cartID: accountCartId },
        query: { include: "promotions" } as any,
      });
      setCartId(accountCartId);
      if (mergedItemsRes.data) {
        const parsed = parseCartResponse(mergedItemsRes.data as any);
        setItems(parsed.items);
        setCartTotal(parsed.cartTotal);
        setCartTotalAmount(parsed.cartTotalAmount);
        setCartSubtotal(parsed.cartSubtotal);
        setCartDiscount(parsed.cartDiscount);
        setCartDiscountAmount(parsed.cartDiscountAmount);
        setCartShipping(parsed.cartShipping);
        setCartShippingAmount(parsed.cartShippingAmount);
        setAppliedPromoCodes(extractAppliedPromoCodes(mergedItemsRes.data));
      }
    })();
  }, [isAuthenticated, epClient, cartId]);

  const loadItems = useCallback(async () => {
    if (!epClient || !cartId) return;
    const itemsRes = await getCartItems({
      client: epClient,
      path: { cartID: cartId },
      query: { include: "promotions" } as any,
    });
    if (itemsRes.data) {
      const parsed = parseCartResponse(itemsRes.data as any);
      setItems(parsed.items);
      setCartTotal(parsed.cartTotal);
      setCartTotalAmount(parsed.cartTotalAmount);
      setCartSubtotal(parsed.cartSubtotal);
      setCartDiscount(parsed.cartDiscount);
      setCartDiscountAmount(parsed.cartDiscountAmount);
      setCartShipping(parsed.cartShipping);
      setCartShippingAmount(parsed.cartShippingAmount);

      const suggestions = (itemsRes.data as any)?.meta
        ?.promotion_suggestions as PromotionSuggestion[] | undefined;
      const relevant = filterSuggestions(suggestions);
      if (relevant.length) setPromotionSuggestions(relevant);

      setAppliedPromoCodes(extractAppliedPromoCodes(itemsRes.data));
    }
  }, [epClient, cartId]);

  const addItem = useCallback(
    async (
      productId: string,
      quantity = 1,
      customInputs?: Record<string, string>,
      subscriptionConfig?: { offeringId: string; plan: string; pricing_option: string; planName: string; frequency: string; imageUrl?: string },
    ): Promise<PromotionSuggestion[] | undefined> => {
      if (!epClient || !cartId) return undefined;
      setIsLoading(true);
      try {
        const body: any = subscriptionConfig
          ? {
              data: {
                type: "subscription_item",
                id: subscriptionConfig.offeringId,
                quantity,
                subscription_configuration: {
                  plan: subscriptionConfig.plan,
                  pricing_option: subscriptionConfig.pricing_option,
                },
                custom_inputs: {
                  image_url: subscriptionConfig.imageUrl ?? "",
                  subscription: {
                    plan_name: subscriptionConfig.planName,
                    frequency: subscriptionConfig.frequency,
                  },
                },
              },
            }
          : { data: { type: "cart_item", id: productId, quantity } };
        if (!subscriptionConfig && customInputs && Object.keys(customInputs).length > 0) {
          body.data.custom_inputs = customInputs;
        }
        const prevIds = new Set(
          promotionSuggestionsRef.current?.map((s) => s.promotion_id) ?? [],
        );
        const res = await manageCarts({
          client: epClient,
          path: { cartID: cartId },
          body,
        });
        if (res.error) throw res.error;
        const suggestions = (res.data as any)?.meta?.promotion_suggestions as
          | PromotionSuggestion[]
          | undefined;
        const relevant = filterSuggestions(suggestions);
        setPromotionSuggestions(relevant.length ? relevant : null);
        if (relevant.some((s) => !prevIds.has(s.promotion_id)))
          setShowPromotionModal(true);
        await loadItems();
        return relevant.length ? relevant : undefined;
      } finally {
        setIsLoading(false);
      }
    },
    [epClient, cartId, loadItems],
  );

  const addItems = useCallback(
    async (
      items: Array<{ productId: string; quantity: number }>,
    ): Promise<PromotionSuggestion[] | undefined> => {
      if (!epClient || !cartId || items.length === 0) return undefined;
      setIsLoading(true);
      try {
        const prevIds = new Set(
          promotionSuggestionsRef.current?.map((s) => s.promotion_id) ?? [],
        );
        const res = await manageCarts({
          client: epClient,
          path: { cartID: cartId },
          body: {
            data: items.map(({ productId, quantity }) => ({
              type: "cart_item" as const,
              id: productId,
              quantity,
            })),
          },
        });
        const suggestions = (res.data as any)?.meta?.promotion_suggestions as
          | PromotionSuggestion[]
          | undefined;
        const relevant = filterSuggestions(suggestions);
        setPromotionSuggestions(relevant.length ? relevant : null);
        if (relevant.some((s) => !prevIds.has(s.promotion_id)))
          setShowPromotionModal(true);
        await loadItems();
        return relevant.length ? relevant : undefined;
      } finally {
        setIsLoading(false);
      }
    },
    [epClient, cartId, loadItems],
  );

  const addBundleItem = useCallback(
    async (
      productId: string,
      selectedOptions: Record<string, Record<string, number>>,
      quantity = 1,
    ): Promise<PromotionSuggestion[] | undefined> => {
      if (!epClient || !cartId) return undefined;
      setIsLoading(true);
      try {
        const prevIds = new Set(
          promotionSuggestionsRef.current?.map((s) => s.promotion_id) ?? [],
        );
        const res = await manageCarts({
          client: epClient,
          path: { cartID: cartId },
          body: {
            data: {
              type: "cart_item",
              id: productId,
              quantity,
              bundle_configuration: { selected_options: selectedOptions },
            },
          } as any,
        });
        const suggestions = (res.data as any)?.meta?.promotion_suggestions as
          | PromotionSuggestion[]
          | undefined;
        const relevant = filterSuggestions(suggestions);
        setPromotionSuggestions(relevant.length ? relevant : null);
        if (relevant.some((s) => !prevIds.has(s.promotion_id)))
          setShowPromotionModal(true);
        await loadItems();
        return relevant.length ? relevant : undefined;
      } finally {
        setIsLoading(false);
      }
    },
    [epClient, cartId, loadItems],
  );

  const removeItem = useCallback(
    async (cartItemId: string) => {
      if (!epClient || !cartId) return;
      setIsLoading(true);
      try {
        const res = await deleteACartItem({
          client: epClient,
          path: { cartID: cartId, cartitemID: cartItemId },
        });
        const suggestions = (res.data as any)?.meta?.promotion_suggestions as
          | PromotionSuggestion[]
          | undefined;
        const relevant = filterSuggestions(suggestions);
        setPromotionSuggestions(relevant.length ? relevant : null);
        await loadItems();
      } finally {
        setIsLoading(false);
      }
    },
    [epClient, cartId, loadItems, setPromotionSuggestions],
  );

  const updateQuantity = useCallback(
    async (cartItemId: string, quantity: number) => {
      if (!epClient || !cartId) return;
      if (quantity <= 0) {
        await removeItem(cartItemId);
        return;
      }
      setIsLoading(true);
      try {
        const res = await updateACartItem({
          client: epClient,
          path: { cartID: cartId, cartitemID: cartItemId },
          body: { data: { type: "cart_item", quantity } },
        });
        if (res.error) throw res.error;
        const suggestions = (res.data as any)?.meta?.promotion_suggestions as
          | PromotionSuggestion[]
          | undefined;
        const relevant = filterSuggestions(suggestions);
        setPromotionSuggestions(relevant.length ? relevant : null);
        await loadItems();
      } finally {
        setIsLoading(false);
      }
    },
    [epClient, cartId, removeItem, loadItems, setPromotionSuggestions],
  );

  const clearCart = useCallback(async () => {
    if (!epClient || !cartId) return;
    setIsLoading(true);
    try {
      const res = await deleteAllCartItems({
        client: epClient,
        path: { cartID: cartId },
      });
      setItems([]);
      setCartTotal("");
      setCartTotalAmount(0);
      setCartShipping("");
      setCartShippingAmount(0);
      const suggestions = (res.data as any)?.meta?.promotion_suggestions as
        | PromotionSuggestion[]
        | undefined;
      const relevant = filterSuggestions(suggestions);
      setPromotionSuggestions(relevant.length ? relevant : null);
    } finally {
      setIsLoading(false);
    }
  }, [epClient, cartId, setPromotionSuggestions]);

  const switchCart = useCallback(
    async (newCartId: string) => {
      if (!epClient || newCartId === cartId) return;
      setIsLoading(true);
      try {
        const itemsRes = await getCartItems({
          client: epClient,
          path: { cartID: newCartId },
          query: { include: "promotions" } as any,
        });
        localStorage.setItem(CART_STORAGE_KEY, newCartId);
        setCartId(newCartId);
        if (itemsRes.data) {
          const parsed = parseCartResponse(itemsRes.data as any);
          setItems(parsed.items);
          setCartTotal(parsed.cartTotal);
          setCartTotalAmount(parsed.cartTotalAmount);
          setCartSubtotal(parsed.cartSubtotal);
          setCartDiscount(parsed.cartDiscount);
          setCartDiscountAmount(parsed.cartDiscountAmount);
          setCartShipping(parsed.cartShipping);
          setCartShippingAmount(parsed.cartShippingAmount);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [epClient, cartId],
  );

  const createCart = useCallback(
    async (name: string): Promise<string | null> => {
      if (!epClient) return null;
      setIsLoading(true);
      try {
        const res = await createACart({
          client: epClient,
          body: { data: { name } } as any,
        });
        const newCart = res.data?.data;
        if (!newCart?.id) return null;
        setAllCarts((prev) => [...prev, toCartSummary(newCart)]);
        await switchCart(newCart.id);
        return newCart.id;
      } finally {
        setIsLoading(false);
      }
    },
    [epClient, switchCart],
  );

  const deleteCart = useCallback(
    async (targetCartId: string) => {
      if (!epClient) return;
      setIsLoading(true);
      try {
        await deleteACart({ client: epClient, path: { cartID: targetCartId } });
        const remaining = allCarts.filter((c) => c.id !== targetCartId);
        setAllCarts(remaining);
        if (targetCartId === cartId) {
          const next = remaining[0];
          if (next) {
            await switchCart(next.id);
          } else {
            setCartId(null);
            setItems([]);
            setCartTotal("");
            setCartTotalAmount(0);
          }
        }
      } finally {
        setIsLoading(false);
      }
    },
    [epClient, cartId, allCarts, switchCart],
  );

  const updateCart = useCallback(
    async (targetCartId: string, name: string, description?: string) => {
      if (!epClient) return;
      await updateACart({
        client: epClient,
        path: { cartID: targetCartId },
        body: { data: { name, description } },
      }).catch(() => null);
      setAllCarts((prev) =>
        prev.map((c) =>
          c.id === targetCartId ? { ...c, name, description } : c,
        ),
      );
    },
    [epClient],
  );

  const clearCartById = useCallback(
    async (targetCartId: string) => {
      if (!epClient) return;
      setIsLoading(true);
      try {
        await deleteAllCartItems({
          client: epClient,
          path: { cartID: targetCartId },
        });
        setAllCarts((prev) =>
          prev.map((c) =>
            c.id === targetCartId
              ? { ...c, itemCount: 0, totalFormatted: undefined }
              : c,
          ),
        );
        if (targetCartId === cartId) {
          setItems([]);
          setCartTotal("");
          setCartTotalAmount(0);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [epClient, cartId],
  );

  const applyPromoCode = useCallback(
    async (code: string): Promise<{ success: boolean; error?: string }> => {
      if (!epClient || !cartId) return { success: false };
      setIsLoading(true);
      try {
        const res = await manageCarts({
          client: epClient,
          path: { cartID: cartId },
          body: { data: { type: "promotion_item", code } } as any,
        });
        if (res.error) {
          const detail =
            (res.error as any)?.errors?.[0]?.detail ??
            (res.error as any)?.errors?.[0]?.title ??
            "Invalid promotion code";
          return { success: false, error: detail };
        }
        await loadItems();
        return { success: true };
      } catch (err: any) {
        return {
          success: false,
          error: err?.message ?? "Failed to apply promotion code",
        };
      } finally {
        setIsLoading(false);
      }
    },
    [epClient, cartId, loadItems],
  );

  const removePromoCode = useCallback(
    async (code: string): Promise<void> => {
      if (!epClient || !cartId) return;
      setIsLoading(true);
      try {
        await deleteAPromotionViaPromotionCode({
          client: epClient,
          path: { cartID: cartId, promoCode: code },
        });
        await loadItems();
      } finally {
        setIsLoading(false);
      }
    },
    [epClient, cartId, loadItems],
  );

  const refreshCart = useCallback(async () => {
    try {
      await loadItems();
    } catch {
      /* silent — stale values stay until next successful refresh */
    }
  }, [loadItems]);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        cartTotal,
        cartTotalAmount,
        cartSubtotal,
        cartDiscount,
        cartDiscountAmount,
        cartShipping,
        cartShippingAmount,
        refreshCart,
        cartId,
        allCarts,
        isLoading,
        isInitializing,
        addItem,
        addItems,
        addBundleItem,
        removeItem,
        updateQuantity,
        clearCart,
        switchCart,
        createCart,
        updateCart,
        deleteCart,
        clearCartById,
        promotionSuggestions,
        clearPromotionSuggestions,
        showPromotionModal,
        dismissPromotionModal,
        appliedPromoCodes,
        applyPromoCode,
        removePromoCode,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
