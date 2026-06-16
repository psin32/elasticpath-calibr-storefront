"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/Input/Input";
import { Button } from "@/components/ui/Button/Button";
import { AddressFields } from "./AddressFields";
import { useAuth } from "@/context/AuthContext";
import type { CheckoutFormData } from "@/hooks/use-checkout";
import type { AccountAddressResponse } from "@epcc-sdk/sdks-shopper";
import { AlertCircle, Lock, User, Mail, Building2, ChevronDown } from "lucide-react";

type Props = {
  onSubmit: (data: CheckoutFormData) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  savedAddresses?: AccountAddressResponse[];
};

export function CheckoutForm({
  onSubmit,
  isLoading,
  error,
  savedAddresses = [],
}: Props) {
  const t = useTranslations("checkout");
  const { isAuthenticated, credentials } = useAuth();

  const hasSavedAddresses = savedAddresses.length > 0;
  // "new" means manual entry; an address id means a saved address is selected
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    hasSavedAddresses ? (savedAddresses[0]!.id ?? "new") : "new"
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    defaultValues: { sameBillingAsShipping: true },
  });

  const sameBilling = watch("sameBillingAsShipping");

  // Pre-fill contact from logged-in member
  useEffect(() => {
    if (!credentials) return;
    const [first = "", ...rest] = (credentials.member_name ?? "").split(" ");
    const last = rest.join(" ");
    if (first) setValue("firstName", first);
    if (last) setValue("lastName", last);
    if (credentials.member_email) setValue("email", credentials.member_email);
  }, [credentials, setValue]);

  // Pre-fill address fields when a saved address is selected
  useEffect(() => {
    if (selectedAddressId === "new") return;
    const addr = savedAddresses.find((a) => a.id === selectedAddressId);
    if (!addr) return;
    setValue("shippingAddress.line1", addr.line_1 ?? "");
    setValue("shippingAddress.line2", addr.line_2 ?? "");
    setValue("shippingAddress.city", addr.city ?? "");
    setValue("shippingAddress.postcode", addr.postcode ?? "");
    setValue("shippingAddress.county", addr.county ?? "");
    setValue("shippingAddress.country", addr.country ?? "");
    setValue("shippingAddress.region", addr.region ?? "");
    if (addr.company_name) setValue("company", addr.company_name);
    if (addr.phone_number) setValue("phone", addr.phone_number);
  }, [selectedAddressId, savedAddresses, setValue]);

  // Clear address fields when "new address" is chosen
  useEffect(() => {
    if (selectedAddressId !== "new" || !hasSavedAddresses) return;
    setValue("shippingAddress.line1", "");
    setValue("shippingAddress.line2", "");
    setValue("shippingAddress.city", "");
    setValue("shippingAddress.postcode", "");
    setValue("shippingAddress.county", "");
    setValue("shippingAddress.country", "");
    setValue("shippingAddress.region", "");
  }, [selectedAddressId, hasSavedAddresses, setValue]);

  function addressLabel(addr: AccountAddressResponse): string {
    const parts = [addr.line_1, addr.city, addr.postcode, addr.country]
      .filter(Boolean)
      .join(", ");
    const name = [addr.first_name, addr.last_name].filter(Boolean).join(" ");
    return name ? `${name} — ${parts}` : parts;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
      {/* Contact: show details card when logged in, form when guest */}
      <Section title={isAuthenticated ? t("yourDetails") : t("contactInformation")}>
        {isAuthenticated && credentials ? (
          <div className="rounded-xl bg-gray-50 border border-gray-100 divide-y divide-gray-100">
            {credentials.member_name && (
              <div className="flex items-center gap-3 px-4 py-3">
                <User size={15} className="text-gray-400 shrink-0" />
                <span className="text-sm text-gray-800">{credentials.member_name}</span>
              </div>
            )}
            {credentials.member_email && (
              <div className="flex items-center gap-3 px-4 py-3">
                <Mail size={15} className="text-gray-400 shrink-0" />
                <span className="text-sm text-gray-800">{credentials.member_email}</span>
              </div>
            )}
            {credentials.accounts[credentials.selected]?.account_name && (
              <div className="flex items-center gap-3 px-4 py-3">
                <Building2 size={15} className="text-gray-400 shrink-0" />
                <span className="text-sm text-gray-800">
                  {credentials.accounts[credentials.selected]!.account_name}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={t("firstName")}
              placeholder={t("firstNamePlaceholder")}
              required
              error={errors.firstName?.message}
              {...register("firstName", { required: t("firstNameRequired") })}
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
      </Section>

      {/* Shipping address */}
      <Section title={t("shippingAddress")}>
        {hasSavedAddresses && (
          <div className="mb-4">
            <div className="relative">
              <select
                value={selectedAddressId}
                onChange={(e) => setSelectedAddressId(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              >
                {savedAddresses.map((addr) => (
                  <option key={addr.id} value={addr.id}>
                    {addressLabel(addr)}
                  </option>
                ))}
                <option value="new">{t("enterNewAddress")}</option>
              </select>
              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
            {selectedAddressId !== "new" && (
              <p className="mt-2 text-xs text-gray-400">{t("editAddressNote")}</p>
            )}
          </div>
        )}
        <AddressFields prefix="shippingAddress" register={register} errors={errors} />
      </Section>

      {/* Billing address */}
      <Section title={t("billingAddress")}>
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
            {...register("sameBillingAsShipping")}
          />
          <span className="text-sm text-gray-700">{t("sameBillingAsShipping")}</span>
        </label>

        {!sameBilling && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={t("firstName")}
                placeholder={t("firstNamePlaceholder")}
                {...register("billingFirstName")}
              />
              <Input
                label={t("lastName")}
                placeholder={t("lastNamePlaceholder")}
                {...register("billingLastName")}
              />
              <div className="sm:col-span-2">
                <Input
                  label={t("company")}
                  placeholder={t("companyPlaceholder")}
                  {...register("billingCompany")}
                />
              </div>
            </div>
            <AddressFields prefix="billingAddress" register={register} errors={errors} />
          </div>
        )}
      </Section>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isLoading}
        leftIcon={!isLoading ? <Lock size={16} /> : undefined}
      >
        {t("placeOrder")}
      </Button>

      <p className="text-center text-xs text-gray-400">{t("securePayment")}</p>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-2">
        {title}
      </h2>
      {children}
    </div>
  );
}
