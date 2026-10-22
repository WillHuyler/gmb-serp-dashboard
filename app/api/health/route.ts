import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!u || !k) {
    return NextResponse.json({ status: 'MISCONFIGURED', timestamp: new Date().toISOString(), database: { connected: false } }, { status: 503 });
  }

  try {
    const supabase = createClient(u, k, { auth: { persistSession: false, autoRefreshToken: false } });
    const dbStart = Date.now();
    const [cRes, connRes, mapRes, extRes, dmRes, serpRes] = await Promise.all([
      supabase.from('clients').select('id', { count: 'exact', head: true }),
      supabase.from('provider_connections').select('provider, status'),
      supabase.from('account_mappings').select('id', { count: 'exact', head: true }).eq('is_confirmed', true),
      supabase.from('external_accounts').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      supabase.from('daily_metrics').select('metric_date').order('metric_date', { ascending: false }).limit(1),
      supabase.from('gmb_serp_metrics').select('sync_date').order('sync_date', { ascending: false }).limit(1),
    ]);
    const latency = Date.now() - dbStart;

    if (cRes.error || connRes.error || mapRes.error || extRes.error || dmRes.error || serpRes.error) {
      return NextResponse.json({ status: 'DEGRADED', timestamp: new Date().toISOString(), database: { connected: false, latency_ms: latency } }, { status: 503 });
    }

    const activeConns = (connRes.data || []).filter((c: any) => c.status === 'ACTIVE' || c.status === 'CONNECTED' || c.status === 'HEALTHY');
    const confirmedMaps = mapRes.count ?? 0;
    const latestDm = dmRes.data?.[0]?.metric_date || null;
    const latestSerp = serpRes.data?.[0]?.sync_date || null;
    const newest = [latestDm, latestSerp].filter(Boolean).sort().reverse()[0] || null;

    let freshness: 'FRESH' | 'STALE_HISTORICAL' | 'NO_INGESTION_RECORDS' = 'NO_INGESTION_RECORDS';
    if (newest) {
      const ageDays = Math.floor((Date.now() - new Date(newest).getTime()) / 86400000);
      freshness = ageDays <= 7 ? 'FRESH' : 'STALE_HISTORICAL';
    }

    const status = (activeConns.length > 0 && confirmedMaps > 0 && freshness === 'FRESH')
      ? 'HEALTHY'
      : 'DEGRADED_UNMAPPED_OR_STALE';

    return NextResponse.json({
      status,
      timestamp: new Date().toISOString(),
      response_time_ms: Date.now() - startTime,
      database: { connected: true, latency_ms: latency },
      client_portfolio: { registered_clients: cRes.count ?? 0, confirmed_mappings: confirmedMaps, discovered_external_accounts: extRes.count ?? 0 },
      integrations: {
        active_provider_connections: activeConns.length,
        connection_state: activeConns.length === 0 ? 'NO_ACTIVE_PROVIDER_CONNECTIONS' : confirmedMaps === 0 ? 'CONNECTED_UNMAPPED' : 'MAPPED',
      },
      ingestion: { latest_metric_date: latestDm, latest_serp_sync_date: latestSerp, freshness_state: freshness },
    });
  } catch {
    return NextResponse.json({ status: 'UNHEALTHY', timestamp: new Date().toISOString(), database: { connected: false } }, { status: 500 });
  }
}
// EOF
