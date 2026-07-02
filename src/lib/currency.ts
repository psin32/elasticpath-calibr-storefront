import { getCookie, setCookie } from "cookies-next";

export const CURRENCY_COOKIE_KEY = "_store_ep_currency";

/**
 * NEXT_PUBLIC_DEFAULT_CURRENCY sets the preselected currency;
 * NEXT_PUBLIC_CURRENCIES (comma-separated, e.g. "GBP,USD,CAD")
 * drives the header dropdown. Leave NEXT_PUBLIC_CURRENCIES unset
 * for a single-currency store with no dropdown.
 */
function parseCurrencyConfig(): { defaultCurrency: string; list: string[] } {
  const defaultCurrency = (
    process.env.NEXT_PUBLIC_DEFAULT_CURRENCY?.trim() || "USD"
  ).toUpperCase();
  const list = (process.env.NEXT_PUBLIC_CURRENCIES ?? "")
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);
  if (!list.includes(defaultCurrency)) {
    list.unshift(defaultCurrency);
  }
  return { defaultCurrency, list };
}

const currencyConfig = parseCurrencyConfig();

export const DEFAULT_CURRENCY = currencyConfig.defaultCurrency;
export const AVAILABLE_CURRENCIES = currencyConfig.list;

export function isSupportedCurrency(code: string | undefined): code is string {
  return !!code && AVAILABLE_CURRENCIES.includes(code.toUpperCase());
}

/**
 * The shopper's selected currency. On the server this returns the
 * default — server code must read the cookie per request instead
 * (see currency-server.ts).
 */
export function getSelectedCurrency(): string {
  if (typeof window === "undefined") return DEFAULT_CURRENCY;
  const cookieValue = getCookie(CURRENCY_COOKIE_KEY);
  return typeof cookieValue === "string" && isSupportedCurrency(cookieValue)
    ? cookieValue.toUpperCase()
    : DEFAULT_CURRENCY;
}

export function setSelectedCurrency(code: string): void {
  setCookie(CURRENCY_COOKIE_KEY, code.toUpperCase(), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

/**
 * Snapshot of the selected currency at module load. Safe on the
 * client because a full page reload follows every currency change;
 * on the server it is always the default — prefer getServerCurrency().
 */
export const EP_CURRENCY_CODE = getSelectedCurrency();
