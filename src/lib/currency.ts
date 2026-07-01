import { getCookie, setCookie } from "cookies-next";

export const CURRENCY_COOKIE_KEY = "_store_ep_currency";

export const EP_CURRENCY_CODE = retrieveCurrency();

function retrieveCurrency(): string {
  const defaultCurrency = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "USD";

  // Server-side: no browser cookie context available at module level
  if (typeof window === "undefined") {
    return defaultCurrency;
  }

  const currencyInCookie = getCookie(CURRENCY_COOKIE_KEY);

  if (typeof currencyInCookie !== "string") {
    setCookie(CURRENCY_COOKIE_KEY, defaultCurrency);
  }

  return (
    (typeof currencyInCookie === "string" ? currencyInCookie : defaultCurrency) ||
    "USD"
  );
}
