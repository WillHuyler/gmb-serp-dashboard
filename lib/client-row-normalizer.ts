import { ClientProfile, ClientProfileMappings } from './client-context';

export interface RawClientRow {
  id: string;
  tenant_id: string;
  name: string;
  domain?: string | null;
  timezone?: string | null;
  currency?: string | null;
  is_certified?: boolean | null;
  created_at?: string | null;
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
    id: string;
    provider: string;
    external_account_id: string;
    descriptive_name: string;
    account_type?: string;
    status?: string;
  } | null;
}

/**
 * Normalizes a verified public.clients database row and its relational account_mappings
 * + external_accounts into the frontend ClientProfile interface without referencing
 * nonexistent columns on public.clients.
 */
export function normalizeVerifiedClientRecord(
  row: RawClientRow,
  joinedMappings: JoinedAccountMapping[] = [],
  hasVerifiedTelemetry: boolean = false
): ClientProfile {
  const mappings: ClientProfileMappings = {};

  for (const m of joinedMappings) {
    const ext = m.external_account;
    const providerRaw = String(ext?.provider || '').toLowerCase().trim();
    const providerResourceId = ext?.external_account_id || m.external_account_id;

    if (!providerResourceId) continue;

    if (providerRaw === 'google_ads' || providerRaw === 'google') {
      mappings.google_ads_id = providerResourceId;
    } else if (providerRaw === 'meta_ads' || providerRaw === 'meta') {
      mappings.meta_act_id = providerResourceId;
    } else if (providerRaw === 'ga4') {
      mappings.ga4_property_id = providerResourceId;
    } else if (providerRaw === 'gsc') {
      mappings.gsc_site_url = providerResourceId;
    } else if (providerRaw === 'gmb' || providerRaw === 'gbp') {
      mappings.gmb_location_id = providerResourceId;
      mappings.gmb_account_id = providerResourceId;
    } else if (providerRaw === 'brightlocal') {
      mappings.brightlocal_location_id = providerResourceId;
    } else if (providerRaw === 'serpapi') {
      mappings.serpapi_location_key = providerResourceId;
    } else if (providerRaw === 'bing_webmaster') {
      mappings.bing_webmaster_site_url = providerResourceId;
    } else if (providerRaw === 'clarity') {
      mappings.clarity_project_id = providerResourceId;
    }
  }

  const mappedKeysCount = joinedMappings.length;

  // CR-003: Certification requires DB certification flag + valid mapping + verified telemetry
  const isCertified = Boolean(
    row.is_certified === true && mappedKeysCount > 0 && hasVerifiedTelemetry
  );

  return {
    id: row.id,
    tenant_id: row.tenant_id,
    name: row.name || 'Unnamed Client',
    domain: row.domain || undefined,
    timezone: row.timezone || 'America/New_York',
    currency: row.currency || 'USD',
    status: isCertified ? 'active' : 'onboarding',
    is_certified: isCertified,
    service_areas: [], // Populated only from verified location telemetry when available
    mappings,
    mapped_resource_count: mappedKeysCount,
    created_at: row.created_at || undefined,
  };
}
