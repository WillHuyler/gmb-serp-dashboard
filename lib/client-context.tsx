'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

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
  last_sync_at?: string | null;
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

export type RegistryLoadState =
  | 'AUTH_LOADING'
  | 'AUTH_REQUIRED'
  | 'CLIENTS_LOADING'
  | 'QUERY_FAILED'
  | 'NO_CLIENTS_ASSIGNED'
  | 'CLIENTS_AVAILABLE';

export interface AuthenticatedUserInfo {
  id: string;
  email: string;
  role: string;
}

export interface ReportingPeriod {
  startDate: string;
  endDate: string;
  presetLabel: string;
}

interface ClientContextType {
  activeClient: ClientProfile | null;
  availableClients: ClientProfile[];
  clients: ClientProfile[];
  clientRegistry: ClientProfile[];
  setActiveClient: (client: ClientProfile | null) => void;
  setActiveClientId: (id: string) => void;
  addClient: (newClient: ClientProfile) => void;
  refreshClients: () => Promise<ClientProfile[]>;
  isLoading: boolean;
  registryState: RegistryLoadState;
  authStatus: 'loading' | 'authenticated' | 'unauthenticated' | 'forbidden' | 'error';
  currentUser: AuthenticatedUserInfo | null;
  reportingPeriod: ReportingPeriod;
  setReportingPeriod: (period: ReportingPeriod) => void;
  error: string | null;
}

const DEFAULT_REPORTING_PERIOD: ReportingPeriod = {
  startDate: '2026-09-01',
  endDate: '2026-09-30',
  presetLabel: 'Last Complete Month (Sep 2026)',
};

const ClientContext = createContext<ClientContextType>({
  activeClient: null,
  availableClients: [],
  clients: [],
  clientRegistry: [],
  setActiveClient: () => {},
  setActiveClientId: () => {},
  addClient: () => {},
  refreshClients: async () => [],
  isLoading: true,
  registryState: 'AUTH_LOADING',
  authStatus: 'loading',
  currentUser: null,
  reportingPeriod: DEFAULT_REPORTING_PERIOD,
  setReportingPeriod: () => {},
  error: null,
});

const ACTIVE_CLIENT_STORAGE_KEY = 'porchlight_active_client_id';
const REPORTING_PERIOD_STORAGE_KEY = 'porchlight_reporting_period';

export function ClientProvider({ children }: { children: ReactNode }) {
  const [clientList, setClientList] = useState<ClientProfile[]>([]);
  const [activeClient, setActiveClientState] = useState<ClientProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [registryState, setRegistryState] = useState<RegistryLoadState>('AUTH_LOADING');
  const [authStatus, setAuthStatus] = useState<
    'loading' | 'authenticated' | 'unauthenticated' | 'forbidden' | 'error'
  >('loading');
  const [currentUser, setCurrentUser] = useState<AuthenticatedUserInfo | null>(null);
  const [reportingPeriod, setReportingPeriodState] = useState<ReportingPeriod>(
    DEFAULT_REPORTING_PERIOD
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedPeriod = localStorage.getItem(REPORTING_PERIOD_STORAGE_KEY);
        if (savedPeriod) {
          const parsed = JSON.parse(savedPeriod);
          if (parsed?.startDate && parsed?.endDate) {
            setReportingPeriodState(parsed);
          }
        }
      } catch {
        // Ignore storage parse error
      }
    }
  }, []);

  const setReportingPeriod = (period: ReportingPeriod) => {
    setReportingPeriodState(period);
    if (typeof window !== 'undefined') {
      localStorage.setItem(REPORTING_PERIOD_STORAGE_KEY, JSON.stringify(period));
    }
  };

  const purgeCrossClientCache = (prevId?: string) => {
    if (typeof window === 'undefined' || !prevId) return;
    localStorage.removeItem(`pl_insights_${prevId}`);
    sessionStorage.removeItem(`pl_telemetry_${prevId}`);
    sessionStorage.removeItem(`pl_serp_${prevId}`);
  };

  const refreshClients = useCallback(async (): Promise<ClientProfile[]> => {
    setIsLoading(true);
    setRegistryState('CLIENTS_LOADING');
    setError(null);

    try {
      const res = await fetch('/api/clients', {
        method: 'GET',
        cache: 'no-store',
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (res.status === 401 || res.status === 403) {
        setClientList([]);
        setActiveClientState(null);
        setCurrentUser(null);
        setAuthStatus(res.status === 401 ? 'unauthenticated' : 'forbidden');
        setRegistryState('AUTH_REQUIRED');
        setError(
          res.status === 401
            ? 'Session authentication required. Please sign in.'
            : 'Your account does not have permission for this tenant.'
        );
        return [];
      }

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setClientList([]);
        setActiveClientState(null);
        setAuthStatus('error');
        setRegistryState('QUERY_FAILED');
        setError(
          data?.error?.message || `Client registry query failed (HTTP ${res.status}).`
        );
        return [];
      }

      if (data.user) {
        setCurrentUser({
          id: data.user.id,
          email: data.user.email || 'Authenticated User',
          role: data.user.role || 'member',
        });
      }

      const loaded: ClientProfile[] = Array.isArray(data.clients) ? data.clients : [];
      setClientList(loaded);
      setAuthStatus('authenticated');

      if (loaded.length === 0) {
        setActiveClientState(null);
        setRegistryState('NO_CLIENTS_ASSIGNED');
        return [];
      }

      setRegistryState('CLIENTS_AVAILABLE');

      const urlId =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('clientId')
          : null;
      const savedId =
        typeof window !== 'undefined'
          ? localStorage.getItem(ACTIVE_CLIENT_STORAGE_KEY)
          : null;
      const targetId = urlId || savedId;

      const selected =
        (targetId && loaded.find((c) => c.id === targetId)) ||
        loaded.find((c) => c.is_certified) ||
        loaded[0];

      setActiveClientState(selected);
      if (selected && typeof window !== 'undefined') {
        localStorage.setItem(ACTIVE_CLIENT_STORAGE_KEY, selected.id);
      }

      return loaded;
    } catch (err: any) {
      setClientList([]);
      setActiveClientState(null);
      setAuthStatus('error');
      setRegistryState('QUERY_FAILED');
      setError(err?.message || 'Network error while loading authorized clients.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshClients();
  }, [refreshClients]);

  const setActiveClient = (client: ClientProfile | null) => {
    purgeCrossClientCache(activeClient?.id);
    setActiveClientState(client);
    if (typeof window !== 'undefined') {
      if (client) {
        localStorage.setItem(ACTIVE_CLIENT_STORAGE_KEY, client.id);
      } else {
        localStorage.removeItem(ACTIVE_CLIENT_STORAGE_KEY);
      }
    }
  };

  const setActiveClientId = (id: string) => {
    const found = clientList.find((c) => c.id === id) || null;
    if (found) {
      setActiveClient(found);
    }
  };

  const addClient = (newClient: ClientProfile) => {
    setClientList((prev) => [...prev, newClient]);
    setRegistryState('CLIENTS_AVAILABLE');
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
        registryState,
        authStatus,
        currentUser,
        reportingPeriod,
        setReportingPeriod,
        error,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  return useContext(ClientContext);
}
