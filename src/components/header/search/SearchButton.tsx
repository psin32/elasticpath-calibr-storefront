"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";

export function SearchButton() {
  const t = useTranslations("header");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label={t("search")}
        className="flex items-center justify-center w-9 h-9 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
      >
        <Search size={20} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-40 animate-fade-in"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Search modal */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("search")}
            className="fixed top-0 inset-x-0 z-50 p-4 sm:p-6 animate-fade-in"
          >
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Search input */}
              <div className="flex items-center px-4 py-3 border-b border-gray-100">
                <Search size={18} className="text-gray-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="search"
                  placeholder={t("searchPlaceholder")}
                  className="flex-1 ml-3 text-base bg-transparent outline-none placeholder:text-gray-400"
                />
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label={t("closeMenu")}
                  className="ml-2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Empty state — replaced by real search results */}
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                Start typing to search products...
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
