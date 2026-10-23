'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import {
  ReportingPeriod,
  buildDynamicReportingPresets,
  resolveUserTimezone,
  isValidIsoDateString,
} from './reporting-period';

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
  | 'FORBIDDEN'
  | 'CLIENTS_LOADING'
  | 'QUERY_FAILED'
  | 'NO_CLIENTS_ASSIGNED'
  | 'CLIENTS_AVAILABLE';

export interface AuthenticatedUserInfo {
  id: string;
  email: string;
  role: string;
  authorizedTenantIds?: string[];
}

export type { ReportingPeriod };

interface ClientContextType {
  activeClient: ClientProfile | null;
  availableClients: ClientProfile[];
  clients: ClientProfile[];
  clientRegistry: ClientProfile[];
  setActiveClient: (client: ClientProfile | null) => void;
  setActiveClientId: (id: string) => void;
  addClient: (newClient: ClientProfile) => void;
  refreshClients: () => Promise<ClientProfile[]>;
  signOutCleanly: () => Promise<void>;
  isLoading: boolean;
  registryState: RegistryLoadState;
  authStatus: 'loading' | 'authenticated' | 'unauthenticated' | 'forbidden' | 'error';
  currentUser: AuthenticatedUserInfo | null;
  userTimezone: string;
  setUserTimezone: (tz: string) => void;
  reportingPeriod: ReportingPeriod;
  reportingPresets: ReportingPeriod[];
  setReportingPeriod: (period: ReportingPeriod) => void;
  clientSwitchVersion: number;
  error: string | null;
}

const initialPresets = buildDynamicReportingPresets('America/New_York');

const ClientContext = createContext<ClientContextType>({
  activeClient: null,
  availableClients: [],
  clients: [],
  clientRegistry: [],
  setActiveClient: () => {},
  setActiveClientId: () => {},
  addClient: () => {},
  refreshClients: async () => [],
  signOutCleanly: async () => {},
  isLoading: true,
  registryState: 'AUTH_LOADING',
  authStatus: 'loading',
  currentUser: null,
  userTimezone: 'America/New_York',
  setUserTimezone: () => {},
  reportingPeriod: initialPresets[0],
  reportingPresets: initialPresets,
  setReportingPeriod: () => {},
  clientSwitchVersion: 0,
  error: null,
});

const ACTIVE_CLIENT_STORAGE_KEY = 'porchlight_active_client_id';
const REPORTING_PERIOD_STORAGE_KEY = 'porchlight_reporting_period';
const USER_TIMEZONE_STORAGE_KEY = 'porchlight_user_timezone';

export function ClientProvider({ children }: { children: ReactNode }) {
  const [clientList, setClientList] = useState<ClientProfile[]>([]);
  const [activeClient, setActiveClientState] = useState<ClientProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [registryState, setRegistryState] = useState<RegistryLoadState>('AUTH_LOADING');
  const [authStatus, setAuthStatus] = useState<
    'loading' | 'authenticated' | 'unauthenticated' | 'forbidden' | 'error'
  >('loading');
  const [currentUser, setCurrentUser] = useState<AuthenticatedUserInfo | null>(null);
  const [userTimezone, setUserTimezoneState] = useState<string>('America/New_York');
  const [reportingPresets, setReportingPresets] = useState<ReportingPeriod[]>(initialPresets);
  const [reportingPeriod, setReportingPeriodState] = useState<ReportingPeriod>(initialPresets[0]);
  const [clientSwitchVersion, setClientSwitchVersion] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const fetchGenerationRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTz =
        localStorage.getItem(USER_TIMEZONE_STORAGE_KEY) || resolveUserTimezone();
      setUserTimezoneState(savedTz);
      const dynamicPresets = buildDynamicReportingPresets(savedTz);
      setReportingPresets(dynamicPresets);

      const urlParams = new URLSearchParams(window.location.search);
      const urlStart = urlParams.get('startDate');
      const urlEnd = urlParams.get('endDate');

      if (isValidIsoDateString(urlStart) && isValidIsoDateString(urlEnd)) {
        const matched = dynamicPresets.find(
          (p) => p.startDate === urlStart && p.endDate === urlEnd
        );
        setReportingPeriodState(
          matched || {
            presetId: 'CUSTOM',
            startDate: urlStart,
            endDate: urlEnd,
            presetLabel: `${urlStart} → ${urlEnd}`,
            timezone: savedTz,
          }
        );
        return;
      }

      try {
        const savedPeriodRaw = localStorage.getItem(REPORTING_PERIOD_STORAGE_KEY);
        if (savedPeriodRaw) {
          const parsed = JSON.parse(savedPeriodRaw);
          if (parsed?.presetId && parsed.presetId !== 'CUSTOM') {
            const matchedPreset = dynamicPresets.find(
              (p) => p.presetId === parsed.presetId
            );
            if (matchedPreset) {
              setReportingPeriodState(matchedPreset);
              return;
            }
          } else if (
            isValidIsoDateString(parsed?.startDate) &&
            isValidIsoDateString(parsed?.endDate)
          ) {
            setReportingPeriodState({
              presetId: 'CUSTOM',
              startDate: parsed.startDate,
              endDate: parsed.endDate,
              presetLabel: `${parsed.startDate} → ${parsed.endDate}`,
              timezone: savedTz,
            });
            return;
          }
        }
      } catch {
        // Ignore parse error and use default dynamic preset
      }

      setReportingPeriodState(dynamicPresets[0]);
    }
  }, []);

  const setUserTimezone = (tz: string) => {
    const resolved = resolveUserTimezone(tz);
    setUserTimezoneState(resolved);
    const updatedPresets = buildDynamicReportingPresets(resolved);
    setReportingPresets(updatedPresets);
    const matching =
      updatedPresets.find((p) => p.presetId === reportingPeriod.presetId) ||
      updatedPresets[0];
    setReportingPeriodState(matching);
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_TIMEZONE_STORAGE_KEY, resolved);
      localStorage.setItem(REPORTING_PERIOD_STORAGE_KEY, JSON.stringify(matching));
    }
  };

  const setReportingPeriod = (period: ReportingPeriod) => {
    setReportingPeriodState(period);
    setClientSwitchVersion((v) => v + 1);
    if (typeof window !== 'undefined') {
      localStorage.setItem(REPORTING_PERIOD_STORAGE_KEY, JSON.stringify(period));
    }
  };

  const purgeCrossClientCache = (prevId?: string) => {
    if (typeof window === 'undefined') return;
    if (prevId) {
      localStorage.removeItem(`pl_insights_${prevId}`);
      sessionStorage.removeItem(`pl_telemetry_${prevId}`);
      sessionStorage.removeItem(`pl_serp_${prevId}`);
    }
  };

  const signOutCleanly = useCallback(async () => {
    purgeCrossClientCache(activeClient?.id);
    await fetch('/api/auth/session', { method: 'DELETE', credentials: 'include' }).catch(
      () => {}
    );
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACTIVE_CLIENT_STORAGE_KEY);
    }
    setClientList([]);
    setActiveClientState(null);
    setCurrentUser(null);
    setAuthStatus('unauthenticated');
    setRegistryState('AUTH_REQUIRED');
    setClientSwitchVersion((v) => v + 1);
  }, [activeClient?.id]);

  const refreshClients = useCallback(async (): Promise<ClientProfile[]> => {
    const currentGen = ++fetchGenerationRef.current;
    setIsLoading(true);
    setRegistryState((prev) =>
      prev === 'AUTH_LOADING' ? 'AUTH_LOADING' : 'CLIENTS_LOADING'
    );
    setError(null);

    const executeClientsFetch = async () =>
      fetch('/api/clients', {
        method: 'GET',
        cache: 'no-store',
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' },
      });

    try {
      let res = await executeClientsFetch();

      // CR-023 Requirement #4 & #5: Attempt token refresh via /api/auth/session on 401
      if (res.status === 401) {
        const refreshRes = await fetch('/api/auth/session', {
          method: 'GET',
          cache: 'no-store',
          credentials: 'include',
        });

        if (refreshRes.ok) {
          res = await executeClientsFetch();
        } else {
          if (currentGen !== fetchGenerationRef.current) return [];
          setClientList([]);
          setActiveClientState(null);
          setCurrentUser(null);
          setAuthStatus('unauthenticated');
          setRegistryState('AUTH_REQUIRED');
          setError('Authentication required. Please sign in.');
          return [];
        }
      }

      if (currentGen !== fetchGenerationRef.current) return [];

      if (res.status === 401 || res.status === 403) {
        setClientList([]);
        setActiveClientState(null);
        setCurrentUser(null);
        setAuthStatus(res.status === 401 ? 'unauthenticated' : 'forbidden');
        setRegistryState(res.status === 401 ? 'AUTH_REQUIRED' : 'FORBIDDEN');
        setError(
          res.status === 401
            ? 'Authentication required. Please sign in.'
            : 'Access denied: your account is not assigned to this tenant.'
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
          authorizedTenantIds: data.meta?.authorizedTenantIds || [],
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
      if (currentGen !== fetchGenerationRef.current) return [];
      setClientList([]);
      setActiveClientState(null);
      setAuthStatus('error');
      setRegistryState('QUERY_FAILED');
      setError(err?.message || 'Network error while loading authorized clients.');
      return [];
    } finally {
      if (currentGen === fetchGenerationRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refreshClients();
  }, [refreshClients]);

  const setActiveClient = (client: ClientProfile | null) => {
    purgeCrossClientCache(activeClient?.id);
    setClientSwitchVersion((v) => v + 1);
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
        signOutCleanly,
        isLoading,
        registryState,
        authStatus,
        currentUser,
        userTimezone,
        setUserTimezone,
        reportingPeriod,
        reportingPresets,
        setReportingPeriod,
        clientSwitchVersion,
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
