import { NextRequest, NextResponse } from 'next/server';
import { validateClientAccess } from '../../../../lib/auth-guard';
import { evaluateClientDataProvenance, resolveConfirmedClientMappings } from '../../../../lib/data-certification';
import type { ClientProfile } from '../../../../lib/client-context';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const clientId = params.id;
  const auth = await validateClientAccess(req, clientId);
  if (!auth.authorized || !auth.supabase || !auth.context) return auth.errorResponse!;

  try {
    const [rowRes, mapRes, extRes, connRes, dmRes] = await Promise.all([
      auth.supabase.from('clients').select('id, name, store_code, address, domain, tenant_id, is_certified, data_certification_status').eq('id', clientId).single(),
      auth.supabase.from('account_mappings').select('id, tenant_id, client_id, external_account_id, mapping_role, mapping_confidence, is_confirmed, include_in_command_center, created_at').eq('client_id', clientId).eq('tenant_id', auth.context.tenantId),
      auth.supabase.from('external_accounts').select('id, tenant_id, connection_id, provider, external_account_id, descriptive_name, status').eq('tenant_id', auth.context.tenantId),
      auth.supabase.from('provider_connections').select('id, status').eq('tenant_id', auth.context.tenantId),
      auth.supabase.from('daily_metrics').select('metric_date').eq('client_id', clientId).order('metric_date', { ascending: false }).limit(1),
    ]);

    if (rowRes.error || !rowRes.data || mapRes.error || extRes.error || connRes.error || dmRes.error) {
      return NextResponse.json({ success: false, error: 'CLIENT_QUERY_FAILED' }, { status: 500 });
    }

    const row = rowRes.data;
    const resolvedMaps = resolveConfirmedClientMappings(row.id, row.tenant_id, mapRes.data || [], extRes.data || []);
    const activeConns = (connRes.data || []).filter((c: any) => c.status === 'ACTIVE' || c.status === 'CONNECTED' || c.status === 'HEALTHY').length;
    const latestDate = dmRes.data?.[0]?.metric_date || null;

    const prov = evaluateClientDataProvenance({
      dbIsCertifiedFlag: Boolean(row.is_certified),
      mappedAccountsCount: resolvedMaps.length,
      verifiedConnectionsCount: activeConns,
      dailyMetricsCount: (dmRes.data || []).length,
      platformMetricsCount: 0,
      keywordRowsCount: 0,
      latestMetricDate: latestDate,
    });

    const clientProfile: ClientProfile = {
      id: row.id,
      tenant_id: row.tenant_id,
      name: row.name,
      store_code: row.store_code || null,
      address: row.address || null,
      domain: row.domain || null,
      timezone: 'America/New_York',
      currency: 'USD',
      status: prov.isCertified ? 'active' : 'onboarding',
      is_certified: prov.isCertified,
      certification_state: prov.certificationState,
      has_historical_data: prov.hasHistoricalData,
      latest_metric_date: prov.latestMetricDate,
      staleness_days: prov.stalenessDays,
      provenance_reason: prov.reason,
      data_certification_status: row.data_certification_status || 'DATA_REVIEW_REQUIRED',
      type: row.name === 'ABC Motors' ? 'TEST' : 'REAL',
      mapped_resource_count: resolvedMaps.length,
      mapped_accounts_count: resolvedMaps.length,
      verified_providers_count: activeConns,
      service_areas: [],
      mappings: {},
    };

    return NextResponse.json({ success: true, client: clientProfile });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'CLIENT_FETCH_ERROR' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const clientId = params.id;
  const auth = await validateClientAccess(req, clientId);
  if (!auth.authorized || !auth.supabase) return auth.errorResponse!;

  try {
    const body = await req.json();
    const updates: Record<string, any> = {};
    if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim();
    if (body.address !== undefined) updates.address = body.address;
    if (body.domain !== undefined) updates.domain = body.domain;
    if (body.store_code !== undefined) updates.store_code = body.store_code;

    const { data, error } = await auth.supabase.from('clients').update(updates).eq('id', clientId).select().single();
    if (error || !data) return NextResponse.json({ success: false, error: error?.message || 'UPDATE_FAILED' }, { status: 400 });
    return NextResponse.json({ success: true, client: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
// EOF
