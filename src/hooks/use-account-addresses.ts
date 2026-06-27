"use client";

import { useState, useEffect } from "react";
import {
  getV2AccountAddresses,
  postV2AccountAddress,
  type AccountAddressResponse,
} from "@epcc-sdk/sdks-shopper";
import { useAuth } from "@/context/AuthContext";
import { createEpClient } from "@/lib/api/ep-client";

export type NewAddressFields = {
  first_name: string;
  last_name: string;
  line_1: string;
  line_2?: string;
  city: string;
  county: string;
  postcode: string;
  country: string;
  company_name?: string;
};

export function useAccountAddresses() {
  const { selectedAccount, isAuthenticated } = useAuth();
  const [addresses, setAddresses] = useState<AccountAddressResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !selectedAccount) {
      setAddresses([]);
      return;
    }

    let cancelled = false;

    const fetch = async () => {
      setIsLoading(true);
      try {
        const client = createEpClient();

        const result = await getV2AccountAddresses({
          client,
          path: { accountID: selectedAccount.account_id },
        });

        if (!cancelled) {
          setAddresses(result.data?.data ?? []);
        }
      } catch {
        // silently ignore — no addresses shown if fetch fails
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetch();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, selectedAccount]);

  async function addAddress(fields: NewAddressFields): Promise<AccountAddressResponse | null> {
    if (!selectedAccount) return null;
    const client = createEpClient();
    const result = await postV2AccountAddress({
      client,
      path: { accountID: selectedAccount.account_id },
      body: { data: { type: "address", ...fields } },
    });
    const created = result.data?.data ?? null;
    if (created) {
      setAddresses((prev) => [...prev, created]);
    }
    return created;
  }

  return { addresses, isLoading, addAddress };
}
