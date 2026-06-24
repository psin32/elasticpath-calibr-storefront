"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Settings, X, Check } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  usePreferences,
  type CartMode,
  type ShoppingMode,
} from "@/context/PreferencesContext";

type OptionItem = { value: string; label: string; desc: string };

function RadioOption({
  option,
  selected,
  onSelect,
}: {
  option: OptionItem;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={[
        "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
        selected
          ? "border-brand-primary bg-brand-primary/5"
          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
      ].join(" ")}
    >
      <span
        className={[
          "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-none transition-colors",
          selected ? "border-brand-primary bg-brand-primary" : "border-gray-300",
        ].join(" ")}
      >
        {selected && <Check size={10} className="text-white" strokeWidth={3} />}
      </span>
      <div>
        <p className="text-sm font-medium text-gray-900">{option.label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{option.desc}</p>
      </div>
    </button>
  );
}

export function SettingsButton() {
  const { cartMode, shoppingMode, setCartMode, setShoppingMode } = usePreferences();
  const pathname = usePathname();
  const lang = pathname.split("/")[1] ?? "en";

  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cartModeOptions: OptionItem[] = [
    { value: "drawer", label: "Drawer", desc: "Slide-in cart panel" },
    { value: "full", label: "Full Page", desc: `Dedicated cart page (/${lang}/cart)` },
  ];

  const shoppingModeOptions: OptionItem[] = [
    { value: "b2c", label: "B2C", desc: "Consumer shopping experience" },
    { value: "b2b", label: "B2B", desc: "Business ordering with bulk tools" },
  ];

  const drawer = isOpen && (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[9998] animate-fade-in"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Preferences"
        className="fixed top-0 right-0 h-screen w-[320px] bg-white shadow-2xl z-[9999] flex flex-col animate-slide-in-right"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <Settings size={17} className="text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900">Preferences</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close preferences"
            className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Settings */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* Cart Mode */}
          <section>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Cart Mode
            </p>
            <div className="space-y-2">
              {cartModeOptions.map((opt) => (
                <RadioOption
                  key={opt.value}
                  option={opt}
                  selected={cartMode === opt.value}
                  onSelect={() => setCartMode(opt.value as CartMode)}
                />
              ))}
            </div>
          </section>

          {/* Shopping Mode */}
          <section>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Shopping Mode
            </p>
            <div className="space-y-2">
              {shoppingModeOptions.map((opt) => (
                <RadioOption
                  key={opt.value}
                  option={opt}
                  selected={shoppingMode === opt.value}
                  onSelect={() => setShoppingMode(opt.value as ShoppingMode)}
                />
              ))}
            </div>
          </section>
        </div>

        {/* Footer hint */}
        <div className="shrink-0 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
          <p className="text-xs text-gray-400 text-center">
            Changes apply immediately and persist across sessions.
          </p>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open preferences"
        className="relative flex items-center justify-center w-9 h-9 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
      >
        <Settings size={18} />
      </button>

      {mounted && createPortal(drawer, document.body)}
    </>
  );
}
