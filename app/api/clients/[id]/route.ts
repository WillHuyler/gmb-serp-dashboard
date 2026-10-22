import { NextRequest, NextResponse } from 'next/server';
import { validateClientAccess } from '../../../../lib/auth-guard';
import { evaluateClientDataProvenance } from '../../../../lib/data-certification';
import type { ClientProfile } from '../../../../lib/client-context';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const clientId = params.id;
  const auth = await validateClientAccess(req, clientId);
  if (!auth.authorized || !auth.supabase || !auth.context) {
    return auth.errorResponse!;
  }

  try {
    const [
      { data: row, error: rowErr },
      { data: mappings, error: mapErr },
      { data: conns, error: connErr },
      { data: dmRows, error: dmErr },
    ] = await Promise.all([
      auth.supabase
        .from('clients')
        .select(
          'id, name, store_code, address, domain, tenant_id, is_certified, data_certification_status'
        )
        .eq('id', clientId)
        .single(),
      auth.supabase
        .from('account_mappings')
        .select('id, provider, external_account_id')
        .eq('client_id', clientId),
      auth.supabase
        .from('provider_connections')
        .select('id, status')
        .eq('tenant_id', auth.context.tenantId),
      auth.supabase
        .from('daily_metrics')
        .select('metric_date')
        .eq('client_id', clientId)
        .order('metric_date', { ascending: false })
        .limit(1),
    ]);

    if (rowErr || !row || mapErr || connErr || dmErr) {
      return NextResponse.json(
        { success: false, error: 'CLIENT_QUERY_FAILED' },
        { status: 500 }
      );
    }

    const activeConns = (conns || []).filter(
      (c: any) => c.status === 'ACTIVE' || c.status === 'CONNECTED' || c.status === 'HEALTHY'
    ).length;

    const latestDate = dmRows?.[0]?.metric_date || null;
    const provenance = evaluateClientDataProvenance({
      dbIsCertifiedFlag: Boolean(row.is_certified),
      mappedAccountsCount: (mappings || []).length,
      verifiedConnectionsCount: activeConns,
      dailyMetricsCount: (dmRows || []).length,
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
      status: provenance.isCertified ? 'active' : 'onboarding',
      is_certified: provenance.isCertified,
      certification_state: provenance.certificationState,
      has_historical_data: provenance.hasHistoricalData,
      latest_metric_date: provenance.latestMetricDate,
      staleness_days: provenance.stalenessDays,
      provenance_reason: provenance.reason,
      data_certification_status: row.data_certification_status || 'DATA_REVIEW_REQUIRED',
      type: row.name === 'ABC Motors' ? 'TEST' : 'REAL',
      service_areas: [],
      mappings: {},
    };

    return NextResponse.json({
      success: true,
      client: clientProfile,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'CLIENT_FETCH_ERROR' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const clientId = params.id;
  const auth = await validateClientAccess(req, clientId);
  if (!auth.authorized || !auth.supabase) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const updates: Record<string, any> = {};

    if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim();
    if (body.address !== undefined) updates.address = body.address;
    if (body.domain !== undefined) updates.domain = body.domain;
    if (body.store_code !== undefined) updates.store_code = body.store_code;
    // CR-012: Prevent arbitrary client-side flipping of is_certified without verified mappings

    const { data, error } = await auth.supabase
      .from('clients')
      .update(updates)
      .eq('id', clientId)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: error?.message || 'UPDATE_FAILED' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      client: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'INTERNAL_SERVER_ERROR' },
      { status: 500 }
    );
  }
}
