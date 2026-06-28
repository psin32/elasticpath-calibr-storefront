"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Client } from "@hey-api/client-fetch";
import { createEpClient } from "@/lib/api/ep-client";

const ClientContext = createContext<Client | null>(null);

export function ClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => createEpClient(), []);

  return (
    <ClientContext.Provider value={client}>{children}</ClientContext.Provider>
  );
}

export function useEpClient(): Client {
  const client = useContext(ClientContext);
  if (!client) {
    throw new Error("useEpClient must be used within <ClientProvider>");
  }
  return client;
}
