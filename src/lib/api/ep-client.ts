import { configureClient } from "@epcc-sdk/sdks-shopper";
import type { Client } from "@hey-api/client-fetch";
import { AM_CREDENTIALS_STORAGE_KEY } from "@/context/AuthContext";
import type { AccountMemberCredentials } from "./auth";
import { EP_CURRENCY_CODE } from "@/lib/currency";

function injectAmToken(client: Client): void {
  client.interceptors.request.use((request) => {
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

export function createEpClient(extraHeaders?: Record<string, string>): Client {
  const { client } = configureClient(
    {
      baseUrl: `https://${process.env.NEXT_PUBLIC_EPCC_ENDPOINT_URL}`,
      headers: { "X-MOLTIN-CURRENCY": EP_CURRENCY_CODE, ...extraHeaders },
    },
    {
      clientId: process.env.NEXT_PUBLIC_EPCC_CLIENT_ID!,
      storage: "localStorage",
    },
  );
  injectAmToken(client);
  return client;
}
