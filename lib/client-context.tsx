'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type ProviderMappingKey =
  | 'gmb_account_id'
  | 'gmb_location_id'
  | 'google_ads_id'
  | 'ga4_property_id'
  | 'gsc_site_url'
  | 'meta_act_id'
  | 'bing_webmaster_site_url'
  | 'clarity_project_id'
  | 'brightlocal_location_id'
  | 'serpapi_location_key'
  | 'crm_account_id';

export interface ClientMappings {
  gmb_account_id?: string;
  gmb_location_id?: string;
  google_ads_id?: string;
  ga4_property_id?: string;
  gsc_site_url?: string;
  meta_act_id?: string;
  bing_webmaster_site_url?: string;
  clarity_project_id?: string;
  brightlocal_location_id?: string;
  serpapi_location_key?: string;
  crm_account_id?: string;
  [key: string]: string | undefined;
}

export type ClientProfileMappings = ClientMappings;

export interface ClientProfile {
  id: string;
  tenant_id: string;
  name: string;
  slug?: string | null;
  store_code?: string | null;
  address?: string | null;
  primary_location?: string | null;
  domain?: string | null;
  industry?: string | null;
  timezone?: string | null;
  currency?: string | null;
  status?: 'active' | 'onboarding' | 'inactive' | string;
  is_certified: boolean;
  certification_state?: string;
  has_historical_data?: boolean;
  latest_metric_date?: string | null;
  staleness_days?: number | null;
  provenance_reason?: string;
  data_certification_status?: string;
  type?: 'REAL' | 'TEST';
  mapped_resource_count?: number;
  mapped_accounts_count?: number;
  verified_providers_count?: number;
  created_at?: string;
  updated_at?: string;
  organization_id?: string | null;
  service_areas: string[];
  mappings: ClientMappings;
  [key: string]: any;
}

export type Client = ClientProfile;

export const AUTHORITATIVE_CLIENT_REGISTRY: ClientProfile[] = [];
export const CANONICAL_CLIENTS: ClientProfile[] = [];

interface ClientContextType {
  activeClient: ClientProfile | null;
  availableClients: ClientProfile[];
  clients: ClientProfile[];
  clientRegistry: ClientProfile[];
  setActiveClient: (client: ClientProfile | null) => void;
  setActiveClientId: (id: string) => void;
  addClient: (newClient: ClientProfile) => void;
  refreshClients: () => Promise<void>;
  isLoading: boolean;
  authStatus: 'loading' | 'authenticated' | 'unauthenticated' | 'forbidden' | 'error';
  error: string | null;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
  const [clientList, setClientList] = useState<ClientProfile[]>([]);
  const [activeClient, setActiveClientState] = useState<ClientProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated' | 'forbidden' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const refreshClients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/clients', { cache: 'no-store', credentials: 'include' });
      if (res.status === 401 || res.status === 403) {
        setClientList([]);
        setActiveClientState(null);
        setAuthStatus(res.status === 401 ? 'unauthenticated' : 'forbidden');
        setError(res.status === 401 ? 'Authentication required (401).' : 'Access forbidden (403).');
        return;
      }
      if (!res.ok) {
        setClientList([]);
        setActiveClientState(null);
        setAuthStatus('error');
        setError(`Failed to load clients (HTTP ${res.status}).`);
        return;
      }
      const data = await res.json();
      const loaded: ClientProfile[] = Array.isArray(data.clients) ? data.clients : [];
      setClientList(loaded);
      setAuthStatus('authenticated');
      if (loaded.length === 0) {
        setActiveClientState(null);
        return;
      }
      const urlId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('clientId') : null;
      const savedId = typeof window !== 'undefined' ? localStorage.getItem('porchlight_active_client_id') : null;
      const targetId = urlId || savedId;
      setActiveClientState(loaded.find((c) => c.id === targetId) || loaded[0]);
    } catch (err: any) {
      setClientList([]);
      setActiveClientState(null);
      setAuthStatus('error');
      setError(err?.message || 'Error loading clients.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshClients();
  }, [refreshClients]);

  const setActiveClient = (client: ClientProfile | null) => {
    setIsLoading(true);
    setActiveClientState(client);
    if (typeof window !== 'undefined') {
      if (client) localStorage.setItem('porchlight_active_client_id', client.id);
      else localStorage.removeItem('porchlight_active_client_id');
    }
    setTimeout(() => setIsLoading(false), 50);
  };

  const setActiveClientId = (id: string) => {
    setActiveClient(clientList.find((c) => c.id === id) || null);
  };

  const addClient = (newClient: ClientProfile) => {
    setClientList((prev) => [...prev, newClient]);
    setActiveClient(newClient);
  };

  return (
    <ClientContext.Provider
      value={{
        activeClient,
        availableClients: clientList,
        clients: clientList,
        clientRegistry: clientList,
        setActiveClient,
        setActiveClientId,
        addClient,
        refreshClients,
        isLoading,
        authStatus,
        error,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
}
// END OF FILE
