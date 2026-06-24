"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type CartMode = "drawer" | "full";
export type ShoppingMode = "b2c" | "b2b";

export const COOKIE_CART_MODE = "ep_cart_mode";
export const COOKIE_SHOPPING_MODE = "ep_shopping_mode";

export const DEFAULT_CART_MODE: CartMode =
  (process.env.NEXT_PUBLIC_DEFAULT_CART_MODE as CartMode | undefined) ?? "drawer";
export const DEFAULT_SHOPPING_MODE: ShoppingMode =
  (process.env.NEXT_PUBLIC_DEFAULT_SHOPPING_MODE as ShoppingMode | undefined) ?? "b2c";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : null;
}

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`;
}

type PreferencesValue = {
  cartMode: CartMode;
  shoppingMode: ShoppingMode;
  setCartMode: (mode: CartMode) => void;
  setShoppingMode: (mode: ShoppingMode) => void;
};

const PreferencesContext = createContext<PreferencesValue>({
  cartMode: DEFAULT_CART_MODE,
  shoppingMode: DEFAULT_SHOPPING_MODE,
  setCartMode: () => {},
  setShoppingMode: () => {},
});

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [cartMode, setCartModeState] = useState<CartMode>(DEFAULT_CART_MODE);
  const [shoppingMode, setShoppingModeState] = useState<ShoppingMode>(DEFAULT_SHOPPING_MODE);

  // Hydrate from cookies after mount
  useEffect(() => {
    const cm = readCookie(COOKIE_CART_MODE) as CartMode | null;
    const sm = readCookie(COOKIE_SHOPPING_MODE) as ShoppingMode | null;
    if (cm) setCartModeState(cm);
    if (sm) setShoppingModeState(sm);
  }, []);

  const setCartMode = (mode: CartMode) => {
    writeCookie(COOKIE_CART_MODE, mode);
    setCartModeState(mode);
  };

  const setShoppingMode = (mode: ShoppingMode) => {
    writeCookie(COOKIE_SHOPPING_MODE, mode);
    setShoppingModeState(mode);
  };

  return (
    <PreferencesContext.Provider value={{ cartMode, shoppingMode, setCartMode, setShoppingMode }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesValue {
  return useContext(PreferencesContext);
}
