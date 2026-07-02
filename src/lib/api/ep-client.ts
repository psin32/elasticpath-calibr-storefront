import { configureClient } from "@epcc-sdk/sdks-shopper";
import type { Client } from "@hey-api/client-fetch";
import { AM_CREDENTIALS_STORAGE_KEY } from "@/context/AuthContext";
import type { AccountMemberCredentials } from "./auth";
import { getSelectedCurrency } from "@/lib/currency";

function injectDynamicHeaders(client: Client): void {
  client.interceptors.request.use((request) => {
    // Read per request so long-lived clients (e.g. CartContext) pick up
    // currency changes without a page reload.
    request.headers.set("X-MOLTIN-CURRENCY", getSelectedCurrency());
    try {
      const stored = localStorage.getItem(AM_CREDENTIALS_STORAGE_KEY);
      if (stored) {
        const creds: AccountMemberCredentials = JSON.parse(stored);
        const account = creds.accounts[creds.selected];
        if (
          account &&
          Date.now() < new Date(account.expires).getTime() - 60_000
        ) {
          request.headers.set(
            "EP-Account-Management-Authentication-Token",
            account.token,
          );
        }
      }
    } catch {}
    return request;
  });
}

const MULTI_LOCATION =
  process.env.NEXT_PUBLIC_EP_INVENTORIES_MULTI_LOCATION === "true";

export function createEpClient(extraHeaders?: Record<string, string>): Client {
  const { client } = configureClient(
    {
      baseUrl: `https://${process.env.NEXT_PUBLIC_EPCC_ENDPOINT_URL}`,
      headers: {
        "X-MOLTIN-CURRENCY": getSelectedCurrency(),
        ...(MULTI_LOCATION ? { "EP-Inventories-Multi-Location": "true" } : {}),
        ...extraHeaders,
      },
    },
    {
      clientId: process.env.NEXT_PUBLIC_EPCC_CLIENT_ID!,
      storage: "localStorage",
    },
  );
  injectDynamicHeaders(client);
  return client;
}
