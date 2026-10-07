'use client';

import React, { createContext, useContext, useState } from 'react';

export interface ClientProfile {
  id: string;
  tenant_id?: string;
  name: string;
  is_certified: boolean;
  service_areas: string[];
  mappings: {
    google_ads_id?: string;
    meta_act_id?: string;
    ga4_property_id?: string;
    gsc_site_url?: string;
    gmb_account_id?: string;
    brightlocal_location_id?: string;
    bing_webmaster_site_url?: string;
    clarity_project_id?: string;
  };
}

export const AUTHORITATIVE_CLIENT_REGISTRY: ClientProfile[] = [
  {
    id: 'bf93fef0-fc60-4119-8ea2-68a274984355',
    tenant_id: 'tenant_porchlight_primary_01',
    name: 'High Rise Chimney Sweep',
    is_certified: true,
    service_areas: ['53202', '53203', '53211', '53217'],
    mappings: {
      google_ads_id: '123-456-7890',
      meta_act_id: 'act_987654321',
      ga4_property_id: '304958612',
      gsc_site_url: 'https://highrisechimney.com',
      gmb_account_id: 'gmb_hr_sweep_01',
      brightlocal_location_id: 'bl_loc_highrise_53202',
      bing_webmaster_site_url: 'https://highrisechimney.com',
      clarity_project_id: 'clr_highrise_99',
    },
  },
  {
    id: 'c2d3e4f5-a6b7-8901-bcde-f23456789012',
    tenant_id: 'tenant_porchlight_primary_01',
    name: 'Apex Dental Group',
    is_certified: true,
    service_areas: ['90210', '90211', '90212'],
    mappings: {
      google_ads_id: '234-567-8901',
      meta_act_id: 'act_876543210',
      ga4_property_id: '405968723',
      gsc_site_url: 'https://apexdentalgroup.com',
      gmb_account_id: 'gmb_apex_dental_02',
      brightlocal_location_id: 'bl_loc_apex_90210',
    },
  },
  {
    id: 'd3e4f5a6-b7c8-9012-cdef-345678901234',
    tenant_id: 'tenant_porchlight_primary_01',
    name: 'Kelly Hyundai',
    is_certified: true,
    service_areas: ['18015', '18017', '18018'],
    mappings: {
      google_ads_id: '345-678-9012',
      meta_act_id: 'act_765432109',
      ga4_property_id: '506978834',
      gsc_site_url: 'https://kellyhyundai.com',
      gmb_account_id: 'gmb_kelly_hyundai_03',
      brightlocal_location_id: 'bl_loc_kelly_18015',
    },
  },
  {
    id: 'e4f5a6b7-c8d9-0123-def0-456789012345',
    tenant_id: 'tenant_porchlight_primary_01',
    name: 'DIMG Digital Marketing Group',
    is_certified: true,
    service_areas: ['10001', '10002', '10003'],
    mappings: {
      google_ads_id: '456-789-0123',
      meta_act_id: 'act_654321098',
      ga4_property_id: '607989945',
      gsc_site_url: 'https://dimgmarketing.com',
      gmb_account_id: 'gmb_dimg_group_04',
      brightlocal_location_id: 'bl_loc_dimg_10001',
    },
  },
  {
    id: 'f5a6b7c8-d9e0-1234-ef01-567890123456',
    tenant_id: 'tenant_porchlight_primary_01',
    name: 'FM Local Services',
    is_certified: true,
    service_areas: ['75001', '75002', '75006'],
    mappings: {
      google_ads_id: '567-890-1234',
      meta_act_id: 'act_543210987',
      ga4_property_id: '708990056',
      gsc_site_url: 'https://fmlocalservices.com',
      gmb_account_id: 'gmb_fm_local_05',
      brightlocal_location_id: 'bl_loc_fm_75001',
    },
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    tenant_id: 'tenant_porchlight_primary_01',
    name: 'ABC Motors',
    is_certified: false,
    service_areas: ['30301', '30302'],
    mappings: {},
  },
];

// Backwards-compatible alias for existing API route exports
export const CANONICAL_CLIENTS = AUTHORITATIVE_CLIENT_REGISTRY;

interface ClientContextType {
  activeClient: ClientProfile | null;
  setActiveClient: (client: ClientProfile) => void;
  setActiveClientId: (id: string) => void;
  clientRegistry: ClientProfile[];
  clients: ClientProfile[];
}

const ClientContext = createContext<ClientContextType>({
  activeClient: AUTHORITATIVE_CLIENT_REGISTRY[0],
  setActiveClient: () => {},
  setActiveClientId: () => {},
  clientRegistry: AUTHORITATIVE_CLIENT_REGISTRY,
  clients: AUTHORITATIVE_CLIENT_REGISTRY,
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
      }}
    >
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  return useContext(ClientContext);
}
