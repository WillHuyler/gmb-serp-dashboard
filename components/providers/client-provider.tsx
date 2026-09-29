"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export type ClientType = "REAL" | "TEST" | "INACTIVE";

export interface ClientRecord {
  id: string;
  name: string;
  market_location?: string;
  status: "active" | "inactive";
  type: ClientType;
  created_at?: string;
}

interface ClientContextType {
  activeClient: ClientRecord | null;
  clients: ClientRecord[];
  isLoading: boolean;
  error: string | null;
  setActiveClientById: (clientId: string) => void;
  refetchClients: () => Promise<void>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

const STORAGE_KEY = "porchlight_active_client_id";

export function ClientProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [activeClient, setActiveClient] = useState<ClientRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  const fetchClients = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from("clients")
        .select("id, name, market_location, status, type")
        .order("name", { ascending: true });

      if (dbError) throw dbError;

      if (data && data.length > 0) {
        const formattedClients: ClientRecord[] = data.map((c) => ({
          id: c.id,
          name: c.name,
          market_location: c.market_location || "Unspecified Market",
          status: c.status || "active",
          type: (c.type as ClientType) || (c.name.toLowerCase().includes("test") ? "TEST" : "REAL"),
        }));

        setClients(formattedClients);

        // Client Resolution Priority: 1. URL Param -> 2. LocalStorage -> 3. First Active Real Client
        const urlClientId = searchParams.get("client_id");
        const storedClientId = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;

        const targetClient =
          formattedClients.find((c) => c.id === urlClientId) ||
          formattedClients.find((c) => c.id === storedClientId) ||
          formattedClients.find((c) => c.type === "REAL" && c.status === "active") ||
          formattedClients[0];

        if (targetClient) {
          setActiveClient(targetClient);
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, targetClient.id);
          }
        }
      } else {
        setClients([]);
        setActiveClient(null);
      }
    } catch (err: any) {
      console.error("Failed to load client registry:", err);
      setError(err.message || "Failed to load clients from authoritative source.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const setActiveClientById = (clientId: string) => {
    const selected = clients.find((c) => c.id === clientId);
    if (!selected) return;

    // Purge module cache buffers to prevent cross-tenant data leaks
    if (typeof window !== "undefined") {
      sessionStorage.clear();
      localStorage.setItem(STORAGE_KEY, selected.id);
    }

    setActiveClient(selected);

    // Update URL query parameters synchronously
    const params = new URLSearchParams(searchParams.toString());
    params.set("client_id", selected.id);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <ClientContext.Provider
      value={{
        activeClient,
        clients,
        isLoading,
        error,
        setActiveClientById,
        refetchClients: fetchClients,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error("useClient must be used within a ClientProvider");
  }
  return context;
}
