'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Client {
  id: string;
  tenant_id: string;
  name: string;
  is_certified: boolean;
  mappings?: {
    gmb_account_id?: string;
    google_ads_id?: string;
    ga4_property_id?: string;
    gsc_site_url?: string;
    meta_act_id?: string;
    bing_webmaster_site_url?: string;
    clarity_project_id?: string;
    brightlocal_location_id?: string;
  };
}

// Canonical Client Registry — Certified Roster
export const CANONICAL_CLIENTS: Client[] = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    name: 'ABC Motors',
    is_certified: false,
    mappings: {
      gmb_account_id: 'gmb_abc_motors_01',
      brightlocal_location_id: 'bl_abc_motors_01',
    },
  },
  {
    id: 'bf93fef0-fc60-4119-8ea2-68a274984355',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    name: 'High Rise Chimney Sweep & Service',
    is_certified: true,
    mappings: {
      gmb_account_id: 'gmb_highrise_01',
      google_ads_id: 'ads_highrise_9821',
      ga4_property_id: 'ga4_highrise_3311',
      gsc_site_url: 'https://highrisechimney.com',
      meta_act_id: 'act_highrise_2209',
      bing_webmaster_site_url: 'https://highrisechimney.com',
      clarity_project_id: 'ms_clarity_hr_881',
      brightlocal_location_id: 'bl_highrise_01',
    },
  },
  {
    id: 'c2d3e4f5-a6b7-8901-bcde-f23456789012',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    name: 'Apex Dental Group',
    is_certified: true,
    mappings: {
      gmb_account_id: 'gmb_apexdental_01',
      ga4_property_id: 'ga4_apexdental_1029',
      clarity_project_id: 'ms_clarity_apex_441',
    },
  },
  {
    id: 'd3e4f5a6-b7c8-9012-cdef-345678901234',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    name: 'Kelly Hyundai',
    is_certified: true,
    mappings: {
      gmb_account_id: 'gmb_kellyhyundai_01',
      google_ads_id: 'ads_kellyhyundai_4412',
      ga4_property_id: 'ga4_kellyhyundai_9012',
      bing_webmaster_site_url: 'https://kellyhyundai.com',
    },
  },
];

interface ClientContextType {
  activeClient: Client | null;
  availableClients: Client[];
  clients: Client[];
  setActiveClient: (client: Client) => void;
  setActiveClientId: (id: string) => void;
  isLoading: boolean;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
  const [activeClient, setActiveClientState] = useState<Client | null>(CANONICAL_CLIENTS[0]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const savedClientId = typeof window !== 'undefined' ? localStorage.getItem('porchlight_active_client_id') : null;
    if (savedClientId) {
      const match = CANONICAL_CLIENTS.find((c) => c.id === savedClientId);
      if (match) {
        setActiveClientState(match);
      }
    }
  }, []);

  const setActiveClient = (client: Client) => {
    setIsLoading(true);
    setActiveClientState(client);
    if (typeof window !== 'undefined') {
      localStorage.setItem('porchlight_active_client_id', client.id);
    }
    setTimeout(() => setIsLoading(false), 150);
  };

  const setActiveClientId = (id: string) => {
    const match = CANONICAL_CLIENTS.find((c) => c.id === id);
    if (match) {
      setActiveClient(match);
    }
  };

  return (
    <ClientContext.Provider
      value={{
        activeClient,
        availableClients: CANONICAL_CLIENTS,
        clients: CANONICAL_CLIENTS,
        setActiveClient,
        setActiveClientId,
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
