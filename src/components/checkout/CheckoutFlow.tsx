"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import {
  Check,
  ArrowRight,
  ShoppingBag,
  CreditCard,
  FileText,
  Lock,
} from "lucide-react";
import { Elements } from "@stripe/react-stripe-js";
import type {
  StripeElementsOptions,
  StripeElementLocale,
} from "@stripe/stripe-js";
import { CheckoutUserInfo } from "./CheckoutUserInfo";
import { ShippingGroupManager } from "./ShippingGroupManager";
import { OrderSummary } from "./OrderSummary";
import { StripePaymentForm } from "./StripePaymentForm";
import { POPaymentForm } from "./POPaymentForm";
import { BillingAddressSection } from "./BillingAddressSection";
import { Input } from "@/components/ui/Input/Input";
import { Button } from "@/components/ui/Button/Button";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { type CheckoutFormData } from "@/hooks/use-checkout";
import { useEpStripePayment } from "@/hooks/use-ep-stripe-payment";
import { useEpPOPayment } from "@/hooks/use-ep-po-payment";
import { useAccountAddresses } from "@/hooks/use-account-addresses";
import { stripePromise, STRIPE_GATEWAY } from "@/lib/stripe";
import type { BillingAddr } from "@/hooks/use-ep-stripe-payment";
import type { Group } from "@/components/checkout/shipping/types";

type Step = "shipping" | "payment";

export function CheckoutFlow({ lang }: { lang: string }) {
  const t = useTranslations("checkout");
  const {
    items,
    cartTotal,
    cartTotalAmount,
    cartShipping,
    cartShippingAmount,
    isInitializing,
  } = useCart();
  const { addresses, addAddress } = useAccountAddresses();
  const { processPayment, isLoading, isRedirecting, error } =
    useEpStripePayment(lang, addresses);
  const {
    processPayment: processPOPayment,
    isLoading: isPOLoading,
    isRedirecting: isPORedirecting,
    error: poError,
  } = useEpPOPayment(lang, addresses);
  const { isAuthenticated, credentials } = useAuth();

  const stripeFormRef = useRef<HTMLFormElement>(null);
  const poFormRef = useRef<HTMLFormElement>(null);

  const [step, setStep] = useState<Step>("shipping");
  const [shippingReady, setShippingReady] = useState(false);
  const [shippingLoading, setShippingLoading] = useState(true);
  const [savedFormData, setSavedFormData] = useState<CheckoutFormData | null>(
    null,
  );
  const [shippingGroups, setShippingGroups] = useState<Group[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "po">("card");
  // undefined = not yet initialized; null = "same as shipping" (valid); BillingAddr = explicit address
  const [billingAddress, setBillingAddress] = useState<
    BillingAddr | null | undefined
  >(undefined);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [isStripeConfirming, setIsStripeConfirming] = useState(false);

  const isPlacingOrder = isLoading || isPOLoading || isStripeConfirming;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>();

  useEffect(() => {
    if (!credentials) return;
    const [first = "", ...rest] = (credentials.member_name ?? "").split(" ");
    const last = rest.join(" ");
    if (first) setValue("firstName", first);
    if (last) setValue("lastName", last);
    if (credentials.member_email) setValue("email", credentials.member_email);
  }, [credentials, setValue]);

  const aggregatedItems = Object.values(
    items.reduce<Record<string, (typeof items)[0]>>((acc, item) => {
      if (acc[item.productId]) {
        const existing = acc[item.productId];
        const totalQty = existing.quantity + item.quantity;
        const totalCents = existing.unitPriceAmount * totalQty;
        acc[item.productId] = {
          ...existing,
          quantity: totalQty,
          lineTotalFormatted: new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: existing.currency,
          }).format(totalCents / 100),
        };
      } else {
        acc[item.productId] = { ...item };
      }
      return acc;
    }, {}),
  );

  // Deferred intent mode: Elements collects card details without a PaymentIntent upfront.
  // EP's paymentSetup creates the PaymentIntent when the order is placed.
  const stripeElementsOptions = useMemo<StripeElementsOptions>(
    () => ({
      mode: "payment",
      locale: lang as StripeElementLocale,
      currency: (items[0]?.currency ?? "USD").toLowerCase(),
      amount: Math.max(100, cartTotalAmount + cartShippingAmount),
      capture_method: "automatic",
      paymentMethodCreation: "manual",
      appearance: {
        theme: "stripe",
        variables: {
          colorPrimary: process.env.NEXT_PUBLIC_COLOR_INK_900 ?? "#0e1521",
          borderRadius: "8px",
        },
      },
    }),
    // Only recalculate when step changes to payment (amount is locked at that point)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step],
  );

  const STEPS: Array<{ key: Step; num: string; label: string }> = [
    { key: "shipping", num: "1", label: t("stepShipping") },
    { key: "payment", num: "2", label: t("stepPayment") },
  ];

  function Stepper() {
    return (
      <div className="flex items-center justify-center">
        {STEPS.map((st, i) => {
          const isPast = st.key === "shipping" && step === "payment";
          const isActive = st.key === step;
          const isLast = i === STEPS.length - 1;
          return (
            <div key={st.key} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={[
                    "w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                    isPast
                      ? "bg-success-400 text-ink-900"
                      : isActive
                        ? "bg-ink-900 text-white ring-2 ring-offset-2 ring-success-400"
                        : "bg-ink-200 text-ink-600",
                  ].join(" ")}
                >
                  {isPast ? <Check size={14} /> : st.num}
                </span>
                <span
                  className={[
                    "text-sm font-medium",
                    isActive
                      ? "text-ink-900"
                      : isPast
                        ? "text-success-400"
                        : "text-ink-400",
                  ].join(" ")}
                >
                  {st.label}
                </span>
              </div>
              {!isLast && (
                <span
                  className={[
                    "w-10 h-px mx-1",
                    isPast ? "bg-success-400" : "bg-ink-200",
                  ].join(" ")}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  const pageHeader = (
    <header className="flex-none border-b border-gray-100 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 grid grid-cols-3 items-center">
        <div className="flex items-center">
          <Link
            href={`/${lang}`}
            aria-label={t("returnToStore")}
            className="flex items-center gap-2"
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect
                width="32"
                height="32"
                rx="6"
                fill="var(--color-brand-primary)"
              />
              <path
                d="M8 10h16M8 16h10M8 22h13"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-lg font-bold tracking-tight text-gray-900">
              Calibr
            </span>
          </Link>
        </div>
        <div className="flex justify-center">
          <Stepper />
        </div>
        <div className="flex items-center justify-end">
          <CheckoutUserInfo />
        </div>
      </div>
    </header>
  );

  if (
    !isInitializing &&
    !shippingLoading &&
    !isRedirecting &&
    !isPORedirecting &&
    items.length === 0
  ) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {pageHeader}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-6">
            <ShoppingBag size={28} className="text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t("emptyCart")}
          </h1>
          <p className="text-gray-500 mb-8">{t("emptyCartSubtitle")}</p>
          <Link
            href={`/${lang}`}
            className="inline-flex items-center px-6 py-3 rounded-lg bg-brand-primary text-white font-medium text-sm hover:opacity-90 transition-opacity"
          >
            {t("continueShopping")}
          </Link>
        </main>
      </div>
    );
  }

  function handleContinueToPayment(data: CheckoutFormData) {
    setSavedFormData(data);
    setBillingAddress(undefined);
    setBillingError(null);
    setStep("payment");
  }

  function handlePlaceOrder() {
    if (billingAddress === undefined) {
      setBillingError(t("billingRequired"));
      return;
    }
    setBillingError(null);
    if (paymentMethod === "card") stripeFormRef.current?.requestSubmit();
    else poFormRef.current?.requestSubmit();
  }

  const orderSummaryPanel = (
    <div className="lg:sticky lg:top-8">
      <OrderSummary
        items={aggregatedItems}
        cartTotal={cartTotal}
        cartTotalAmount={cartTotalAmount}
        cartShipping={cartShipping}
        cartShippingAmount={cartShippingAmount}
      />
    </div>
  );

  const step1 = (
    <form onSubmit={handleSubmit(handleContinueToPayment)} noValidate>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          <div className="lg:col-span-2 space-y-8">
            {!isAuthenticated && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label={t("firstName")}
                  placeholder={t("firstNamePlaceholder")}
                  required
                  error={errors.firstName?.message}
                  {...register("firstName", {
                    required: t("firstNameRequired"),
                  })}
                />
                <Input
                  label={t("lastName")}
                  placeholder={t("lastNamePlaceholder")}
                  required
                  error={errors.lastName?.message}
                  {...register("lastName", { required: t("lastNameRequired") })}
                />
                <div className="sm:col-span-2">
                  <Input
                    label={t("emailAddress")}
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    required
                    error={errors.email?.message}
                    {...register("email", {
                      required: t("emailRequired"),
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: t("emailInvalid"),
                      },
                    })}
                  />
                </div>
                <Input
                  label={t("phone")}
                  type="tel"
                  placeholder={t("phonePlaceholder")}
                  {...register("phone")}
                />
                <Input
                  label={t("company")}
                  placeholder={t("companyPlaceholder")}
                  {...register("company")}
                />
              </div>
            )}

            <ShippingGroupManager
              onReadyChange={setShippingReady}
              onLoadingChange={setShippingLoading}
              onGroupsChange={setShippingGroups}
            />

            {shippingLoading ? (
              <div className="animate-pulse bg-gray-200 rounded-lg h-12 w-full" />
            ) : (
              <>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={!shippingReady}
                  rightIcon={<ArrowRight size={16} />}
                >
                  {t("continueToPayment")}
                </Button>

                {!shippingReady && (
                  <p className="text-center text-xs text-amber-600">
                    {t("shippingNotReady")}
                  </p>
                )}
              </>
            )}
          </div>

          {orderSummaryPanel}
        </div>
      </main>
    </form>
  );

  const step2 = (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        <div className="lg:col-span-2 space-y-5">
          {/* Shipping summary — compact flat row */}
          <div className="flex items-center justify-between pb-5 border-b border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-5 h-5 rounded-full bg-success-400 flex items-center justify-center flex-none">
                <Check size={12} className="text-ink-900" strokeWidth={3} />
              </span>
              <span className="font-medium text-gray-800">
                {t("reviewShipping")}
              </span>
              {savedFormData && !isAuthenticated && (
                <span className="text-gray-400 mx-1">·</span>
              )}
              {savedFormData && !isAuthenticated && (
                <span>
                  {savedFormData.firstName} {savedFormData.lastName} ·{" "}
                  {savedFormData.email}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setStep("shipping")}
              className="text-sm text-brand-primary hover:underline flex-none"
            >
              {t("backToShipping")}
            </button>
          </div>

          {/* Billing address card */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              {t("billingAddress")}
            </h2>
            <BillingAddressSection
              addresses={addresses}
              hasShippingGroups={shippingGroups.length > 0}
              addAddress={addAddress}
              onAddressChange={(addr) => {
                setBillingAddress(addr);
                setBillingError(null);
              }}
              error={billingError}
            />
          </div>

          {/* Payment method accordion card */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                {t("paymentMethod")}
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {/* Card */}
              <div>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${paymentMethod === "card" ? "border-brand-primary" : "border-gray-300"}`}
                  >
                    {paymentMethod === "card" && (
                      <span className="w-2 h-2 rounded-full bg-brand-primary" />
                    )}
                  </span>
                  <CreditCard
                    size={16}
                    className={
                      paymentMethod === "card"
                        ? "text-brand-primary"
                        : "text-gray-400"
                    }
                  />
                  <span
                    className={`text-sm font-medium ${paymentMethod === "card" ? "text-gray-900" : "text-gray-500"}`}
                  >
                    {t("payCard")}
                  </span>
                </button>
                {paymentMethod === "card" && (
                  <div className="px-5 pb-5">
                    <Elements
                      stripe={stripePromise}
                      options={stripeElementsOptions}
                    >
                      <StripePaymentForm
                        onPayment={(stripe, elements) =>
                          processPayment(
                            savedFormData!,
                            stripe,
                            elements,
                            billingAddress ?? null,
                          )
                        }
                        isProcessing={isLoading}
                        externalError={error}
                        formRef={stripeFormRef}
                        onConfirmingChange={setIsStripeConfirming}
                        email={
                          credentials?.member_email ??
                          savedFormData?.email ??
                          ""
                        }
                      />
                    </Elements>
                  </div>
                )}
              </div>

              {/* Purchase Order */}
              <div>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("po")}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${paymentMethod === "po" ? "border-brand-primary" : "border-gray-300"}`}
                  >
                    {paymentMethod === "po" && (
                      <span className="w-2 h-2 rounded-full bg-brand-primary" />
                    )}
                  </span>
                  <FileText
                    size={16}
                    className={
                      paymentMethod === "po"
                        ? "text-brand-primary"
                        : "text-gray-400"
                    }
                  />
                  <span
                    className={`text-sm font-medium ${paymentMethod === "po" ? "text-gray-900" : "text-gray-500"}`}
                  >
                    {t("payPO")}
                  </span>
                </button>
                {paymentMethod === "po" && (
                  <div className="px-5 pb-5">
                    <POPaymentForm
                      onSubmit={(poNumber) =>
                        processPOPayment(
                          savedFormData!,
                          poNumber,
                          billingAddress ?? null,
                        )
                      }
                      isProcessing={isPOLoading}
                      externalError={poError}
                      formRef={poFormRef}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Place Order — below both cards */}
          <div className="space-y-3 pt-1">
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              onClick={handlePlaceOrder}
              isLoading={isPlacingOrder}
              disabled={isPlacingOrder}
              leftIcon={!isPlacingOrder ? <Lock size={16} /> : undefined}
            >
              {isPlacingOrder ? t("placingOrder") : t("placeOrder")}
            </Button>
            <p className="text-center text-xs text-gray-400">
              {t("securePayment")}
            </p>
          </div>
        </div>

        {orderSummaryPanel}
      </div>
    </main>
  );

  const pulse = "animate-pulse bg-gray-200 rounded-lg";
  const checkoutSkeleton = (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <div className={`${pulse} h-11`} />
            <div className={`${pulse} h-11`} />
            <div className={`${pulse} h-11 col-span-2`} />
            <div className={`${pulse} h-11`} />
            <div className={`${pulse} h-11`} />
          </div>
          <div className="space-y-3">
            <div className={`${pulse} h-4 w-2/5`} />
            <div className={`${pulse} h-24 w-full`} />
            <div className={`${pulse} h-24 w-full`} />
          </div>
          <div className={`${pulse} h-12 w-full`} />
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className={`${pulse} h-4 w-1/2`} />
          </div>
          {[0, 1].map((i) => (
            <div
              key={i}
              className="flex gap-4 px-6 py-4 border-b border-gray-100"
            >
              <div className={`${pulse} w-16 h-16 shrink-0`} />
              <div className="flex-1 space-y-2 py-1">
                <div className={`${pulse} h-3.5 w-4/5`} />
                <div className={`${pulse} h-3 w-2/5`} />
                <div className={`${pulse} h-3 w-1/4`} />
              </div>
            </div>
          ))}
          <div className="px-6 py-4 space-y-3">
            <div className="flex justify-between gap-4">
              <div className={`${pulse} h-3.5 w-1/4`} />
              <div className={`${pulse} h-3.5 w-1/5`} />
            </div>
            <div className="flex justify-between gap-4">
              <div className={`${pulse} h-3.5 w-1/5`} />
              <div className={`${pulse} h-3.5 w-1/6`} />
            </div>
            <div className="flex justify-between gap-4 pt-3 border-t border-gray-100">
              <div className={`${pulse} h-4 w-1/6`} />
              <div className={`${pulse} h-4 w-1/4`} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {pageHeader}
      {(isInitializing || shippingLoading) && checkoutSkeleton}
      {/* Always in DOM once cart is ready so ShippingGroupManager can pre-fetch under the skeleton */}
      {!isInitializing && (
        <div className={shippingLoading ? "hidden" : undefined}>
          {step === "shipping" ? step1 : step2}
        </div>
      )}
    </div>
  );
}
