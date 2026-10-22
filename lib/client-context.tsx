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

// Exact 1:1 mirror of live Supabase public.clients table (9 verified records)
export const AUTHORITATIVE_CLIENT_REGISTRY: ClientProfile[] = [
  {
    id: '98b58332-a79d-47ac-b771-96ecce1f04fc',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    name: 'High Rise Chimney Sweep & Service',
    store_code: '1003001',
    address: 'Delavan, WI, USA',
    domain: 'highrisechimney.com',
    is_certified: true,
    data_certification_status: 'CERTIFIED',
    type: 'REAL',
    service_areas: ['53092', '53097', '53202', '53211', '53217'],
    mappings: {
      gmb_location_id: '1003001',
      brightlocal_location_id: 'bl_highrise_53202',
      gsc_site_url: 'https://highrisechimney.com',
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
    service_areas: ['18360', '18301'],
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
