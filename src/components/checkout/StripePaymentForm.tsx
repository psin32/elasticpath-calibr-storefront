"use client";

import { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import type { Stripe, StripeElements } from "@stripe/stripe-js";
import { useTranslations } from "next-intl";
import { Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button/Button";

type Props = {
  onPayment: (stripe: Stripe, elements: StripeElements) => Promise<void>;
  isProcessing: boolean;
  externalError?: string | null;
};

export function StripePaymentForm({ onPayment, isProcessing, externalError }: Props) {
  const t = useTranslations("checkout");
  const stripe = useStripe();
  const elements = useElements();
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const isLoading = isConfirming || isProcessing;
  const displayError = stripeError || externalError;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || isLoading) return;

    setIsConfirming(true);
    setStripeError(null);

    try {
      await onPayment(stripe, elements);
    } catch (err) {
      setStripeError(
        err instanceof Error ? err.message : t("paymentFailed")
      );
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement options={{ layout: "tabs" }} />

      {displayError && (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{displayError}</span>
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isLoading}
        disabled={!stripe || !elements || isLoading}
        leftIcon={!isLoading ? <Lock size={16} /> : undefined}
      >
        {isConfirming
          ? t("verifyingPayment")
          : isProcessing
            ? t("placingOrder")
            : t("placeOrder")}
      </Button>

      <p className="text-center text-xs text-gray-400">{t("securePayment")}</p>
    </form>
  );
}
