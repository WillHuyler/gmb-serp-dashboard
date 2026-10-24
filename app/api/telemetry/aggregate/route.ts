import { NextRequest, NextResponse } from 'next/server';
import { validateClientAccess } from '../../../../lib/auth-guard';
import { isValidIsoDateString } from '../../../../lib/reporting-period';

export const dynamic = 'force-dynamic';

function sumNullableColumn(rows: any[], col: string): number | null {
  let sum = 0;
  let hasNumeric = false;
  for (const r of rows) {
    const val = r?.[col];
    if (typeof val === 'number' && !Number.isNaN(val)) {
      sum += val;
      hasNumeric = true;
    }
  }
  return hasNumeric ? sum : null;
}

function avgNullableColumn(rows: any[], col: string): number | null {
  let sum = 0;
  let count = 0;
  for (const r of rows) {
    const val = r?.[col];
    if (typeof val === 'number' && !Number.isNaN(val) && val > 0) {
      sum += val;
      count++;
    }
  }
  return count > 0 ? sum / count : null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('clientId');
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');

  const authCheck = await validateClientAccess(req, clientId, false);
  if (!authCheck.authorized || !authCheck.context || !authCheck.supabase) {
    return authCheck.errorResponse!;
  }

  const supabase = authCheck.supabase;
  const startDate = isValidIsoDateString(startDateParam) ? startDateParam : null;
  const endDate = isValidIsoDateString(endDateParam) ? endDateParam : null;

  if ((startDateParam && !startDate) || (endDateParam && !endDate)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_DATE_RANGE',
          message: 'startDate and endDate must be valid YYYY-MM-DD strings.',
        },
      },
      { status: 400 }
    );
  }

  try {
    let metricsQuery = supabase
      .from('daily_client_metrics')
      .select('*')
      .eq('client_id', clientId!);

    if (startDate) metricsQuery = metricsQuery.gte('metric_date', startDate);
    if (endDate) metricsQuery = metricsQuery.lte('metric_date', endDate);

    const [dailyRes, serpRes, keywordsRes] = await Promise.allSettled([
      metricsQuery.order('metric_date', { ascending: false }).limit(365),
      supabase
        .from('gmb_serp_metrics')
        .select('*')
        .eq('client_id', clientId!)
        .order('created_at', { ascending: false })
        .limit(25),
      supabase
        .from('keyword_library')
        .select('id, keyword')
        .eq('tenant_id', authCheck.context.tenantId)
        .limit(50),
    ]);

    const dailyRows =
      dailyRes.status === 'fulfilled' && !dailyRes.value.error
        ? dailyRes.value.data || []
        : [];
    const serpRows =
      serpRes.status === 'fulfilled' && !serpRes.value.error
        ? serpRes.value.data || []
        : [];
    const keywordRows =
      keywordsRes.status === 'fulfilled' && !keywordsRes.value.error
        ? keywordsRes.value.data || []
        : [];

    const recordCount = dailyRows.length + serpRows.length;

    const gmbCalls = sumNullableColumn(dailyRows, 'gmb_calls');
    const gmbDirections = sumNullableColumn(dailyRows, 'gmb_directions');
    const gmbWebsiteClicks = sumNullableColumn(dailyRows, 'gmb_website_clicks');
    const totalInteractions =
      gmbCalls !== null || gmbDirections !== null || gmbWebsiteClicks !== null
        ? (gmbCalls || 0) + (gmbDirections || 0) + (gmbWebsiteClicks || 0)
        : sumNullableColumn(dailyRows, 'total_interactions');

    const totalSpend = sumNullableColumn(dailyRows, 'total_spend');
    const totalConversions = sumNullableColumn(dailyRows, 'total_conversions');
    const avgMapRank =
      avgNullableColumn(serpRows, 'rank') ??
      avgNullableColumn(dailyRows, 'avg_map_rank');

    const latestTimestamp =
      dailyRows[0]?.created_at ||
      dailyRows[0]?.metric_date ||
      serpRows[0]?.created_at ||
      null;

    return NextResponse.json({
      success: true,
      clientId,
      tenantId: authCheck.context.tenantId,
      reportingPeriod: { startDate, endDate },
      metrics: {
        total_interactions: recordCount > 0 ? totalInteractions : null,
        prev_interactions: null,
        gmb_calls: recordCount > 0 ? gmbCalls : null,
        prev_gmb_calls: null,
        gmb_directions: recordCount > 0 ? gmbDirections : null,
        prev_gmb_directions: null,
        gmb_website_clicks: recordCount > 0 ? gmbWebsiteClicks : null,
        prev_gmb_website_clicks: null,
        total_spend: recordCount > 0 ? totalSpend : null,
        prev_total_spend: null,
        total_conversions: recordCount > 0 ? totalConversions : null,
        prev_total_conversions: null,
        avg_map_rank: recordCount > 0 ? avgMapRank : null,
        prev_avg_map_rank: null,
        share_of_voice: null,
        primary_keyword: keywordRows[0]?.keyword || null,
        tracked_keywords: keywordRows.map((k: any) => k.keyword).filter(Boolean),
        record_count: recordCount,
        last_ingested_at: latestTimestamp,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'TELEMETRY_AGGREGATE_ERROR',
          message: err?.message || 'Failed to aggregate verified client telemetry.',
        },
      },
      { status: 500 }
    );
  }
}
