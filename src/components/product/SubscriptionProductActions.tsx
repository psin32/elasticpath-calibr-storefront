"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { SubscriptionContext } from "@/context/SubscriptionContext";
import { SubscriptionSelector } from "./SubscriptionSelector";
import type { ProductOffering } from "@/lib/api/subscriptions";

type Props = {
  offering: ProductOffering;
  oneTimePrice: string;
  originalPrice?: string;
  imageUrl?: string;
  children: ReactNode;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function frequencyLabel(t: any, freq: number, interval: string): string {
  const key = `frequency${interval.charAt(0).toUpperCase()}${interval.slice(1)}`;
  return t(key, { count: freq });
}

export function SubscriptionProductActions({
  offering,
  oneTimePrice,
  originalPrice,
  imageUrl,
  children,
}: Props) {
  const t = useTranslations("product");
  const [purchaseType, setPurchaseType] = useState<"onetime" | "subscribe">(
    "onetime",
  );
  const [planId, setPlanId] = useState(offering.plans[0]?.id ?? "");

  const activePlan =
    offering.plans.find((p) => p.id === planId) ?? offering.plans[0];

  const subscriptionConfig =
    purchaseType === "subscribe" && activePlan
      ? {
          offeringId: offering.offeringId,
          plan: activePlan.planId,
          pricing_option: activePlan.id,
          planName: activePlan.name,
          frequency: frequencyLabel(t, activePlan.billingFrequency, activePlan.billingIntervalType),
          imageUrl,
        }
      : null;

  return (
    <SubscriptionContext.Provider value={subscriptionConfig}>
      <div className="mb-6">
        <SubscriptionSelector
          offering={offering}
          oneTimePrice={oneTimePrice}
          originalPrice={originalPrice}
          selected={purchaseType}
          selectedPlanId={planId}
          onTypeChange={setPurchaseType}
          onPlanChange={setPlanId}
        />
      </div>
      {children}
    </SubscriptionContext.Provider>
  );
}
