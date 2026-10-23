import { ClientProfile, ClientProfileMappings } from './client-context';

export interface RawClientRow {
  id: string;
  tenant_id: string;
  organization_id?: string | null;
  name: string;
  store_code?: string | null;
  address?: string | null;
  domain?: string | null;
  data_certification_status?: string | null;
  is_certified?: boolean | null;
  created_at?: string | null;
  timezone?: string | null;
  currency?: string | null;
  [key: string]: any;
}

export interface JoinedAccountMapping {
  id: string;
  tenant_id: string;
  client_id: string;
  external_account_id: string;
  mapping_role?: string | null;
  mapping_confidence?: number | null;
  is_confirmed?: boolean | null;
  include_in_command_center?: boolean | null;
  created_at?: string | null;
  external_account?: {
    id?: string;
    provider: string;
    external_account_id: string;
    descriptive_name?: string;
    account_type?: string;
    status?: string;
  } | null;
}

export interface RawIntegrationAccountRow {
  id: string;
  tenant_id: string;
  client_id: string;
  provider: string;
  provider_account_id: string;
  auth_status?: string | null;
  last_sync_at?: string | null;
  last_success_sync_at?: string | null;
  sync_error_message?: string | null;
  created_at?: string | null;
}

function assignProviderMappingKey(
  mappings: ClientProfileMappings,
  providerRaw: string,
  resourceId: string
) {
  const p = providerRaw.toLowerCase().trim();
  if (!resourceId) return;

  if (p === 'google_ads' || p === 'google') {
    mappings.google_ads_id = resourceId;
  } else if (p === 'meta_ads' || p === 'meta') {
    mappings.meta_act_id = resourceId;
  } else if (p === 'ga4') {
    mappings.ga4_property_id = resourceId;
  } else if (p === 'gsc') {
    mappings.gsc_site_url = resourceId;
  } else if (p === 'gmb' || p === 'gbp') {
    mappings.gmb_location_id = resourceId;
    mappings.gmb_account_id = resourceId;
  } else if (p === 'brightlocal') {
    mappings.brightlocal_location_id = resourceId;
  } else if (p === 'serpapi') {
    mappings.serpapi_location_key = resourceId;
  } else if (p === 'bing_webmaster') {
    mappings.bing_webmaster_site_url = resourceId;
  } else if (p === 'clarity') {
    mappings.clarity_project_id = resourceId;
  }
}

/**
 * Normalizes a verified database client row and its relational mappings.
 * Supports 2, 3, or 4 arguments seamlessly so all callers compile cleanly.
 */
export function normalizeVerifiedClientRecord(
  row: RawClientRow,
  joinedMappings: JoinedAccountMapping[] = [],
  thirdArg: RawIntegrationAccountRow[] | boolean = [],
  fourthArg: boolean = false
): ClientProfile {
  const integrationAccounts: RawIntegrationAccountRow[] = Array.isArray(thirdArg)
    ? thirdArg
    : [];
  const hasVerifiedTelemetry: boolean =
    typeof thirdArg === 'boolean' ? thirdArg : Boolean(fourthArg);

  const mappings: ClientProfileMappings = {};

  for (const m of joinedMappings) {
    const ext = m.external_account;
    const providerRaw = String(ext?.provider || '');
    const providerResourceId = ext?.external_account_id || m.external_account_id;
    assignProviderMappingKey(mappings, providerRaw, providerResourceId);
  }

  let latestSyncAt: string | null = null;
  for (const ia of integrationAccounts) {
    assignProviderMappingKey(mappings, ia.provider || '', ia.provider_account_id || '');
    const syncCandidate = ia.last_success_sync_at || ia.last_sync_at;
    if (syncCandidate && (!latestSyncAt || syncCandidate > latestSyncAt)) {
      latestSyncAt = syncCandidate;
    }
  }

  const mappedKeysCount = Object.values(mappings).filter(Boolean).length;

  // CR-003: Certification requires DB is_certified flag + at least 1 valid mapping + verified telemetry
  const isCertified = Boolean(
    row.is_certified === true && mappedKeysCount > 0 && hasVerifiedTelemetry
  );

  return {
    id: row.id,
    tenant_id: row.tenant_id,
    organization_id: row.organization_id || undefined,
    name: row.name || 'Unnamed Client',
    store_code: row.store_code || undefined,
    address: row.address || undefined,
    domain: row.domain || undefined,
    data_certification_status:
      row.data_certification_status || (isCertified ? 'CERTIFIED' : 'UNCERTIFIED'),
    status: isCertified ? 'active' : 'onboarding',
    is_certified: isCertified,
    service_areas: Array.isArray(row.service_areas) ? row.service_areas : [],
    mappings,
    mapped_resource_count: Math.max(joinedMappings.length, mappedKeysCount),
    last_sync_at: latestSyncAt,
    created_at: row.created_at || undefined,
  };
}
