"use client";

import { useTranslations } from "next-intl";
import type {
  ProductOffering,
  SubscriptionPlan,
} from "@/lib/api/subscriptions";

type Props = {
  oneTimePrice: string;
  originalPrice?: string;
  offering: ProductOffering;
  selected: "onetime" | "subscribe";
  selectedPlanId: string;
  onTypeChange: (type: "onetime" | "subscribe") => void;
  onPlanChange: (planId: string) => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function frequencyLabel(t: any, freq: number, interval: string): string {
  const key = `frequency${interval.charAt(0).toUpperCase()}${interval.slice(1)}`;
  return t(key, { count: freq });
}

function RadioDot({ active, green }: { active: boolean; green?: boolean }) {
  const color = green ? "#18804C" : "#0E1521";
  return (
    <div
      className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-none transition-colors"
      style={{ borderColor: active ? color : "#C2C8D0" }}
    >
      {active && (
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
    </div>
  );
}

export function SubscriptionSelector({
  oneTimePrice,
  originalPrice,
  offering,
  selected,
  selectedPlanId,
  onTypeChange,
  onPlanChange,
}: Props) {
  const t = useTranslations("product");

  const activePlan: SubscriptionPlan | undefined =
    offering.plans.find((p) => p.id === selectedPlanId) ?? offering.plans[0];

  return (
    <div className="space-y-2">
      {/* One-time */}
      <label
        className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 cursor-pointer transition-colors ${
          selected === "onetime"
            ? "border-[#0E1521] bg-[#F7F8F9]"
            : "border-[#DDE1E6] bg-white hover:border-[#C2C8D0]"
        }`}
      >
        <div className="flex items-center gap-3">
          <RadioDot active={selected === "onetime"} />
          <input
            type="radio"
            name="purchase-type"
            value="onetime"
            checked={selected === "onetime"}
            onChange={() => onTypeChange("onetime")}
            className="sr-only"
          />
          <span className="text-[14px] font-medium text-[#0E1521]">
            {t("oneTimePurchase")}
          </span>
        </div>
        <div className="text-right">
          {originalPrice && (
            <p className="text-[11px] text-[#8C95A3] line-through">
              {originalPrice}
            </p>
          )}
          <p className="text-[15px] font-bold text-[#0E1521]">{oneTimePrice}</p>
        </div>
      </label>

      {/* Subscribe & Save */}
      <label
        className={`flex flex-col px-4 py-3 rounded-xl border-2 cursor-pointer transition-colors ${
          selected === "subscribe"
            ? "border-[#18804C] bg-[#F0FDF6]"
            : "border-[#DDE1E6] bg-white hover:border-[#A6EBCA]"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RadioDot active={selected === "subscribe"} green />
            <input
              type="radio"
              name="purchase-type"
              value="subscribe"
              checked={selected === "subscribe"}
              onChange={() => onTypeChange("subscribe")}
              className="sr-only"
            />
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-medium text-[#0E1521]">
                {activePlan?.planName || t("subscribeAndSave")}
              </span>
            </div>
          </div>
          {activePlan && (
            <div className="text-right">
              {activePlan.priceFormatted && (
                <p className="text-[15px] font-bold text-[#18804C]">
                  {activePlan.priceFormatted}
                </p>
              )}
              <p className="text-[11px] text-[#5C6675]">
                {frequencyLabel(
                  t,
                  activePlan.billingFrequency,
                  activePlan.billingIntervalType,
                )}
              </p>
            </div>
          )}
        </div>

        {/* Plan picker — shown when subscribe is selected */}
        {selected === "subscribe" && (
          <div className="mt-3 ml-7 space-y-1">
            {offering.plans.map((plan) => (
              <label
                key={plan.id}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                  selectedPlanId === plan.id
                    ? "bg-[#DCFCE7] border border-[#86EFAC]"
                    : "bg-white border border-[#C2C8D0] hover:border-[#86EFAC]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="subscription-plan"
                    value={plan.id}
                    checked={selectedPlanId === plan.id}
                    onChange={() => onPlanChange(plan.id)}
                    className="sr-only"
                  />
                  <div>
                    <p className="text-[13px] font-semibold text-[#0E1521] leading-tight">
                      {plan.name}
                    </p>
                    <p className="text-[12px] text-[#5C6675]">
                      {frequencyLabel(
                        t,
                        plan.billingFrequency,
                        plan.billingIntervalType,
                      )}
                    </p>
                  </div>
                </div>
                {plan.priceFormatted && (
                  <span className="text-[14px] font-bold text-[#18804C]">
                    {plan.priceFormatted}
                  </span>
                )}
              </label>
            ))}
          </div>
        )}
      </label>
    </div>
  );
}
