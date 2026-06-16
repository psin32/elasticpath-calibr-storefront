"use client";

import { MapPin, Check, PlusCircle } from "lucide-react";
import type { AccountAddressResponse } from "@epcc-sdk/sdks-shopper";

type Props = {
  addresses: AccountAddressResponse[];
  selectedId: string | null;
  onSelect: (address: AccountAddressResponse) => void;
  onUseNew: () => void;
};

export function AddressSelector({
  addresses,
  selectedId,
  onSelect,
  onUseNew,
}: Props) {
  return (
    <div className="space-y-2">
      {addresses.map((addr) => {
        const isSelected = selectedId === addr.id;
        const name = [addr.first_name, addr.last_name].filter(Boolean).join(" ");
        const line2parts = [addr.city, addr.postcode, addr.country]
          .filter(Boolean)
          .join(", ");

        return (
          <button
            key={addr.id}
            type="button"
            onClick={() => onSelect(addr)}
            className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors flex items-start gap-3 ${
              isSelected
                ? "border-brand-primary bg-brand-primary/5"
                : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
          >
            <MapPin
              size={16}
              className={`mt-0.5 shrink-0 ${isSelected ? "text-brand-primary" : "text-gray-400"}`}
            />
            <div className="flex-1 min-w-0">
              {name && (
                <p className="text-sm font-medium text-gray-900">{name}</p>
              )}
              {addr.company_name && (
                <p className="text-xs text-gray-500">{addr.company_name}</p>
              )}
              <p className="text-sm text-gray-700">{addr.line_1}</p>
              {addr.line_2 && (
                <p className="text-sm text-gray-500">{addr.line_2}</p>
              )}
              <p className="text-sm text-gray-500">{line2parts}</p>
            </div>
            {isSelected && (
              <Check size={16} className="text-brand-primary shrink-0 mt-0.5" />
            )}
          </button>
        );
      })}

      {/* Enter new address option */}
      <button
        type="button"
        onClick={onUseNew}
        className={`w-full text-left px-4 py-3 rounded-xl border-2 border-dashed transition-colors flex items-center gap-3 ${
          selectedId === null
            ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
            : "border-gray-200 hover:border-gray-300 text-gray-500"
        }`}
      >
        <PlusCircle size={16} className="shrink-0" />
        <span className="text-sm font-medium">Enter a new address</span>
        {selectedId === null && (
          <Check size={16} className="text-brand-primary ml-auto shrink-0" />
        )}
      </button>
    </div>
  );
}
