import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedSession } from '../../../lib/auth-guard';
import { evaluateClientDataProvenance } from '../../../lib/data-certification';
import type { ClientProfile, ClientMappings } from '../../../lib/client-context';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const requestedTenantId = searchParams.get('tenantId');

  // CR-011: Require valid Supabase Auth session; never fall back to service-role data for anonymous requests
  const auth = await requireAuthenticatedSession(req, requestedTenantId);
  if (!auth.authorized || !auth.context || !auth.supabase) {
    return auth.errorResponse!;
  }

  const { supabase, context } = auth;

  try {
    // Scope client query strictly to the user's authorized tenant IDs
    const tenantFilter = context.isSuperAdmin && !requestedTenantId
      ? context.authorizedTenantIds
      : [context.tenantId];

    const { data: dbClients, error: clientsErr } = await supabase
      .from('clients')
      .select(
        'id, name, store_code, address, created_at, organization_id, tenant_id, data_certification_status, domain, is_certified'
      )
      .in('tenant_id', tenantFilter)
      .order('name', { ascending: true });

    if (clientsErr) {
      return NextResponse.json(
        {
          success: false,
          error: 'CLIENT_QUERY_FAILED',
          message: 'Database error while retrieving authorized clients.',
        },
        { status: 500 }
      );
    }

    const clientIds = (dbClients || []).map((c: any) => c.id);
    if (clientIds.length === 0) {
      return NextResponse.json({
        success: true,
        source: 'SUPABASE_AUTHENTICATED',
        clients: [],
      });
    }

    // Query actual mappings, connections, and telemetry metadata for provenance verification (CR-012)
    const [
      { data: mappingRows, error: mapErr },
      { data: connRows, error: connErr },
      { data: zipRows, error: zipErr },
      { data: dmRows, error: dmErr },
      { data: dpmRows, error: dpmErr },
      { data: kwRows, error: kwErr },
    ] = await Promise.all([
      supabase
        .from('account_mappings')
        .select('client_id, provider, external_account_id')
        .in('client_id', clientIds),
      supabase
        .from('provider_connections')
        .select('id, tenant_id, provider, status')
        .in('tenant_id', tenantFilter),
      supabase
        .from('zip_rankings')
        .select('client_id, zip_code')
        .in('client_id', clientIds),
      supabase
        .from('daily_metrics')
        .select('client_id, metric_date')
        .in('client_id', clientIds),
      supabase
        .from('daily_platform_metrics')
        .select('client_id, sync_date')
        .in('client_id', clientIds),
      supabase
        .from('keyword_rankings')
        .select('client_id, last_updated')
        .in('client_id', clientIds),
    ]);

    if (mapErr || connErr || zipErr || dmErr || dpmErr || kwErr) {
      return NextResponse.json(
        {
          success: false,
          error: 'PROVENANCE_VERIFICATION_FAILED',
          message: 'One or more provenance verification queries failed.',
        },
        { status: 500 }
      );
    }

    const activeConnsByTenant = new Map<string, number>();
    (connRows || []).forEach((c: any) => {
      if (c.status === 'ACTIVE' || c.status === 'CONNECTED' || c.status === 'HEALTHY') {
        activeConnsByTenant.set(
          c.tenant_id,
          (activeConnsByTenant.get(c.tenant_id) || 0) + 1
        );
      }
    });

    const mappingsByClient = new Map<string, any[]>();
    (mappingRows || []).forEach((m: any) => {
      const list = mappingsByClient.get(m.client_id) || [];
      list.push(m);
      mappingsByClient.set(m.client_id, list);
    });

    const zipsByClient = new Map<string, string[]>();
    (zipRows || []).forEach((r: any) => {
      if (r.client_id && r.zip_code) {
        const list = zipsByClient.get(r.client_id) || [];
        if (!list.includes(r.zip_code)) list.push(r.zip_code);
        zipsByClient.set(r.client_id, list);
      }
    });

    const dmByClient = new Map<string, string[]>();
    (dmRows || []).forEach((r: any) => {
      const list = dmByClient.get(r.client_id) || [];
      if (r.metric_date) list.push(r.metric_date);
      dmByClient.set(r.client_id, list);
    });

    const dpmByClient = new Map<string, string[]>();
    (dpmRows || []).forEach((r: any) => {
      const list = dpmByClient.get(r.client_id) || [];
      if (r.sync_date) list.push(r.sync_date);
      dpmByClient.set(r.client_id, list);
    });

    const kwByClient = new Map<string, string[]>();
    (kwRows || []).forEach((r: any) => {
      const list = kwByClient.get(r.client_id) || [];
      if (r.last_updated) list.push(r.last_updated);
      kwByClient.set(r.client_id, list);
    });

    const clients: ClientProfile[] = (dbClients || []).map((row: any) => {
      const clientMappingsRows = mappingsByClient.get(row.id) || [];
      const dmDates = dmByClient.get(row.id) || [];
      const dpmDates = dpmByClient.get(row.id) || [];
      const kwDates = kwByClient.get(row.id) || [];

      const allDates = [...dmDates, ...dpmDates, ...kwDates].sort().reverse();
      const latestMetricDate = allDates[0] || null;
      const verifiedConns = activeConnsByTenant.get(row.tenant_id) || 0;

      const provenance = evaluateClientDataProvenance({
        dbIsCertifiedFlag: Boolean(row.is_certified),
        mappedAccountsCount: clientMappingsRows.length,
        verifiedConnectionsCount: verifiedConns,
        dailyMetricsCount: dmDates.length,
        platformMetricsCount: dpmDates.length,
        keywordRowsCount: kwDates.length,
        latestMetricDate,
      });

      // Construct mappings strictly from verified account_mappings rows (never hardcoded strings)
      const explicitMappings: ClientMappings = {};
      clientMappingsRows.forEach((m: any) => {
        if (m.provider === 'GOOGLE_ADS') explicitMappings.google_ads_id = m.external_account_id;
        if (m.provider === 'META_ADS') explicitMappings.meta_act_id = m.external_account_id;
        if (m.provider === 'GA4') explicitMappings.ga4_property_id = m.external_account_id;
        if (m.provider === 'GSC') explicitMappings.gsc_site_url = m.external_account_id;
        if (m.provider === 'GBP' || m.provider === 'GMB') {
          explicitMappings.gmb_location_id = m.external_account_id;
        }
        if (m.provider === 'BRIGHTLOCAL') {
          explicitMappings.brightlocal_location_id = m.external_account_id;
        }
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
        status: provenance.isCertified ? 'active' : 'onboarding',
        is_certified: provenance.isCertified,
        certification_state: provenance.certificationState,
        has_historical_data: provenance.hasHistoricalData,
        latest_metric_date: provenance.latestMetricDate,
        staleness_days: provenance.stalenessDays,
        provenance_reason: provenance.reason,
        data_certification_status: row.data_certification_status || 'DATA_REVIEW_REQUIRED',
        type: row.name === 'ABC Motors' ? 'TEST' : 'REAL',
        mapped_accounts_count: clientMappingsRows.length,
        verified_providers_count: verifiedConns,
        service_areas: zipsByClient.get(row.id) || [],
        mappings: explicitMappings,
      };
    });

    return NextResponse.json({
      success: true,
      source: 'SUPABASE_AUTHENTICATED',
      clients,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'Unexpected error loading clients.',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuthenticatedSession(req);
  if (!auth.authorized || !auth.context || !auth.supabase) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const { name, address, domain, storeCode, tenantId } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'INVALID_CLIENT_NAME', message: 'Client name is required.' },
        { status: 400 }
      );
    }

    // Enforce server-verified tenant access if caller specifies tenantId
    if (tenantId && tenantId !== auth.context.tenantId) {
      const tenantCheck = await requireAuthenticatedSession(req, tenantId);
      if (!tenantCheck.authorized) {
        return tenantCheck.errorResponse!;
      }
    }

    const effectiveTenantId = tenantId || auth.context.tenantId;

    const { data, error } = await auth.supabase
      .from('clients')
      .insert([
        {
          tenant_id: effectiveTenantId,
          name: name.trim(),
          address: address || null,
          domain: domain || null,
          store_code: storeCode || null,
          is_certified: false,
          data_certification_status: 'DATA_REVIEW_REQUIRED',
        },
      ])
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'DATABASE_INSERT_FAILED', message: error?.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        client: {
          ...data,
          status: 'onboarding',
          is_certified: false,
          certification_state: 'UNMAPPED',
          has_historical_data: false,
          type: 'REAL',
          service_areas: [],
          mappings: {},
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'INTERNAL_SERVER_ERROR' },
      { status: 500 }
    );
  }
}
