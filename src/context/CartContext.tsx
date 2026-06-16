"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  initializeCart,
  manageCarts,
  getCartItems,
  getACart,
  updateACartItem,
  deleteACartItem,
  deleteAllCartItems,
  type CartItemObject,
  type CartsResponse,
} from "@epcc-sdk/sdks-shopper";
import type { Client } from "@hey-api/client-fetch";
import { createEpClient } from "@/lib/api/ep-client";

export type CartLineItem = {
  id: string;
  productId: string;
  sku?: string;
  name: string;
  quantity: number;
  unitPriceFormatted: string;
  lineTotalFormatted: string;
  imageHref?: string;
};

type CartContextValue = {
  items: CartLineItem[];
  itemCount: number;
  cartTotal: string;
  cartId: string | null;
  isLoading: boolean;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  addBundleItem: (productId: string, selectedOptions: Record<string, Record<string, number>>, quantity?: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

function toCartLineItem(item: CartItemObject): CartLineItem {
  const withTax = item.meta?.display_price?.with_tax;
  return {
    id: item.id ?? "",
    productId: item.product_id ?? "",
    sku: item.sku ?? undefined,
    name: item.name ?? "",
    quantity: item.quantity ?? 1,
    unitPriceFormatted: (withTax as any)?.unit?.formatted ?? "",
    lineTotalFormatted: (withTax as any)?.value?.formatted ?? "",
    imageHref: item.image?.href,
  };
}

function parseCartResponse(response: CartsResponse): {
  items: CartLineItem[];
  cartTotal: string;
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
  return { items, cartTotal };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [epClient, setEpClient] = useState<Client | null>(null);
  const [cartId, setCartId] = useState<string | null>(null);
  const [items, setItems] = useState<CartLineItem[]>([]);
  const [cartTotal, setCartTotal] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
        setCartTotal(
          cartRes.data?.data?.meta?.display_price?.with_tax?.formatted ??
            cartRes.data?.data?.meta?.display_price?.without_tax?.formatted ??
            ""
        );
      })
      .catch(console.error);
  }, []);

  const applyCartsResponse = useCallback((response: CartsResponse) => {
    const { items: newItems, cartTotal: newTotal } = parseCartResponse(response);
    setItems(newItems);
    setCartTotal(newTotal);
  }, []);

  const addItem = useCallback(
    async (productId: string, quantity = 1) => {
      if (!epClient || !cartId) return;
      setIsLoading(true);
      try {
        const res = await manageCarts({
          client: epClient,
          path: { cartID: cartId },
          body: { data: { type: "cart_item", id: productId, quantity } } as any,
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
    } finally {
      setIsLoading(false);
    }
  }, [epClient, cartId]);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        cartTotal,
        cartId,
        isLoading,
        addItem,
        addBundleItem,
        removeItem,
        updateQuantity,
        clearCart,
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
