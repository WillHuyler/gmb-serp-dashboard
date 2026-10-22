'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { DataCertificationState } from './data-certification';

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
  certification_state?: DataCertificationState;
  has_historical_data?: boolean;
  latest_metric_date?: string | null;
  staleness_days?: number | null;
  provenance_reason?: string;
  data_certification_status?: string;
  type?: 'REAL' | 'TEST';
  mapped_accounts_count?: number;
  verified_providers_count?: number;
  created_at?: string;
  updated_at?: string;
  organization_id?: string | null;
  service_areas: string[];
  mappings: ClientMappings;
}

export type Client = ClientProfile;

// CR-011 Requirement 8: Production client registry fallback removed.
// Exported as empty arrays strictly for backwards-compatible import signatures.
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
  const [authStatus, setAuthStatus] = useState<
    'loading' | 'authenticated' | 'unauthenticated' | 'forbidden' | 'error'
  >('loading');
  const [error, setError] = useState<string | null>(null);

  const refreshClients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/clients', {
        cache: 'no-store',
        credentials: 'include',
      });

      if (res.status === 401) {
        setClientList([]);
        setActiveClientState(null);
        setAuthStatus('unauthenticated');
        setError('Authentication required (401). Please sign in to access client records.');
        return;
      }

      if (res.status === 403) {
        setClientList([]);
        setActiveClientState(null);
        setAuthStatus('forbidden');
        setError('Access forbidden (403). Your account is not authorized for this tenant.');
        return;
      }

      if (!res.ok) {
        const errPayload = await res.json().catch(() => ({}));
        setClientList([]);
        setActiveClientState(null);
        setAuthStatus('error');
        setError(errPayload.message || `Failed to load clients (HTTP ${res.status}).`);
        return;
      }

      const data = await res.json();
      const loadedClients: ClientProfile[] = Array.isArray(data.clients) ? data.clients : [];
      setClientList(loadedClients);
      setAuthStatus('authenticated');

      if (loadedClients.length === 0) {
        setActiveClientState(null);
        return;
      }

      const urlParams =
        typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const urlClientId = urlParams?.get('clientId');
      const savedId =
        typeof window !== 'undefined'
          ? localStorage.getItem('porchlight_active_client_id')
          : null;

      const targetId = urlClientId || savedId;
      const matched = loadedClients.find((c) => c.id === targetId) || loadedClients[0];
      setActiveClientState(matched);
    } catch (err: any) {
      setClientList([]);
      setActiveClientState(null);
      setAuthStatus('error');
      setError(err?.message || 'Network error while loading authorized clients.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshClients();
  }, [refreshClients]);

  const setActiveClient = (client: ClientProfile | null) => {
    setIsLoading(true);
    // Atomically clear previous client state before setting next client
    setActiveClientState(client);
    if (typeof window !== 'undefined') {
      if (client) {
        localStorage.setItem('porchlight_active_client_id', client.id);
      } else {
        localStorage.removeItem('porchlight_active_client_id');
      }
    }
    setTimeout(() => setIsLoading(false), 50);
  };

  const setActiveClientId = (id: string) => {
    const match = clientList.find((c) => c.id === id) || null;
    setActiveClient(match);
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
  if (!context) throw new Error('useClient must be used within a ClientProvider');
  return context;
}
