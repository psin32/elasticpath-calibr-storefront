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
  getACart,
  getCarts,
  createACart,
  deleteACart,
  updateACartItem,
  deleteACartItem,
  deleteAllCartItems,
  type CartItemObject,
  type CartsResponse,
  type CartResponse,
} from "@epcc-sdk/sdks-shopper";
import type { Client } from "@hey-api/client-fetch";
import { createEpClient } from "@/lib/api/ep-client";
import { useAuth } from "@/context/AuthContext";

export type BundleComponentItem = {
  componentName: string;
  productName: string;
  quantity: number;
  unitPriceFormatted?: string;
  lineTotalFormatted?: string;
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
  imageHref?: string;
  bundleComponents?: BundleComponentItem[];
  customInputs?: Record<string, string>;
};

export type CartSummary = {
  id: string;
  name: string;
  description?: string;
  totalFormatted?: string;
  itemCount?: number;
};

const CART_STORAGE_KEY = "_store_ep_cart";

type CartContextValue = {
  items: CartLineItem[];
  itemCount: number;
  cartTotal: string;
  cartTotalAmount: number;
  cartId: string | null;
  allCarts: CartSummary[];
  isLoading: boolean;
  addItem: (productId: string, quantity?: number, customInputs?: Record<string, string>) => Promise<void>;
  addBundleItem: (productId: string, selectedOptions: Record<string, Record<string, number>>, quantity?: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  switchCart: (newCartId: string) => Promise<void>;
  createCart: (name: string) => Promise<string | null>;
  deleteCart: (targetCartId: string) => Promise<void>;
  clearCartById: (targetCartId: string) => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

function toCartLineItem(item: CartItemObject): CartLineItem {
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
        result.push({ componentName, productName, quantity, unitPriceFormatted, lineTotalFormatted });
      }
    }

    if (result.length > 0) bundleComponents = result;
  }

  const customInputs =
    raw.custom_inputs && typeof raw.custom_inputs === "object" && Object.keys(raw.custom_inputs).length > 0
      ? (raw.custom_inputs as Record<string, string>)
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
    imageHref: item.image?.href,
    bundleComponents,
    customInputs,
  };
}

function parseCartResponse(response: CartsResponse): {
  items: CartLineItem[];
  cartTotal: string;
  cartTotalAmount: number;
} {
  const rawItems = (response.data ?? []).filter(
    (i): i is CartItemObject =>
      (i as CartItemObject).type === "cart_item" ||
      (i as CartItemObject).type === undefined
  );
  const items = rawItems.map(toCartLineItem);
  const cartTotal =
    response.meta?.display_price?.with_tax?.formatted ??
    response.meta?.display_price?.without_tax?.formatted ??
    "";
  const cartTotalAmount =
    (response.meta?.display_price?.with_tax as any)?.amount ??
    (response.meta?.display_price?.without_tax as any)?.amount ??
    0;
  return { items, cartTotal, cartTotalAmount };
}

function toCartSummary(c: CartResponse): CartSummary {
  return {
    id: c.id ?? "",
    name: c.name ?? c.id ?? "Cart",
    description: c.description ?? undefined,
    totalFormatted:
      (c as any).meta?.display_price?.with_tax?.formatted ??
      (c as any).meta?.display_price?.without_tax?.formatted ??
      undefined,
    itemCount: (c as any).meta?.item_count ?? undefined,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [epClient, setEpClient] = useState<Client | null>(null);
  const [cartId, setCartId] = useState<string | null>(null);
  const [items, setItems] = useState<CartLineItem[]>([]);
  const [cartTotal, setCartTotal] = useState("");
  const [cartTotalAmount, setCartTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [allCarts, setAllCarts] = useState<CartSummary[]>([]);

  const prevIsAuthRef = useRef<boolean | null>(null);
  const mergedInSessionRef = useRef(false);

  // Initialise EP client + load active cart once on mount
  useEffect(() => {
    const client = createEpClient({ "EP-Inventories-Multi-Location": "true" });
    setEpClient(client);

    initializeCart()
      .then(async (id) => {
        setCartId(id);
        const [itemsRes, cartRes] = await Promise.all([
          getCartItems({ client, path: { cartID: id } }),
          getACart({ client, path: { cartID: id } }),
        ]);
        const rawItems = (itemsRes.data?.data ?? []).filter(
          (i): i is CartItemObject => (i as CartItemObject).type === "cart_item"
        );
        setItems(rawItems.map(toCartLineItem));
        const meta = cartRes.data?.data?.meta;
        setCartTotal(
          meta?.display_price?.with_tax?.formatted ??
            meta?.display_price?.without_tax?.formatted ??
            ""
        );
        setCartTotalAmount(
          (meta?.display_price?.with_tax as any)?.amount ??
            (meta?.display_price?.without_tax as any)?.amount ??
            0
        );
      })
      .catch(console.error);
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
        createACart({ client: epClient, body: { data: { name: "Storefront cart" } } as any })
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
      const allCartsRaw = res?.data?.data ?? [];
      const nonQuoteCarts = allCartsRaw.filter((c: any) => !c.is_quote);
      setAllCarts(allCartsRaw.map(toCartSummary));

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
        setAllCarts((prev) => [...prev, toCartSummary(createRes!.data!.data! as CartResponse)]);
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

      // Load the merged account cart items
      const [itemsRes, cartRes] = await Promise.all([
        getCartItems({ client: epClient, path: { cartID: accountCartId } }),
        getACart({ client: epClient, path: { cartID: accountCartId } }),
      ]);
      const rawItems = (itemsRes.data?.data ?? []).filter(
        (i): i is CartItemObject => (i as CartItemObject).type === "cart_item"
      );
      setCartId(accountCartId);
      setItems(rawItems.map(toCartLineItem));
      const mergedMeta = cartRes.data?.data?.meta;
      setCartTotal(
        mergedMeta?.display_price?.with_tax?.formatted ??
          mergedMeta?.display_price?.without_tax?.formatted ??
          ""
      );
      setCartTotalAmount(
        (mergedMeta?.display_price?.with_tax as any)?.amount ??
          (mergedMeta?.display_price?.without_tax as any)?.amount ??
          0
      );
    })();
  }, [isAuthenticated, epClient, cartId]);

  const applyCartsResponse = useCallback((response: CartsResponse) => {
    const { items: newItems, cartTotal: newTotal, cartTotalAmount: newTotalAmount } = parseCartResponse(response);
    setItems(newItems);
    setCartTotal(newTotal);
    setCartTotalAmount(newTotalAmount);
  }, []);

  const addItem = useCallback(
    async (productId: string, quantity = 1, customInputs?: Record<string, string>) => {
      if (!epClient || !cartId) return;
      setIsLoading(true);
      try {
        const body: any = { data: { type: "cart_item", id: productId, quantity } };
        if (customInputs && Object.keys(customInputs).length > 0) {
          body.data.custom_inputs = customInputs;
        }
        const res = await manageCarts({
          client: epClient,
          path: { cartID: cartId },
          body,
        });
        if (res.data) applyCartsResponse(res.data);
      } finally {
        setIsLoading(false);
      }
    },
    [epClient, cartId, applyCartsResponse]
  );

  const addBundleItem = useCallback(
    async (productId: string, selectedOptions: Record<string, Record<string, number>>, quantity = 1) => {
      if (!epClient || !cartId) return;
      setIsLoading(true);
      try {
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
        if (res.data) applyCartsResponse(res.data);
      } finally {
        setIsLoading(false);
      }
    },
    [epClient, cartId, applyCartsResponse]
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
        if (res.data) applyCartsResponse(res.data);
      } finally {
        setIsLoading(false);
      }
    },
    [epClient, cartId, applyCartsResponse]
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
        if (res.data) applyCartsResponse(res.data);
      } finally {
        setIsLoading(false);
      }
    },
    [epClient, cartId, removeItem, applyCartsResponse]
  );

  const clearCart = useCallback(async () => {
    if (!epClient || !cartId) return;
    setIsLoading(true);
    try {
      await deleteAllCartItems({
        client: epClient,
        path: { cartID: cartId },
      });
      setItems([]);
      setCartTotal("");
      setCartTotalAmount(0);
    } finally {
      setIsLoading(false);
    }
  }, [epClient, cartId]);

  const switchCart = useCallback(
    async (newCartId: string) => {
      if (!epClient || newCartId === cartId) return;
      setIsLoading(true);
      try {
        const [itemsRes, cartRes] = await Promise.all([
          getCartItems({ client: epClient, path: { cartID: newCartId } }),
          getACart({ client: epClient, path: { cartID: newCartId } }),
        ]);
        const rawItems = (itemsRes.data?.data ?? []).filter(
          (i): i is CartItemObject => (i as CartItemObject).type === "cart_item"
        );
        const switchMeta = cartRes.data?.data?.meta;
        localStorage.setItem(CART_STORAGE_KEY, newCartId);
        setCartId(newCartId);
        setItems(rawItems.map(toCartLineItem));
        setCartTotal(
          switchMeta?.display_price?.with_tax?.formatted ??
            switchMeta?.display_price?.without_tax?.formatted ??
            ""
        );
        setCartTotalAmount(
          (switchMeta?.display_price?.with_tax as any)?.amount ??
            (switchMeta?.display_price?.without_tax as any)?.amount ??
            0
        );
      } finally {
        setIsLoading(false);
      }
    },
    [epClient, cartId]
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
    [epClient, switchCart]
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
    [epClient, cartId, allCarts, switchCart]
  );

  const clearCartById = useCallback(
    async (targetCartId: string) => {
      if (!epClient) return;
      setIsLoading(true);
      try {
        await deleteAllCartItems({ client: epClient, path: { cartID: targetCartId } });
        setAllCarts((prev) =>
          prev.map((c) =>
            c.id === targetCartId ? { ...c, itemCount: 0, totalFormatted: undefined } : c
          )
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
    [epClient, cartId]
  );

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        cartTotal,
        cartTotalAmount,
        cartId,
        allCarts,
        isLoading,
        addItem,
        addBundleItem,
        removeItem,
        updateQuantity,
        clearCart,
        switchCart,
        createCart,
        deleteCart,
        clearCartById,
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
