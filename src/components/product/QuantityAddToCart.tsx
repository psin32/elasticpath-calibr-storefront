"use client";

import { useState } from "react";
import { QuantitySelector } from "./QuantitySelector";
import { AddToCart } from "./AddToCart";

type Props = { productId: string };

export function QuantityAddToCart({ productId }: Props) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <QuantitySelector value={quantity} onChange={setQuantity} />
        <AddToCart
          productId={productId}
          quantity={quantity}
          variant="full"
          className="flex-1"
        />
      </div>
      <p className="text-xs text-gray-400">Free shipping on orders over $50</p>
    </div>
  );
}
