'use client';

import React, { createContext, useContext, useState } from 'react';

export interface ClientProfile {
  id: string;
  tenant_id?: string;
  name: string;
  address?: string;
  is_certified: boolean;
  service_areas: string[];
  mappings: {
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
  };
}

export type Client = ClientProfile;

export const AUTHORITATIVE_CLIENT_REGISTRY: ClientProfile[] = [
  {
    id: 'bf93fef0-fc60-4119-8ea2-68a274984355',
    tenant_id: 'tenant_porchlight_primary_01',
    name: 'High Rise Chimney Sweep & Service',
    address: 'Milwaukee, WI',
    is_certified: true,
    service_areas: ['53202', '53203', '53211', '53217'],
    mappings: {
      google_ads_id: '123-456-7890',
      meta_act_id: 'act_987654321',
      ga4_property_id: '304958612',
      gsc_site_url: 'https://highrisechimney.com',
      gmb_account_id: 'accounts/109283748291',
      gmb_location_id: 'locations/847291048291',
      brightlocal_location_id: 'bl_loc_highrise_53202',
      bing_webmaster_site_url: 'https://highrisechimney.com',
      clarity_project_id: 'clr_highrise_99',
    },
  },
  {
    id: 'd3e4f5a6-b7c8-9012-cdef-345678901234',
    tenant_id: 'tenant_porchlight_primary_01',
    name: 'Kelly Hyundai of Stroudsburg',
    address: '1534 N 9th St, Stroudsburg, PA 18360',
    is_certified: true,
    service_areas: ['18360', '18301', '18302'],
    mappings: {
      google_ads_id: '345-678-9012',
      meta_act_id: 'act_765432109',
      ga4_property_id: '506978834',
      gsc_site_url: 'https://kellyhyundai.com',
      gmb_account_id: 'accounts/109283748291',
      gmb_location_id: 'locations/992817401928',
      brightlocal_location_id: 'bl_loc_kelly_18360',
      bing_webmaster_site_url: 'https://kellyhyundai.com',
      clarity_project_id: 'clr_kelly_101',
    },
  },
  {
    id: 'c2d3e4f5-a6b7-8901-bcde-f23456789012',
    tenant_id: 'tenant_porchlight_primary_01',
    name: 'Apex Dental Group',
    address: 'Beverly Hills, CA',
    is_certified: true,
    service_areas: ['90210', '90211', '90212'],
    mappings: {
      google_ads_id: '234-567-8901',
      meta_act_id: 'act_876543210',
      ga4_property_id: '405968723',
      gsc_site_url: 'https://apexdentalgroup.com',
      gmb_account_id: 'accounts/109283748291',
      gmb_location_id: 'locations/112233445566',
      brightlocal_location_id: 'bl_loc_apex_90210',
      bing_webmaster_site_url: 'https://apexdentalgroup.com',
      clarity_project_id: 'clr_apex_102',
    },
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    tenant_id: 'tenant_porchlight_primary_01',
    name: 'ABC Motors',
    address: 'Atlanta, GA',
    is_certified: false,
    service_areas: ['30301', '30302'],
    mappings: {},
  },
];

export const CANONICAL_CLIENTS = AUTHORITATIVE_CLIENT_REGISTRY;

interface ClientContextType {
  activeClient: ClientProfile | null;
  setActiveClient: (client: ClientProfile) => void;
  setActiveClientId: (id: string) => void;
  clientRegistry: ClientProfile[];
  clients: ClientProfile[];
  availableClients: ClientProfile[];
}

const ClientContext = createContext<ClientContextType>({
  activeClient: AUTHORITATIVE_CLIENT_REGISTRY[0],
  setActiveClient: () => {},
  setActiveClientId: () => {},
  clientRegistry: AUTHORITATIVE_CLIENT_REGISTRY,
  clients: AUTHORITATIVE_CLIENT_REGISTRY,
  availableClients: AUTHORITATIVE_CLIENT_REGISTRY,
});

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [activeClient, setActiveClient] = useState<ClientProfile>(AUTHORITATIVE_CLIENT_REGISTRY[0]);

  const setActiveClientId = (id: string) => {
    const found = AUTHORITATIVE_CLIENT_REGISTRY.find((c) => c.id === id);
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
        clientRegistry: AUTHORITATIVE_CLIENT_REGISTRY,
        clients: AUTHORITATIVE_CLIENT_REGISTRY,
        availableClients: AUTHORITATIVE_CLIENT_REGISTRY,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  return useContext(ClientContext);
}
