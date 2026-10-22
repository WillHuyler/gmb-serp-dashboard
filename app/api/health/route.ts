import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      {
        status: 'MISCONFIGURED',
        timestamp: new Date().toISOString(),
        response_time_ms: Date.now() - startTime,
        database: { connected: false, latency_ms: null },
        integrations: {
          active_provider_connections: 0,
          mapped_client_resources: 0,
          status: 'CONFIGURATION_REQUIRED',
        },
        ingestion: {
          latest_metric_date: null,
          latest_serp_sync_date: null,
          freshness_state: 'NO_DATA',
        },
      },
      { status: 503 }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const dbStart = Date.now();
    const [
      clientsRes,
      connsRes,
      mappingsRes,
      latestDmRes,
      latestSerpRes,
    ] = await Promise.all([
      supabase.from('clients').select('id', { count: 'exact', head: true }),
      supabase.from('provider_connections').select('provider, status'),
      supabase.from('account_mappings').select('id', { count: 'exact', head: true }),
      supabase
        .from('daily_metrics')
        .select('metric_date')
        .order('metric_date', { ascending: false })
        .limit(1),
      supabase
        .from('gmb_serp_metrics')
        .select('sync_date')
        .order('sync_date', { ascending: false })
        .limit(1),
    ]);
    const dbLatencyMs = Date.now() - dbStart;

    const queryFailed = Boolean(
      clientsRes.error ||
        connsRes.error ||
        mappingsRes.error ||
        latestDmRes.error ||
        latestSerpRes.error
    );

    if (queryFailed) {
      return NextResponse.json(
        {
          status: 'DEGRADED',
          timestamp: new Date().toISOString(),
          response_time_ms: Date.now() - startTime,
          database: { connected: false, latency_ms: dbLatencyMs },
          integrations: { status: 'QUERY_ERROR' },
        },
        { status: 503 }
      );
    }

    const activeConns = (connsRes.data || []).filter(
      (c: any) => c.status === 'ACTIVE' || c.status === 'CONNECTED' || c.status === 'HEALTHY'
    );
    const mappedCount = mappingsRes.count ?? 0;
    const latestMetricDate = latestDmRes.data?.[0]?.metric_date || null;
    const latestSerpDate = latestSerpRes.data?.[0]?.sync_date || null;

    let freshnessState: 'FRESH' | 'STALE_HISTORICAL' | 'NO_INGESTION_RECORDS' =
      'NO_INGESTION_RECORDS';
    const mostRecentDate = [latestMetricDate, latestSerpDate].filter(Boolean).sort().reverse()[0];

    if (mostRecentDate) {
      const ageDays = Math.floor(
        (Date.now() - new Date(mostRecentDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      freshnessState = ageDays <= 7 ? 'FRESH' : 'STALE_HISTORICAL';
    }

    const overallStatus =
      activeConns.length > 0 && mappedCount > 0 && freshnessState === 'FRESH'
        ? 'HEALTHY'
        : 'DEGRADED_UNMAPPED_OR_STALE';

    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      response_time_ms: Date.now() - startTime,
      database: {
        connected: true,
        latency_ms: dbLatencyMs,
      },
      client_portfolio: {
        registered_clients: clientsRes.count ?? 0,
        mapped_resources: mappedCount,
      },
      integrations: {
        active_provider_connections: activeConns.length,
        connection_state:
          activeConns.length === 0
            ? 'NO_ACTIVE_PROVIDER_CONNECTIONS'
            : mappedCount === 0
            ? 'CONNECTED_UNMAPPED'
            : 'MAPPED',
      },
      ingestion: {
        latest_metric_date: latestMetricDate,
        latest_serp_sync_date: latestSerpDate,
        freshness_state: freshnessState,
      },
    });
  } catch {
    return NextResponse.json(
      {
        status: 'UNHEALTHY',
        timestamp: new Date().toISOString(),
        response_time_ms: Date.now() - startTime,
        database: { connected: false, latency_ms: null },
      },
      { status: 500 }
    );
  }
}
