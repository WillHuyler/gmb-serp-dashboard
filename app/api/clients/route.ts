import { NextRequest, NextResponse } from 'next/server';
import { resolveAuthenticatedContext } from '../../../lib/auth-guard';
import {
  createServiceRoleSupabaseClient,
  createUserScopedSupabaseClient,
  extractAccessToken,
} from '../../../lib/supabase/auth-server';
import { ClientProfile, ClientProfileMappings } from '../../../lib/client-context';

export const dynamic = 'force-dynamic';

function getDbClient(req: NextRequest) {
  try {
    return createServiceRoleSupabaseClient();
  } catch {
    const token = extractAccessToken(req)!;
    return createUserScopedSupabaseClient(token);
  }
}

/**
 * Normalizes a raw public.clients row and its associated account_mappings rows
 * into the canonical ClientProfile shape. Never marks a client certified unless
 * both client.is_certified is true AND at least one valid account mapping exists.
 */
export function normalizeClientRow(
  row: Record<string, any>,
  mappingsRows: Record<string, any>[] = []
): ClientProfile {
  const existingMappings: ClientProfileMappings =
    row.mappings && typeof row.mappings === 'object' ? { ...row.mappings } : {};

  for (const m of mappingsRows) {
    const provider = String(m.provider || m.provider_type || '').toLowerCase();
    const externalId = m.external_account_id || m.provider_account_id || m.resource_id;
    if (!externalId) continue;

    if (provider === 'google_ads') existingMappings.google_ads_id = externalId;
    if (provider === 'meta_ads' || provider === 'meta') existingMappings.meta_act_id = externalId;
    if (provider === 'ga4') existingMappings.ga4_property_id = externalId;
    if (provider === 'gsc') existingMappings.gsc_site_url = externalId;
    if (provider === 'gmb' || provider === 'gbp') {
      existingMappings.gmb_location_id = m.location_id || externalId;
      existingMappings.gmb_account_id = m.account_id || externalId;
    }
    if (provider === 'brightlocal') existingMappings.brightlocal_location_id = externalId;
    if (provider === 'serpapi') existingMappings.serpapi_location_key = externalId;
    if (provider === 'bing_webmaster') existingMappings.bing_webmaster_site_url = externalId;
    if (provider === 'clarity') existingMappings.clarity_project_id = externalId;
  }

  const mappedKeysCount = Object.values(existingMappings).filter(
    (v) => typeof v === 'string' && v.trim() !== ''
  ).length;

  const isCertified = Boolean(row.is_certified === true && mappedKeysCount > 0);

  return {
    id: row.id,
    tenant_id: row.tenant_id,
    name: row.name || 'Unnamed Client',
    address: row.address || row.location_address || '',
    status: row.status || (isCertified ? 'active' : 'onboarding'),
    is_certified: isCertified,
    service_areas: Array.isArray(row.service_areas) ? row.service_areas : [],
    mappings: existingMappings,
    mapped_resource_count: mappedKeysCount,
    last_sync_at: row.last_sync_at || null,
    created_at: row.created_at,
  };
}

/**
 * GET /api/clients
 * Returns all clients belonging to the authenticated user's authorized tenants.
 */
export async function GET(req: NextRequest) {
  const authCheck = await resolveAuthenticatedContext(req);
  if (!authCheck.authorized || !authCheck.context) {
    return authCheck.errorResponse!;
  }

  const { authorizedTenantIds } = authCheck.context;

  try {
    const supabase = getDbClient(req);

    const { data: clientRows, error: clientErr } = await supabase
      .from('clients')
      .select('*')
      .in('tenant_id', authorizedTenantIds)
      .order('name', { ascending: true });

    if (clientErr) {
      return NextResponse.json(
        { success: false, error: { code: 'DB_QUERY_FAILED', message: clientErr.message } },
        { status: 500 }
      );
    }

    const clientIds = (clientRows || []).map((c: any) => c.id);
    let accountMappings: any[] = [];

    if (clientIds.length > 0) {
      const { data: mapRows } = await supabase
        .from('account_mappings')
        .select('*')
        .in('client_id', clientIds);
      accountMappings = mapRows || [];
    }

    const normalized: ClientProfile[] = (clientRows || []).map((row: any) => {
      const clientMaps = accountMappings.filter((m) => m.client_id === row.id);
      return normalizeClientRow(row, clientMaps);
    });

    return NextResponse.json({
      success: true,
      clients: normalized,
      meta: {
        totalCount: normalized.length,
        certifiedCount: normalized.filter((c) => c.is_certified).length,
        authorizedTenantIds,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'CLIENTS_LOAD_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clients
 * Creates a new client in an unmapped, uncertified state under the user's verified tenant.
 * Never trusts an unauthorized tenant_id supplied in the request body.
 */
export async function POST(req: NextRequest) {
  const authCheck = await resolveAuthenticatedContext(req);
  if (!authCheck.authorized || !authCheck.context) {
    return authCheck.errorResponse!;
  }

  const { tenantId: primaryTenantId, authorizedTenantIds } = authCheck.context;

  try {
    const body = await req.json();
    const { name, address, service_areas, requested_tenant_id } = body || {};

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_CLIENT_NAME', message: 'A valid client name (min 2 chars) is required.' },
        },
        { status: 400 }
      );
    }

    // If caller specifies a tenant_id, verify they actually belong to that tenant
    let targetTenantId = primaryTenantId;
    if (requested_tenant_id) {
      if (!authorizedTenantIds.includes(requested_tenant_id)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN_TENANT_ASSIGNMENT',
              message: 'Cannot create a client in an unauthorized tenant.',
            },
          },
          { status: 403 }
        );
      }
      targetTenantId = requested_tenant_id;
    }

    const parsedServiceAreas = Array.isArray(service_areas)
      ? service_areas.map((s) => String(s).trim()).filter(Boolean)
      : [];

    const supabase = getDbClient(req);

    // Insert using verified schema columns; new clients always start unmapped & uncertified
    const insertPayload: Record<string, any> = {
      tenant_id: targetTenantId,
      name: name.trim(),
      is_certified: false,
      service_areas: parsedServiceAreas,
      mappings: {},
    };

    if (address && typeof address === 'string') {
      insertPayload.address = address.trim();
    }

    const { data: inserted, error: insertErr } = await supabase
      .from('clients')
      .insert([insertPayload])
      .select('*')
      .single();

    if (insertErr || !inserted) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'CLIENT_CREATE_FAILED', message: insertErr?.message || 'Failed to insert client.' },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        client: normalizeClientRow(inserted, []),
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'CLIENT_POST_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}
