'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  store_code?: string | null;
  address?: string | null;
  domain?: string | null;
  is_certified: boolean;
  data_certification_status?: string;
  type?: 'REAL' | 'TEST';
  service_areas: string[];
  mappings: ClientMappings;
}

export type Client = ClientProfile;

// Exact 1:1 mirror of the 9 verified client rows in Supabase public.clients
export const AUTHORITATIVE_CLIENT_REGISTRY: ClientProfile[] = [
  {
    id: '98b58332-a79d-47ac-b771-96ecce1f04fc',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    name: 'High Rise Chimney Sweep & Service',
    store_code: '1003001',
    address: 'Delavan, WI, USA',
    domain: 'highrisechimney.com',
    is_certified: true,
    data_certification_status: 'DATA_REVIEW_REQUIRED',
    type: 'REAL',
    service_areas: ['53092', '53097', '53202', '53211', '53217'],
    mappings: {
      gmb_account_id: '1003001',
      gmb_location_id: '1003001',
      google_ads_id: 'ads_highrise_53202',
      ga4_property_id: 'ga4_highrise_53202',
      gsc_site_url: 'https://highrisechimney.com',
      meta_act_id: 'act_highrise_53202',
      brightlocal_location_id: 'bl_highrise_53202',
    },
  },
  {
    id: 'db2c2c46-d16b-48bd-9bf9-d530e61ca2b4',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    name: 'Kelly Hyundai of Stroudsburg',
    store_code: '9478581082636497192',
    address: '1534 N 9th St, Stroudsburg, PA 18360',
    domain: 'kellyhyundai.com',
    is_certified: false,
    data_certification_status: 'DATA_REVIEW_REQUIRED',
    type: 'REAL',
    service_areas: ['18360'],
    mappings: {
      gmb_location_id: '9478581082636497192',
    },
  },
  {
    id: 'bf93fef0-fc60-4119-8ea2-68a274984355',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    name: 'Kelly Hyundai of Stroudsburg Service and Parts',
    store_code: '06510819750374635156',
    address: '1534 N 9th St, Stroudsburg, PA 18360',
    domain: 'kellyhyundai.com',
    is_certified: false,
    data_certification_status: 'DATA_REVIEW_REQUIRED',
    type: 'REAL',
    service_areas: ['18360'],
    mappings: {
      gmb_location_id: '06510819750374635156',
    },
  },
  {
    id: '8bdf10e5-3198-45d1-8baa-66deba9b2279',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    name: 'CarBahn Service',
    store_code: '1318998720183880132',
    address: '1965 Kyle Park Ct, San Jose, CA 95125',
    domain: null,
    is_certified: false,
    data_certification_status: 'DATA_REVIEW_REQUIRED',
    type: 'REAL',
    service_areas: ['95125'],
    mappings: {
      gmb_location_id: '1318998720183880132',
    },
  },
  {
    id: 'a0e05742-c348-423c-94c4-3b3eec663a35',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    name: 'Koon Cook & Walters',
    store_code: '2613472_1',
    address: '2016 Gadsden St., Columbia, SC 29201',
    domain: null,
    is_certified: false,
    data_certification_status: 'DATA_REVIEW_REQUIRED',
    type: 'REAL',
    service_areas: ['29201'],
    mappings: {
      gmb_location_id: '2613472_1',
    },
  },
  {
    id: 'ebfd7627-b940-4790-85f0-ecbc9fb40947',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    name: 'Sicardo Towing',
    store_code: '06814199601923124542',
    address: '11 Hamburg Turnpike, Riverdale, NJ 07457',
    domain: null,
    is_certified: false,
    data_certification_status: 'DATA_REVIEW_REQUIRED',
    type: 'REAL',
    service_areas: ['07457'],
    mappings: {
      gmb_location_id: '06814199601923124542',
    },
  },
  {
    id: '93a113cc-2e20-490b-bcd5-974f90189f50',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    name: 'BROTHERS-IN-BUSINESS FLOORING LLC',
    store_code: '06832735424770532428',
    address: '506 E College St, Suite B, Dickson, TN 37055',
    domain: null,
    is_certified: false,
    data_certification_status: 'DATA_REVIEW_REQUIRED',
    type: 'REAL',
    service_areas: ['37055'],
    mappings: {
      gmb_location_id: '06832735424770532428',
    },
  },
  {
    id: '22a8990a-608b-428b-97a6-2e6dd86dd13b',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    name: 'Brothers-in-Business LLC',
    store_code: null,
    address: '301 S. Main St., Ste. A, Dickson, TN 37055',
    domain: null,
    is_certified: false,
    data_certification_status: 'DATA_REVIEW_REQUIRED',
    type: 'REAL',
    service_areas: ['37055'],
    mappings: {},
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    name: 'ABC Motors',
    store_code: null,
    address: null,
    domain: 'abcmotors.com',
    is_certified: false,
    data_certification_status: 'DATA_REVIEW_REQUIRED',
    type: 'TEST',
    service_areas: [],
    mappings: {},
  },
];

export const CANONICAL_CLIENTS = AUTHORITATIVE_CLIENT_REGISTRY;

interface ClientContextType {
  activeClient: ClientProfile | null;
  availableClients: ClientProfile[];
  clients: ClientProfile[];
  clientRegistry: ClientProfile[];
  setActiveClient: (client: ClientProfile) => void;
  setActiveClientId: (id: string) => void;
  addClient: (newClient: ClientProfile) => void;
  refreshClients: () => Promise<void>;
  isLoading: boolean;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
  const [clientList, setClientList] = useState<ClientProfile[]>(AUTHORITATIVE_CLIENT_REGISTRY);
  const [activeClient, setActiveClientState] = useState<ClientProfile | null>(AUTHORITATIVE_CLIENT_REGISTRY[0]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshClients = async () => {
    try {
      const res = await fetch('/api/clients', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.clients) && data.clients.length > 0) {
        setClientList(data.clients);
        const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const urlClientId = urlParams?.get('clientId');
        const savedId = typeof window !== 'undefined' ? localStorage.getItem('porchlight_active_client_id') : null;
        const targetId = urlClientId || savedId || activeClient?.id;

        const nextActive =
          data.clients.find((c: ClientProfile) => c.id === targetId) ||
          data.clients[0];

        if (nextActive) {
          setActiveClientState(nextActive);
        }
      }
    } catch (err) {
      console.warn('Using canonical client registry fallback:', err);
    }
  };

  useEffect(() => {
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const urlClientId = urlParams?.get('clientId');
    const savedClientId = typeof window !== 'undefined' ? localStorage.getItem('porchlight_active_client_id') : null;
    const initialId = urlClientId || savedClientId;

    if (initialId) {
      const match = clientList.find((c) => c.id === initialId);
      if (match) {
        setActiveClientState(match);
      }
    }
    refreshClients();
  }, []);

  const setActiveClient = (client: ClientProfile) => {
    setIsLoading(true);
    setActiveClientState(client);
    if (typeof window !== 'undefined') {
      localStorage.setItem('porchlight_active_client_id', client.id);
    }
    setTimeout(() => setIsLoading(false), 150);
  };

  const setActiveClientId = (id: string) => {
    const match = clientList.find((c) => c.id === id);
    if (match) {
      setActiveClient(match);
    }
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
