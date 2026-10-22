import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('clientId');

  if (!clientId) {
    return NextResponse.json(
      { success: false, error: 'MISSING_CLIENT_ID' },
      { status: 400 }
    );
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'SUPABASE_NOT_CONFIGURED' },
      { status: 503 }
    );
  }

  try {
    const [
      { data: clientRow },
      { data: dailyMetrics },
      { data: platformMetrics },
      { data: keywords },
      { data: zips },
      { data: aiRecommendations },
    ] = await Promise.all([
      supabase
        .from('clients')
        .select('id, name, domain, address, store_code, is_certified, data_certification_status')
        .eq('id', clientId)
        .single(),
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

    const dmList = dailyMetrics || [];
    const dpmList = platformMetrics || [];
    const kwList = keywords || [];
    const zipList = zips || [];
    const aiList = aiRecommendations || [];

    const hasCertifiedTelemetry =
      Boolean(clientRow?.is_certified) &&
      (dmList.length > 0 || dpmList.length > 0 || kwList.length > 0);

    // Aggregate KPI Rollup strictly from client-scoped rows
    const summary = dmList.reduce(
      (acc: any, row: any) => {
        acc.porchlightCalls += Number(row.porchlight_calls || 0);
        acc.porchlightDirections += Number(row.porchlight_directions || 0);
        acc.porchlightWebsiteClicks += Number(row.porchlight_website_clicks || 0);
        acc.ga4Sessions += Number(row.ga4_sessions || 0);
        acc.ga4Users += Number(row.ga4_users || 0);
        acc.ga4Conversions += Number(row.ga4_conversions || 0);
        acc.gadsImpressions += Number(row.gads_impressions || 0);
        acc.gadsClicks += Number(row.gads_clicks || 0);
        acc.gadsSpend += Number(row.gads_spend || 0);
        acc.gadsConversions += Number(row.gads_conversions || 0);
        acc.metaImpressions += Number(row.meta_impressions || 0);
        acc.metaClicks += Number(row.meta_clicks || 0);
        acc.metaSpend += Number(row.meta_spend || 0);
        acc.metaLeads += Number(row.meta_leads || 0);
        acc.gscImpressions += Number(row.gsc_impressions || 0);
        acc.gscClicks += Number(row.gsc_clicks || 0);
        return acc;
      },
      {
        porchlightCalls: 0,
        porchlightDirections: 0,
        porchlightWebsiteClicks: 0,
        ga4Sessions: 0,
        ga4Users: 0,
        ga4Conversions: 0,
        gadsImpressions: 0,
        gadsClicks: 0,
        gadsSpend: 0,
        gadsConversions: 0,
        metaImpressions: 0,
        metaClicks: 0,
        metaSpend: 0,
        metaLeads: 0,
        gscImpressions: 0,
        gscClicks: 0,
      }
    );

    const totalInteractions =
      summary.porchlightCalls +
      summary.porchlightDirections +
      summary.porchlightWebsiteClicks;
    const totalAdSpend = Number((summary.gadsSpend + summary.metaSpend).toFixed(2));
    const totalPaidLeads = summary.gadsConversions + summary.metaLeads;
    const blendedCpl =
      totalPaidLeads > 0 ? Number((totalAdSpend / totalPaidLeads).toFixed(2)) : 0;

    return NextResponse.json({
      success: true,
      clientId,
      client: clientRow || null,
      isCertified: hasCertifiedTelemetry,
      kpis: {
        totalInteractions,
        porchlightCalls: summary.porchlightCalls,
        porchlightDirections: summary.porchlightDirections,
        porchlightWebsiteClicks: summary.porchlightWebsiteClicks,
        ga4Sessions: summary.ga4Sessions,
        ga4Conversions: summary.ga4Conversions,
        totalAdSpend,
        gadsSpend: Number(summary.gadsSpend.toFixed(2)),
        metaSpend: Number(summary.metaSpend.toFixed(2)),
        totalPaidLeads,
        blendedCpl,
        gscImpressions: summary.gscImpressions,
        gscClicks: summary.gscClicks,
      },
      dailyMetrics: dmList,
      platformMetrics: dpmList,
      keywords: kwList,
      zips: zipList,
      aiRecommendations: aiList,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'TELEMETRY_QUERY_ERROR' },
      { status: 500 }
    );
  }
}
