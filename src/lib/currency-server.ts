import { cookies } from "next/headers";
import {
  CURRENCY_COOKIE_KEY,
  DEFAULT_CURRENCY,
  isSupportedCurrency,
} from "./currency";

/**
 * Reads the shopper's selected currency from the request cookie.
 * Falls back to the default outside a request context (e.g. build time).
 */
export async function getServerCurrency(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const value = cookieStore.get(CURRENCY_COOKIE_KEY)?.value;
    if (isSupportedCurrency(value)) return value.toUpperCase();
  } catch {
    // Outside request context — no cookie available
  }
  return DEFAULT_CURRENCY;
}
