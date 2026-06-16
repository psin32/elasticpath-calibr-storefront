"use client";

import { useState, useCallback } from "react";
import { checkoutApi } from "@epcc-sdk/sdks-shopper";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { createEpClient } from "@/lib/api/ep-client";

export type AddressData = {
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  county?: string;
  country: string;
  region?: string;
};

export type CheckoutFormData = {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  company?: string;
  shippingAddress: AddressData;
  sameBillingAsShipping: boolean;
  billingAddress?: AddressData;
  billingFirstName?: string;
  billingLastName?: string;
  billingCompany?: string;
};

export function useCheckout(lang: string) {
  const { cartId, clearCart } = useCart();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitCheckout = useCallback(
    async (data: CheckoutFormData) => {
      if (!cartId) {
        setError("No active cart found. Please add items before checking out.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const client = createEpClient({ "EP-Inventories-Multi-Location": "true" });

        const shipping = data.shippingAddress;
        const billing = data.sameBillingAsShipping
          ? data.shippingAddress
          : data.billingAddress ?? data.shippingAddress;

        const res = await checkoutApi({
          client,
          path: { cartID: cartId },
          body: {
            data: {
              customer: {
                email: data.email,
                name: `${data.firstName} ${data.lastName}`,
              },
              shipping_address: {
                first_name: data.firstName,
                last_name: data.lastName,
                phone_number: data.phone ?? "",
                company_name: data.company ?? "",
                line_1: shipping.line1,
                line_2: shipping.line2 ?? "",
                city: shipping.city,
                postcode: shipping.postcode,
                county: shipping.county ?? "",
                country: shipping.country,
                region: shipping.region,
                instructions: "",
              },
              billing_address: {
                first_name: data.sameBillingAsShipping
                  ? data.firstName
                  : (data.billingFirstName ?? data.firstName),
                last_name: data.sameBillingAsShipping
                  ? data.lastName
                  : (data.billingLastName ?? data.lastName),
                company_name: data.sameBillingAsShipping
                  ? (data.company ?? "")
                  : (data.billingCompany ?? ""),
                line_1: billing.line1,
                line_2: billing.line2 ?? "",
                city: billing.city,
                postcode: billing.postcode,
                county: billing.county ?? "",
                country: billing.country,
                region: billing.region,
              },
            },
          },
        });

        const orderId = res.data?.data?.id;
        if (!orderId) {
          throw new Error("Order creation failed — no order ID returned.");
        }

        await clearCart();
        router.push(`/${lang}/order-confirmation/${orderId}`);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to place order. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [cartId, clearCart, router, lang]
  );

  return { submitCheckout, isLoading, error };
}
