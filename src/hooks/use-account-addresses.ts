"use client";

import { useState, useEffect } from "react";
import {
  getV2AccountAddresses,
  type AccountAddressResponse,
} from "@epcc-sdk/sdks-shopper";
import { useAuth } from "@/context/AuthContext";
import { createEpClient } from "@/lib/api/ep-client";

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

  return { addresses, isLoading };
}
