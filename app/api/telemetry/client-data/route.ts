import { NextRequest, NextResponse } from 'next/server';
import { validateClientAccess } from '../../../../lib/auth-guard';
import { evaluateClientDataProvenance } from '../../../../lib/data-certification';

export const dynamic = 'force-dynamic';

/**
 * Helper to sum a numeric column across rows WITHOUT substituting 0 when all rows are null/missing.
 */
function sumNullableMetric(rows: any[], key: string): number | null {
  if (!rows || rows.length === 0) return null;
  let hasValidNumber = false;
  let sum = 0;
  for (const r of rows) {
    const val = r?.[key];
    if (val !== null && val !== undefined && !Number.isNaN(Number(val))) {
      hasValidNumber = true;
      sum += Number(val);
    }
  }
  return hasValidNumber ? Number(sum.toFixed(2)) : null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('clientId');
  const requestedTenantId = searchParams.get('tenantId');

  // CR-011: Require authenticated session AND verified tenant ownership of clientId
  const auth = await validateClientAccess(req, clientId, requestedTenantId);
  if (!auth.authorized || !auth.supabase || !auth.context || !clientId) {
    return auth.errorResponse!;
  }

  const { supabase, context } = auth;

  try {
    const [
      clientRes,
      mappingsRes,
      connsRes,
      dailyMetricsRes,
      platformMetricsRes,
      keywordsRes,
      zipsRes,
      aiRecommendationsRes,
    ] = await Promise.all([
      supabase
        .from('clients')
        .select(
          'id, tenant_id, name, domain, address, store_code, is_certified, data_certification_status'
        )
        .eq('id', clientId)
        .eq('tenant_id', context.tenantId)
        .single(),
      supabase
        .from('account_mappings')
        .select('id, provider, external_account_id, created_at')
        .eq('client_id', clientId),
      supabase
        .from('provider_connections')
        .select('id, provider, status, last_health_check')
        .eq('tenant_id', context.tenantId),
      supabase
        .from('daily_metrics')
        .select('*')
        .eq('client_id', clientId)
        .order('metric_date', { ascending: false }),
      supabase
        .from('daily_platform_metrics')
        .select('*')
        .eq('client_id', clientId)
        .order('sync_date', { ascending: false }),
      supabase
        .from('keyword_rankings')
        .select('*')
        .eq('client_id', clientId)
        .order('search_volume', { ascending: false }),
      supabase
        .from('zip_rankings')
        .select('*')
        .eq('client_id', clientId)
        .order('maps_rank', { ascending: true }),
      supabase
        .from('ai_recommendations')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false }),
    ]);

    // CR-014 Requirement: Never report a successful load when required database queries failed
    const queryErrors = [
      clientRes.error,
      mappingsRes.error,
      connsRes.error,
      dailyMetricsRes.error,
      platformMetricsRes.error,
      keywordsRes.error,
      zipsRes.error,
      aiRecommendationsRes.error,
    ].filter(Boolean);

    if (queryErrors.length > 0 || !clientRes.data) {
      return NextResponse.json(
        {
          success: false,
          error: 'TELEMETRY_DATABASE_QUERY_FAILED',
          message: 'One or more required telemetry queries failed.',
        },
        { status: 500 }
      );
    }

    const dmList = dailyMetricsRes.data || [];
    const dpmList = platformMetricsRes.data || [];
    const kwList = keywordsRes.data || [];
    const zipList = zipsRes.data || [];
    const aiList = aiRecommendationsRes.data || [];
    const mappingsList = mappingsRes.data || [];
    const activeConns = (connsRes.data || []).filter(
      (c: any) => c.status === 'ACTIVE' || c.status === 'CONNECTED' || c.status === 'HEALTHY'
    );

    const allDates = [
      ...dmList.map((r: any) => r.metric_date).filter(Boolean),
      ...dpmList.map((r: any) => r.sync_date).filter(Boolean),
      ...kwList.map((r: any) => r.last_updated).filter(Boolean),
    ]
      .sort()
      .reverse();

    const latestMetricDate = allDates[0] || null;
    const earliestMetricDate = allDates.length > 0 ? allDates[allDates.length - 1] : null;

    // CR-012: Evaluate true data provenance and certification state
    const provenance = evaluateClientDataProvenance({
      dbIsCertifiedFlag: Boolean(clientRes.data.is_certified),
      mappedAccountsCount: mappingsList.length,
      verifiedConnectionsCount: activeConns.length,
      dailyMetricsCount: dmList.length,
      platformMetricsCount: dpmList.length,
      keywordRowsCount: kwList.length,
      latestMetricDate,
    });

    // CR-014: Do not substitute 0 for missing metrics
    const porchlightCalls = sumNullableMetric(dmList, 'porchlight_calls');
    const porchlightDirections = sumNullableMetric(dmList, 'porchlight_directions');
    const porchlightWebsiteClicks = sumNullableMetric(dmList, 'porchlight_website_clicks');
    const totalInteractions =
      porchlightCalls !== null ||
      porchlightDirections !== null ||
      porchlightWebsiteClicks !== null
        ? (porchlightCalls ?? 0) +
          (porchlightDirections ?? 0) +
          (porchlightWebsiteClicks ?? 0)
        : null;

    const gadsSpend = sumNullableMetric(dmList, 'gads_spend');
    const metaSpend = sumNullableMetric(dmList, 'meta_spend');
    const totalAdSpend =
      gadsSpend !== null || metaSpend !== null
        ? Number(((gadsSpend ?? 0) + (metaSpend ?? 0)).toFixed(2))
        : null;

    const gadsConversions = sumNullableMetric(dmList, 'gads_conversions');
    const metaLeads = sumNullableMetric(dmList, 'meta_leads');
    const totalPaidLeads =
      gadsConversions !== null || metaLeads !== null
        ? (gadsConversions ?? 0) + (metaLeads ?? 0)
        : null;

    const ga4Sessions = sumNullableMetric(dmList, 'ga4_sessions');
    const ga4Conversions = sumNullableMetric(dmList, 'ga4_conversions');
    const gscImpressions = sumNullableMetric(dmList, 'gsc_impressions');
    const gscClicks = sumNullableMetric(dmList, 'gsc_clicks');

    const blendedCpl =
      totalAdSpend !== null && totalPaidLeads !== null && totalPaidLeads > 0
        ? Number((totalAdSpend / totalPaidLeads).toFixed(2))
        : null;

    return NextResponse.json({
      success: true,
      clientId,
      tenantId: context.tenantId,
      client: clientRes.data,
      provenance: {
        certificationState: provenance.certificationState,
        isCertified: provenance.isCertified,
        isLiveSyncVerified: provenance.isLiveSyncVerified,
        hasHistoricalData: provenance.hasHistoricalData,
        mappedAccountsCount: mappingsList.length,
        verifiedConnectionsCount: activeConns.length,
        earliestMetricDate,
        latestMetricDate,
        stalenessDays: provenance.stalenessDays,
        reason: provenance.reason,
      },
      kpis: {
        totalInteractions,
        porchlightCalls,
        porchlightDirections,
        porchlightWebsiteClicks,
        ga4Sessions,
        ga4Conversions,
        totalAdSpend,
        gadsSpend,
        metaSpend,
        totalPaidLeads,
        blendedCpl,
        gscImpressions,
        gscClicks,
      },
      dailyMetrics: dmList,
      platformMetrics: dpmList,
      keywords: kwList,
      zips: zipList,
      aiRecommendations: aiList,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'TELEMETRY_QUERY_ERROR',
        message: err.message || 'Unexpected telemetry failure.',
      },
      { status: 500 }
    );
  }
}
