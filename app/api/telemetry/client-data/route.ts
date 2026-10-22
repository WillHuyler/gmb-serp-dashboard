import { NextRequest, NextResponse } from 'next/server';
import { validateClientAccess } from '../../../../lib/auth-guard';
import { evaluateClientDataProvenance, resolveConfirmedClientMappings } from '../../../../lib/data-certification';

export const dynamic = 'force-dynamic';

function sumNullableMetric(rows: any[], key: string): number | null {
  if (!rows || !rows.length) return null;
  let hasNum = false;
  let sum = 0;
  for (const r of rows) {
    const v = r?.[key];
    if (v !== null && v !== undefined && !Number.isNaN(Number(v))) {
      hasNum = true;
      sum += Number(v);
    }
  }
  return hasNum ? Number(sum.toFixed(2)) : null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('clientId');
  const requestedTenantId = searchParams.get('tenantId');

  const auth = await validateClientAccess(req, clientId, requestedTenantId);
  if (!auth.authorized || !auth.supabase || !auth.context || !clientId) return auth.errorResponse!;
  const { supabase, context } = auth;

  try {
    const [clientRes, mapRes, extRes, connRes, dmRes, dpmRes, kwRes, zipRes, aiRes] = await Promise.all([
      supabase.from('clients').select('id, tenant_id, name, domain, address, store_code, is_certified, data_certification_status').eq('id', clientId).eq('tenant_id', context.tenantId).single(),
      supabase.from('account_mappings').select('id, tenant_id, client_id, external_account_id, mapping_role, mapping_confidence, is_confirmed, include_in_command_center, created_at').eq('client_id', clientId).eq('tenant_id', context.tenantId),
      supabase.from('external_accounts').select('id, tenant_id, connection_id, provider, external_account_id, descriptive_name, status').eq('tenant_id', context.tenantId),
      supabase.from('provider_connections').select('id, provider, status, last_health_check').eq('tenant_id', context.tenantId),
      supabase.from('daily_metrics').select('*').eq('client_id', clientId).order('metric_date', { ascending: false }),
      supabase.from('daily_platform_metrics').select('*').eq('client_id', clientId).order('sync_date', { ascending: false }),
      supabase.from('keyword_rankings').select('*').eq('client_id', clientId).order('search_volume', { ascending: false }),
      supabase.from('zip_rankings').select('*').eq('client_id', clientId).order('maps_rank', { ascending: true }),
      supabase.from('ai_recommendations').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
    ]);

    const qErr = clientRes.error || mapRes.error || extRes.error || connRes.error || dmRes.error || dpmRes.error || kwRes.error || zipRes.error || aiRes.error;
    if (qErr || !clientRes.data) {
      return NextResponse.json({ success: false, error: 'TELEMETRY_DATABASE_QUERY_FAILED', message: qErr?.message || 'Client missing.' }, { status: 500 });
    }

    const dmList = dmRes.data || [];
    const dpmList = dpmRes.data || [];
    const kwList = kwRes.data || [];
    const zipList = zipRes.data || [];
    const aiList = aiRes.data || [];
    const resolvedMaps = resolveConfirmedClientMappings(clientId, context.tenantId, mapRes.data || [], extRes.data || []);
    const activeConns = (connRes.data || []).filter((c: any) => c.status === 'ACTIVE' || c.status === 'CONNECTED' || c.status === 'HEALTHY');

    const allDates = [
      ...dmList.map((r: any) => r.metric_date).filter(Boolean),
      ...dpmList.map((r: any) => r.sync_date).filter(Boolean),
      ...kwList.map((r: any) => r.last_updated).filter(Boolean),
    ].sort().reverse();

    const latestMetricDate = allDates[0] || null;
    const earliestMetricDate = allDates.length ? allDates[allDates.length - 1] : null;

    const prov = evaluateClientDataProvenance({
      dbIsCertifiedFlag: Boolean(clientRes.data.is_certified),
      mappedAccountsCount: resolvedMaps.length,
      verifiedConnectionsCount: activeConns.length,
      dailyMetricsCount: dmList.length,
      platformMetricsCount: dpmList.length,
      keywordRowsCount: kwList.length,
      latestMetricDate,
    });

    const porchlightCalls = sumNullableMetric(dmList, 'porchlight_calls');
    const porchlightDirections = sumNullableMetric(dmList, 'porchlight_directions');
    const porchlightWebsiteClicks = sumNullableMetric(dmList, 'porchlight_website_clicks');
    const totalInteractions = (porchlightCalls !== null || porchlightDirections !== null || porchlightWebsiteClicks !== null)
      ? (porchlightCalls ?? 0) + (porchlightDirections ?? 0) + (porchlightWebsiteClicks ?? 0)
      : null;

    const gadsSpend = sumNullableMetric(dmList, 'gads_spend');
    const metaSpend = sumNullableMetric(dmList, 'meta_spend');
    const totalAdSpend = (gadsSpend !== null || metaSpend !== null) ? Number(((gadsSpend ?? 0) + (metaSpend ?? 0)).toFixed(2)) : null;

    const gadsConversions = sumNullableMetric(dmList, 'gads_conversions');
    const metaLeads = sumNullableMetric(dmList, 'meta_leads');
    const totalPaidLeads = (gadsConversions !== null || metaLeads !== null) ? (gadsConversions ?? 0) + (metaLeads ?? 0) : null;

    const ga4Sessions = sumNullableMetric(dmList, 'ga4_sessions');
    const ga4Conversions = sumNullableMetric(dmList, 'ga4_conversions');
    const gscImpressions = sumNullableMetric(dmList, 'gsc_impressions');
    const gscClicks = sumNullableMetric(dmList, 'gsc_clicks');
    const blendedCpl = (totalAdSpend !== null && totalPaidLeads !== null && totalPaidLeads > 0) ? Number((totalAdSpend / totalPaidLeads).toFixed(2)) : null;

    return NextResponse.json({
      success: true,
      clientId,
      tenantId: context.tenantId,
      client: clientRes.data,
      mappedAccounts: resolvedMaps,
      provenance: {
        certificationState: prov.certificationState,
        isCertified: prov.isCertified,
        isLiveSyncVerified: prov.isLiveSyncVerified,
        hasHistoricalData: prov.hasHistoricalData,
        mappedAccountsCount: resolvedMaps.length,
        verifiedConnectionsCount: activeConns.length,
        earliestMetricDate,
        latestMetricDate,
        stalenessDays: prov.stalenessDays,
        reason: prov.reason,
      },
      kpis: { totalInteractions, porchlightCalls, porchlightDirections, porchlightWebsiteClicks, ga4Sessions, ga4Conversions, totalAdSpend, gadsSpend, metaSpend, totalPaidLeads, blendedCpl, gscImpressions, gscClicks },
      dailyMetrics: dmList,
      platformMetrics: dpmList,
      keywords: kwList,
      zips: zipList,
      aiRecommendations: aiList,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'TELEMETRY_QUERY_ERROR', message: err.message }, { status: 500 });
  }
}
// EOF
