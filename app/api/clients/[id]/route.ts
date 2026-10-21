import { NextRequest, NextResponse } from 'next/server';
import { validateClientAccess, getServerSupabaseClient } from '../../../../lib/auth-guard';
import { ClientProfile, ClientProfileMappings } from '../../../../lib/client-context';

export const dynamic = 'force-dynamic';

function normalizeClientRow(
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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const clientId = params.id;
  const authCheck = await validateClientAccess(req, clientId, true);
  if (!authCheck.authorized || !authCheck.context) {
    return authCheck.errorResponse!;
  }

  try {
    const supabase = getServerSupabaseClient(req);
    const [clientRes, mapRes] = await Promise.all([
      supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .eq('tenant_id', authCheck.context.tenantId)
        .single(),
      supabase
        .from('account_mappings')
        .select('*')
        .eq('client_id', clientId),
    ]);

    if (clientRes.error || !clientRes.data) {
      return NextResponse.json(
        { success: false, error: { code: 'CLIENT_NOT_FOUND', message: 'Client record not found.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      client: normalizeClientRow(clientRes.data, mapRes.data || []),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'CLIENT_FETCH_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const clientId = params.id;
  const authCheck = await validateClientAccess(req, clientId, true);
  if (!authCheck.authorized || !authCheck.context) {
    return authCheck.errorResponse!;
  }

  try {
    const body = await req.json();
    const { name, address, service_areas } = body || {};

    const updatePayload: Record<string, any> = {};

    if (typeof name === 'string') {
      if (name.trim().length < 2) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_NAME', message: 'Client name must be at least 2 characters.' } },
          { status: 400 }
        );
      }
      updatePayload.name = name.trim();
    }

    if (typeof address === 'string') {
      updatePayload.address = address.trim();
    }

    if (Array.isArray(service_areas)) {
      updatePayload.service_areas = service_areas.map((z) => String(z).trim()).filter(Boolean);
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'EMPTY_UPDATE', message: 'No valid update fields provided.' } },
        { status: 400 }
      );
    }

    const supabase = getServerSupabaseClient(req);
    const { data: updated, error: updateErr } = await supabase
      .from('clients')
      .update(updatePayload)
      .eq('id', clientId)
      .eq('tenant_id', authCheck.context.tenantId)
      .select('*')
      .single();

    if (updateErr || !updated) {
      return NextResponse.json(
        { success: false, error: { code: 'CLIENT_UPDATE_FAILED', message: updateErr?.message || 'Update failed.' } },
        { status: 500 }
      );
    }

    const { data: mapRows } = await supabase
      .from('account_mappings')
      .select('*')
      .eq('client_id', clientId);

    return NextResponse.json({
      success: true,
      client: normalizeClientRow(updated, mapRows || []),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'CLIENT_PATCH_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}
