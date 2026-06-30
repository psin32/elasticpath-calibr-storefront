"use client";

import { cn } from "@/lib/utils";
import { useAddToCart } from "@/hooks/use-add-to-cart";
import { ShoppingBag, Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

type AddToCartProps = {
  productId: string;
  quantity?: number;
  className?: string;
  variant?: "default" | "full";
  customInputs?: Record<string, string>;
};

export function AddToCart({
  productId,
  quantity = 1,
  className,
  variant = "default",
  customInputs,
}: AddToCartProps) {
  const t = useTranslations("product");
  const { add, isPending, added } = useAddToCart(productId, customInputs);

  return (
    <button
      onClick={() => add(quantity)}
      disabled={isPending}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium text-sm transition-all",
        variant === "full"
          ? "w-full py-3 px-6 text-base"
          : "px-3 py-1.5 text-xs",
        added
          ? "bg-brand-secondary text-white"
          : "bg-brand-primary text-white hover:opacity-90 disabled:opacity-60",
        className,
      )}
    >
      {isPending ? (
        <Loader2 size={variant === "full" ? 18 : 14} className="animate-spin" />
      ) : added ? (
        <Check size={variant === "full" ? 18 : 14} />
      ) : (
        <ShoppingBag size={variant === "full" ? 18 : 14} />
      )}
      {added ? t("added") : t("addToCart")}
    </button>
  );
}
