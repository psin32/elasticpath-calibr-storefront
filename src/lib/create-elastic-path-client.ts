import { createClient } from "@epcc-sdk/sdks-shopper";
import { cookies } from "next/headers";
import { EP_CURRENCY_CODE } from "./currency";

let _cachedToken: { access_token: string; expires: number } | null = null;
let _tokenFetchPromise: Promise<{
  access_token: string;
  expires: number;
}> | null = null;

async function getImplicitToken(): Promise<{
  access_token: string;
  expires: number;
}> {
  if (_cachedToken && Date.now() / 1000 < _cachedToken.expires - 60) {
    return _cachedToken;
  }

  // Deduplicate concurrent fetches
  if (_tokenFetchPromise) return _tokenFetchPromise;

  _tokenFetchPromise = fetch(
    `https://${process.env.NEXT_PUBLIC_EPCC_ENDPOINT_URL}/oauth/access_token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-MOLTIN-CURRENCY": EP_CURRENCY_CODE,
      },
      body: `grant_type=implicit&client_id=${process.env.NEXT_PUBLIC_EPCC_CLIENT_ID}`,
      cache: "no-store",
    },
  )
    .then((res) => res.json())
    .then((token) => {
      _cachedToken = token;
      _tokenFetchPromise = null;
      return token as { access_token: string; expires: number };
    })
    .catch((err) => {
      _tokenFetchPromise = null;
      throw err;
    });

  return _tokenFetchPromise;
}

export async function createElasticPathClient() {
  let amToken: string | undefined;
  try {
    const cookieStore = await cookies();
    amToken = cookieStore.get("ep_am_token")?.value;
  } catch {
    // Outside request context (e.g. build time) — no cookie available
  }

  const client = createClient({
    baseUrl: `https://${process.env.NEXT_PUBLIC_EPCC_ENDPOINT_URL}`,
    headers: { "X-MOLTIN-CURRENCY": EP_CURRENCY_CODE },
  });

  client.interceptors.request.use(async (request) => {
    const token = await getImplicitToken();
    if (token?.access_token) {
      request.headers.set("Authorization", `Bearer ${token.access_token}`);
    }
    if (process.env.NEXT_PUBLIC_EP_INVENTORIES_MULTI_LOCATION === "true") {
      request.headers.set("EP-Inventories-Multi-Location", "true");
    }
    if (amToken) {
      request.headers.set(
        "EP-Account-Management-Authentication-Token",
        amToken,
      );
    }
    return request;
  });

  return client;
}

export type ElasticPathClient = ReturnType<typeof createElasticPathClient>;
