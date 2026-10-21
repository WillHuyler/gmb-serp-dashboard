'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ProviderMappingKey =
  | 'google_ads_id'
  | 'meta_act_id'
  | 'ga4_property_id'
  | 'gsc_site_url'
  | 'gmb_account_id'
  | 'gmb_location_id'
  | 'brightlocal_location_id'
  | 'serpapi_location_key'
  | 'bing_webmaster_site_url'
  | 'clarity_project_id';

export interface ClientProfileMappings {
  google_ads_id?: string;
  meta_act_id?: string;
  ga4_property_id?: string;
  gsc_site_url?: string;
  gmb_account_id?: string;
  gmb_location_id?: string;
  brightlocal_location_id?: string;
  serpapi_location_key?: string;
  bing_webmaster_site_url?: string;
  clarity_project_id?: string;
}

export interface ClientProfile {
  id: string;
  tenant_id: string;
  name: string;
  domain?: string;
  timezone?: string;
  currency?: string;
  address?: string;
  status?: 'active' | 'inactive' | 'onboarding' | 'legacy_unverified';
  is_certified: boolean;
  service_areas: string[];
  mappings: ClientProfileMappings;
  mapped_resource_count?: number;
  last_sync_at?: string | null;
  created_at?: string;
}

export type Client = ClientProfile;

export const AUTHORITATIVE_CLIENT_REGISTRY: ClientProfile[] = [];
export const CANONICAL_CLIENTS: ClientProfile[] = [];

interface ClientContextType {
  activeClient: ClientProfile | null;
  setActiveClient: (client: ClientProfile) => void;
  setActiveClientId: (id: string) => void;
  clientRegistry: ClientProfile[];
  clients: ClientProfile[];
  availableClients: ClientProfile[];
  isLoading: boolean;
  error: string | null;
  refreshClients: () => Promise<ClientProfile[]>;
}

const ClientContext = createContext<ClientContextType>({
  activeClient: null,
  setActiveClient: () => {},
  setActiveClientId: () => {},
  clientRegistry: [],
  clients: [],
  availableClients: [],
  isLoading: true,
  error: null,
  refreshClients: async () => [],
});

const ACTIVE_CLIENT_STORAGE_KEY = 'pl_active_client_id_v2';

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [registry, setRegistry] = useState<ClientProfile[]>([]);
  const [activeClient, setActiveClientState] = useState<ClientProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const purgeClientCache = (previousClientId?: string) => {
    if (typeof window === 'undefined' || !previousClientId) return;
    localStorage.removeItem(`pl_insights_${previousClientId}`);
    sessionStorage.removeItem(`pl_telemetry_${previousClientId}`);
    sessionStorage.removeItem(`pl_serp_${previousClientId}`);
  };

  const refreshClients = useCallback(async (): Promise<ClientProfile[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/clients', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (res.status === 401 || res.status === 403) {
        setRegistry([]);
        setActiveClientState(null);
        setError('AUTHENTICATION_REQUIRED');
        return [];
      }

      const data = await res.json();
      if (!res.ok || !data.success || !Array.isArray(data.clients)) {
        setError(data?.error?.message || 'Failed to load client registry.');
        return [];
      }

      const loadedClients: ClientProfile[] = data.clients;
      setRegistry(loadedClients);

      if (loadedClients.length > 0) {
        const urlParams =
          typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const urlClientId = urlParams?.get('clientId');
        const storedClientId =
          typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_CLIENT_STORAGE_KEY) : null;

        const preferred =
          (urlClientId && loadedClients.find((c) => c.id === urlClientId)) ||
          (storedClientId && loadedClients.find((c) => c.id === storedClientId)) ||
          loadedClients.find((c) => c.is_certified) ||
          loadedClients[0];

        setActiveClientState(preferred || null);
        if (preferred && typeof window !== 'undefined') {
          localStorage.setItem(ACTIVE_CLIENT_STORAGE_KEY, preferred.id);
        }
      } else {
        setActiveClientState(null);
      }

      return loadedClients;
    } catch (err: any) {
      setError(err?.message || 'Network error while loading clients.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshClients();
  }, [refreshClients]);

  const setActiveClient = (client: ClientProfile) => {
    purgeClientCache(activeClient?.id);
    setActiveClientState(client);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACTIVE_CLIENT_STORAGE_KEY, client.id);
    }
  };

  const setActiveClientId = (id: string) => {
    const found = registry.find((c) => c.id === id);
    if (found) {
      setActiveClient(found);
    }
  };

  return (
    <ClientContext.Provider
      value={{
        activeClient,
        setActiveClient,
        setActiveClientId,
        clientRegistry: registry,
        clients: registry,
        availableClients: registry,
        isLoading,
        error,
        refreshClients,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  return useContext(ClientContext);
}
