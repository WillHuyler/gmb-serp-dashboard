import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedSession } from '../../../lib/auth-guard';
import { evaluateClientDataProvenance, resolveConfirmedClientMappings } from '../../../lib/data-certification';
import type { ClientProfile, ClientMappings } from '../../../lib/client-context';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const requestedTenantId = searchParams.get('tenantId');

  const auth = await requireAuthenticatedSession(req, requestedTenantId);
  if (!auth.authorized || !auth.context || !auth.supabase) return auth.errorResponse!;
  const { supabase, context } = auth;

  try {
    const tenantFilter = context.isSuperAdmin && !requestedTenantId ? context.authorizedTenantIds : [context.tenantId];
    const { data: dbClients, error: clientsErr } = await supabase
      .from('clients')
      .select('id, name, store_code, address, created_at, organization_id, tenant_id, data_certification_status, domain, is_certified')
      .in('tenant_id', tenantFilter)
      .order('name', { ascending: true });

    if (clientsErr) {
      return NextResponse.json({ success: false, error: 'CLIENT_QUERY_FAILED', message: clientsErr.message }, { status: 500 });
    }
    const clientIds = (dbClients || []).map((c: any) => c.id);
    if (!clientIds.length) {
      return NextResponse.json({ success: true, source: 'SUPABASE_AUTHENTICATED', clients: [] });
    }

    const [mapRes, extRes, connRes, zipRes, dmRes, dpmRes, kwRes] = await Promise.all([
      supabase.from('account_mappings').select('id, tenant_id, client_id, external_account_id, mapping_role, mapping_confidence, is_confirmed, include_in_command_center, created_at').in('client_id', clientIds).in('tenant_id', tenantFilter),
      supabase.from('external_accounts').select('id, tenant_id, connection_id, provider, external_account_id, descriptive_name, status').in('tenant_id', tenantFilter),
      supabase.from('provider_connections').select('id, tenant_id, provider, status').in('tenant_id', tenantFilter),
      supabase.from('zip_rankings').select('client_id, zip_code').in('client_id', clientIds),
      supabase.from('daily_metrics').select('client_id, metric_date').in('client_id', clientIds),
      supabase.from('daily_platform_metrics').select('client_id, sync_date').in('client_id', clientIds),
      supabase.from('keyword_rankings').select('client_id, last_updated').in('client_id', clientIds),
    ]);

    const qErr = mapRes.error || extRes.error || connRes.error || zipRes.error || dmRes.error || dpmRes.error || kwRes.error;
    if (qErr) {
      return NextResponse.json({ success: false, error: 'PROVENANCE_VERIFICATION_FAILED', message: qErr.message }, { status: 500 });
    }

    const activeConnsByTenant = new Map<string, number>();
    (connRes.data || []).forEach((c: any) => {
      if (c.status === 'ACTIVE' || c.status === 'CONNECTED' || c.status === 'HEALTHY') {
        activeConnsByTenant.set(c.tenant_id, (activeConnsByTenant.get(c.tenant_id) || 0) + 1);
      }
    });

    const zipsByClient = new Map<string, string[]>();
    (zipRes.data || []).forEach((r: any) => {
      if (r.client_id && r.zip_code) {
        const list = zipsByClient.get(r.client_id) || [];
        if (!list.includes(r.zip_code)) list.push(r.zip_code);
        zipsByClient.set(r.client_id, list);
      }
    });

    const groupDates = (rows: any[], key: string) => {
      const m = new Map<string, string[]>();
      (rows || []).forEach((r: any) => {
        const list = m.get(r.client_id) || [];
        if (r[key]) list.push(r[key]);
        m.set(r.client_id, list);
      });
      return m;
    };
    const dmByClient = groupDates(dmRes.data || [], 'metric_date');
    const dpmByClient = groupDates(dpmRes.data || [], 'sync_date');
    const kwByClient = groupDates(kwRes.data || [], 'last_updated');

    const clients: ClientProfile[] = (dbClients || []).map((row: any) => {
      const resolvedMaps = resolveConfirmedClientMappings(row.id, row.tenant_id, mapRes.data || [], extRes.data || []);
      const dmDates = dmByClient.get(row.id) || [];
      const dpmDates = dpmByClient.get(row.id) || [];
      const kwDates = kwByClient.get(row.id) || [];
      const latestMetricDate = [...dmDates, ...dpmDates, ...kwDates].sort().reverse()[0] || null;
      const verifiedConns = activeConnsByTenant.get(row.tenant_id) || 0;

      const prov = evaluateClientDataProvenance({
        dbIsCertifiedFlag: Boolean(row.is_certified),
        mappedAccountsCount: resolvedMaps.length,
        verifiedConnectionsCount: verifiedConns,
        dailyMetricsCount: dmDates.length,
        platformMetricsCount: dpmDates.length,
        keywordRowsCount: kwDates.length,
        latestMetricDate,
      });

      const explicitMappings: ClientMappings = {};
      resolvedMaps.forEach((m) => {
        if (m.provider === 'GOOGLE_ADS') explicitMappings.google_ads_id = m.externalAccountId;
        if (m.provider === 'META_ADS') explicitMappings.meta_act_id = m.externalAccountId;
        if (m.provider === 'GA4') explicitMappings.ga4_property_id = m.externalAccountId;
        if (m.provider === 'GSC') explicitMappings.gsc_site_url = m.externalAccountId;
        if (m.provider === 'GBP' || m.provider === 'GMB') explicitMappings.gmb_location_id = m.externalAccountId;
        if (m.provider === 'BRIGHTLOCAL') explicitMappings.brightlocal_location_id = m.externalAccountId;
      });

      return {
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
        verified_providers_count: verifiedConns,
        service_areas: zipsByClient.get(row.id) || [],
        mappings: explicitMappings,
      };
    });

    return NextResponse.json({ success: true, source: 'SUPABASE_AUTHENTICATED', clients });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'INTERNAL_SERVER_ERROR', message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuthenticatedSession(req);
  if (!auth.authorized || !auth.context || !auth.supabase) return auth.errorResponse!;
  try {
    const body = await req.json();
    const { name, address, domain, storeCode, tenantId } = body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ success: false, error: 'INVALID_CLIENT_NAME' }, { status: 400 });
    }
    if (tenantId && tenantId !== auth.context.tenantId) {
      const tCheck = await requireAuthenticatedSession(req, tenantId);
      if (!tCheck.authorized) return tCheck.errorResponse!;
    }
    const effTenant = tenantId || auth.context.tenantId;
    const { data, error } = await auth.supabase
      .from('clients')
      .insert([{ tenant_id: effTenant, name: name.trim(), address: address || null, domain: domain || null, store_code: storeCode || null, is_certified: false, data_certification_status: 'DATA_REVIEW_REQUIRED' }])
      .select()
      .single();
    if (error || !data) return NextResponse.json({ success: false, error: 'DATABASE_INSERT_FAILED', message: error?.message }, { status: 500 });
    return NextResponse.json({ success: true, client: { ...data, status: 'onboarding', is_certified: false, certification_state: 'UNMAPPED', has_historical_data: false, mapped_resource_count: 0, service_areas: [], mappings: {} } }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
// EOF
