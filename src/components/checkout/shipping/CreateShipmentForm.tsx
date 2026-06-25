"use client";

import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Package } from "lucide-react";
import { toCurrency } from "./helpers";
import type { Address, CartItem, ShippingMethod } from "./types";
import type { AccountAddressResponse } from "@epcc-sdk/sdks-shopper";

type Props = {
  addresses: AccountAddressResponse[];
  methodList: [string, ShippingMethod][];
  shippingMethods: Record<string, ShippingMethod>;
  unassigned: CartItem[];
  pickedItems: string[];
  creating: boolean;
  formAddressId: string;
  formInlineAddr: Partial<Address>;
  formMethodKey: string;
  formEstimateEnd: string;
  formAddress: Address | null;
  today: string;
  setFormAddressId: (v: string) => void;
  setFormInlineAddr: (fn: (prev: Partial<Address>) => Partial<Address>) => void;
  setFormMethodKey: (v: string) => void;
  setFormEstimateEnd: (v: string) => void;
  setPickedItems: (fn: (prev: string[]) => string[]) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

const ADDR_FIELDS: (keyof Address)[] = [
  "first_name", "last_name", "line_1", "city", "postcode", "country",
];

export function CreateShipmentForm({
  addresses, methodList, shippingMethods, unassigned,
  pickedItems, creating, formAddressId, formInlineAddr,
  formMethodKey, formEstimateEnd, formAddress, today,
  setFormAddressId, setFormInlineAddr, setFormMethodKey,
  setFormEstimateEnd, setPickedItems, onSubmit, onCancel,
}: Props) {
  const t = useTranslations("shipping");

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-5 shadow-sm">
      <p className="text-sm font-bold text-gray-900">{t("newShipment")}</p>

      {/* Address */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          {t("deliveryAddress")}
        </p>
        {addresses.length > 0 && (
          <div className="relative">
            <select
              value={formAddressId}
              onChange={(e) => setFormAddressId(e.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              {addresses.map((a) => (
                <option key={a.id} value={a.id ?? ""}>
                  {[a.first_name, a.last_name].filter(Boolean).join(" ")} —{" "}
                  {[a.line_1, a.city].filter(Boolean).join(", ")}
                </option>
              ))}
              <option value="new">{t("enterNewAddress")}</option>
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
        )}
        {(formAddressId === "new" || addresses.length === 0) && (
          <div className="grid grid-cols-2 gap-2">
            {ADDR_FIELDS.map((f) => (
              <Input
                key={f}
                type="text"
                placeholder={t(`addr_${f}` as any)}
                value={(formInlineAddr[f] as string | undefined) ?? ""}
                onChange={(e) =>
                  setFormInlineAddr((p) => ({ ...p, [f]: e.target.value }))
                }
                wrapperClassName={
                  f === "line_1" || f === "city" ? "col-span-2" : undefined
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Shipping method */}
      {methodList.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            {t("methodSection")}
          </p>
          <div className="flex gap-2.5 flex-wrap">
            {methodList.map(([key, m]) => {
              const sel = formMethodKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormMethodKey(key)}
                  className={`flex-1 min-w-[140px] text-left p-3 rounded-xl border-[1.5px] flex flex-col gap-1.5 transition-all ${
                    sel
                      ? "border-brand-primary bg-green-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-gray-900">{m.shipping_method}</span>
                    <span
                      className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0 ${
                        sel ? "border-brand-primary bg-brand-primary" : "border-gray-300"
                      }`}
                    >
                      {sel && (
                        <svg
                          width="8" height="8" viewBox="0 0 24 24"
                          fill="none" stroke="#fff" strokeWidth="3.5"
                          strokeLinecap="round" strokeLinejoin="round"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {m.delivery_estimate.start}–{m.delivery_estimate.end}{" "}
                    {m.delivery_estimate.unit}
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      m.shipping_cost === 0 ? "text-green-600" : "text-gray-900"
                    }`}
                  >
                    {m.shipping_cost === 0
                      ? t("included")
                      : toCurrency(m.shipping_cost, m.currency)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Shipment date */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          {t("shipmentDate")}
        </p>
        <Input
          type="date"
          value={formEstimateEnd}
          min={today}
          onChange={(e) => setFormEstimateEnd(e.target.value)}
        />
      </div>

      {/* Items to assign */}
      {unassigned.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            {t("itemsToAssign")}
            {pickedItems.length > 0 && (
              <span className="ml-2 normal-case text-brand-primary">
                {t("selectedCount", { count: pickedItems.length })}
              </span>
            )}
          </p>
          <div className="rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
            {unassigned.map((item) => {
              const checked = pickedItems.includes(item.id ?? "");
              return (
                <label
                  key={item.id}
                  className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors ${
                    checked ? "bg-green-50" : "hover:bg-gray-50"
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    onChange={(e) => {
                      const id = item.id ?? "";
                      setPickedItems((p) =>
                        e.target.checked ? [...p, id] : p.filter((x) => x !== id),
                      );
                    }}
                  />
                  <span className="w-10 h-10 rounded-lg border border-gray-100 bg-white flex items-center justify-center flex-shrink-0">
                    <Package size={16} className="text-gray-300" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-gray-900 truncate">
                      {item.name}
                    </span>
                    {item.sku && (
                      <span className="block text-xs text-gray-400 font-mono mt-0.5">
                        {item.sku}
                      </span>
                    )}
                  </span>
                  <span className="text-sm text-gray-500 flex-shrink-0">
                    {t("qty", { qty: item.quantity ?? 0 })}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-2 pt-1">
        <div className="flex gap-2">
          <Button
            fullWidth
            onClick={onSubmit}
            isLoading={creating}
            disabled={creating || !formAddress || pickedItems.length === 0 || !formEstimateEnd}
          >
            {t("createShipment")}
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
          >
            {t("cancel")}
          </Button>
        </div>
        {!formAddress && (
          <p className="text-xs text-amber-600 text-center">{t("fillAddress")}</p>
        )}
        {formAddress && pickedItems.length === 0 && (
          <p className="text-xs text-amber-600 text-center">{t("selectItems")}</p>
        )}
        {formAddress && pickedItems.length > 0 && !formEstimateEnd && (
          <p className="text-xs text-amber-600 text-center">{t("selectDate")}</p>
        )}
      </div>
    </div>
  );
}
