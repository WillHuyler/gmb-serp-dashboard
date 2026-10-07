'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useClient } from '../../lib/client-context';
import GlobalHeader from '../../components/navigation/GlobalHeader';
import { PlaidInsightsPanel } from '../../components/PlaidInsightsPanel';

export default function CommandCenterPage() {
  const { activeClient } = useClient();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!activeClient) {
      setMetrics(null);
      setLoading(false);
      return;
    }

    async function fetchClientMetrics() {
      try {
        setLoading(true);
        // Query server-side scoped metrics endpoint with active client ID
        const res = await fetch(`/api/telemetry/aggregate?clientId=${activeClient.id}`);
        const data = await res.json();
        if (data.success) {
          setMetrics(data.metrics);
        } else {
          setMetrics(null);
        }
      } catch (err) {
        console.error('Failed to aggregate client metrics:', err);
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    }

    fetchClientMetrics();
  }, [activeClient]);

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col font-sans">
      <GlobalHeader />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Top Operational Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#D99614] font-bold block">
              OPERATIONAL DECISION SURFACE
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
              {activeClient?.name || 'No Client Selected'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Tenant Domain: <span className="text-slate-200 font-mono">{activeClient?.domain || 'unassigned'}</span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span
              className={`text-xs font-mono px-3 py-1 rounded border font-bold ${
                activeClient?.is_certified
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              {activeClient?.is_certified ? '✓ CERTIFIED BASELINE' : '⚠ UNCERTIFIED BASELINE'}
            </span>
            <Link
              href="/connection-center"
              className="px-3 py-1 bg-[#151D2A] hover:bg-[#1C273A] border border-[#A9C7E5]/10 rounded text-xs font-mono font-bold text-slate-300 transition-all"
            >
              INTEGRATIONS →
            </Link>
          </div>
        </div>

        {/* 10-Second Executive KPI Surface */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Ad Spend */}
          <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">TOTAL AD SPEND</span>
            <div className="text-xl font-bold text-white font-mono">
              {!activeClient?.is_certified
                ? '—'
                : loading
                ? '...'
                : metrics?.total_spend
                ? `$${metrics.total_spend.toLocaleString()}`
                : '$0.00'}
            </div>
            <span className="text-[10px] text-slate-500 block">
              {!activeClient?.is_certified ? 'CONNECTION REQUIRED' : 'Google Ads + Meta Ads'}
            </span>
          </div>

          {/* KPI 2: GA4 Sessions */}
          <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">WEB SESSIONS (GA4)</span>
            <div className="text-xl font-bold text-white font-mono">
              {!activeClient?.is_certified
                ? '—'
                : loading
                ? '...'
                : metrics?.ga4_sessions
                ? metrics.ga4_sessions.toLocaleString()
                : '0'}
            </div>
            <span className="text-[10px] text-slate-500 block">
              {!activeClient?.is_certified ? 'PROPERTY UNMAPPED' : 'GA4 Analytics'}
            </span>
          </div>

          {/* KPI 3: GSC Organic Clicks */}
          <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">ORGANIC CLICKS (GSC)</span>
            <div className="text-xl font-bold text-white font-mono">
              {!activeClient?.is_certified
                ? '—'
                : loading
                ? '...'
                : metrics?.gsc_clicks
                ? metrics.gsc_clicks.toLocaleString()
                : '0'}
            </div>
            <span className="text-[10px] text-slate-500 block">
              {!activeClient?.is_certified ? 'PROPERTY UNMAPPED' : 'Search Console'}
            </span>
          </div>

          {/* KPI 4: Local SERP Rank */}
          <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">AVG MAP RANK</span>
            <div className="text-xl font-bold text-[#D99614] font-mono">
              {!activeClient?.mappings?.brightlocal_location_id
                ? '—'
                : loading
                ? '...'
                : metrics?.avg_map_rank
                ? `#${metrics.avg_map_rank}`
                : '—'}
            </div>
            <span className="text-[10px] text-slate-500 block">
              {!activeClient?.mappings?.brightlocal_location_id ? 'OTTERWATCH UNMAPPED' : 'OtterWatch 5x5 Grid'}
            </span>
          </div>
        </div>

        {/* AI Intelligence Ledger */}
        <PlaidInsightsPanel />
      </main>
    </div>
  );
}
