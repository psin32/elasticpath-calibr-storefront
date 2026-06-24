"use client";

import { useState, useCallback } from "react";
import { useCart } from "@/context/CartContext";

export function useAddToCart(productId: string, customInputs?: Record<string, string>) {
  const { addItem } = useCart();
  const [isPending, setIsPending] = useState(false);
  const [added, setAdded] = useState(false);

  const add = useCallback(
    async (quantity = 1) => {
      setIsPending(true);
      try {
        await addItem(productId, quantity, customInputs);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      } finally {
        setIsPending(false);
      }
    },
    [addItem, productId, customInputs]
  );

  return { add, isPending, added };
}
