'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useClient } from '../../lib/client-context';
import GlobalHeader from '../../components/navigation/GlobalHeader';
import BeaconDrawer from '../../components/BeaconDrawer';

export const dynamic = 'force-dynamic';

interface AggregatedTelemetry {
  total_interactions: number | null;
  prev_interactions: number | null;
  gmb_calls: number | null;
  prev_gmb_calls: number | null;
  gmb_directions: number | null;
  prev_gmb_directions: number | null;
  gmb_website_clicks: number | null;
  prev_gmb_website_clicks: number | null;
  total_spend: number | null;
  prev_total_spend: number | null;
  avg_map_rank: number | null;
  share_of_voice: number | null;
  record_count: number;
  last_ingested_at: string | null;
}

function CommandCenterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeClient, setActiveClient, clientRegistry, isLoading: clientsLoading } = useClient();

  const [telemetry, setTelemetry] = useState<AggregatedTelemetry | null>(null);
  const [telemetryLoading, setTelemetryLoading] = useState<boolean>(false);
  const [telemetryError, setTelemetryError] = useState<string | null>(null);

  const [beaconOpen, setBeaconOpen] = useState(false);
  const [beaconPrompt, setBeaconPrompt] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisSignals, setAnalysisSignals] = useState<any[] | null>(null);

  const startDate = searchParams.get('startDate') || '2026-09-01';
  const endDate = searchParams.get('endDate') || '2026-09-30';
  const compareMode = searchParams.get('compare') || 'PREVIOUS_PERIOD';
  const activePlatform = searchParams.get('platform') || 'ALL';

  const isCertified = Boolean(activeClient?.is_certified);

  useEffect(() => {
    if (!activeClient?.id) {
      setTelemetry(null);
      setAnalysisSignals(null);
      return;
    }

    let cancelled = false;
    async function fetchVerifiedTelemetry() {
      setTelemetryLoading(true);
      setTelemetryError(null);
      try {
        const res = await fetch(
          `/api/telemetry/aggregate?clientId=${encodeURIComponent(
            activeClient!.id
          )}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
          { credentials: 'include', headers: { 'Cache-Control': 'no-cache' } }
        );

        const data = await res.json();
        if (!cancelled) {
          if (res.ok && data.success && data.metrics) {
            setTelemetry(data.metrics);
          } else {
            setTelemetry(null);
            if (data?.error?.message) setTelemetryError(data.error.message);
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setTelemetry(null);
          setTelemetryError(err?.message || 'Unable to load verified telemetry.');
        }
      } finally {
        if (!cancelled) setTelemetryLoading(false);
      }
    }

    fetchVerifiedTelemetry();
    return () => {
      cancelled = true;
    };
  }, [activeClient?.id, startDate, endDate]);

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = clientRegistry.find((c) => c.id === e.target.value);
    if (selected) {
      setActiveClient(selected);
      setTelemetry(null);
      setAnalysisSignals(null);
      const params = new URLSearchParams(searchParams.toString());
      params.set('clientId', selected.id);
      router.push(`?${params.toString()}`);
    }
  };

  const handleAnalyzeAndRecommend = async () => {
    if (!activeClient?.id || !isCertified) return;
    setAnalyzing(true);
    try {
      const res = await fetch(
        `/api/ai/recommendations?clientId=${encodeURIComponent(activeClient.id)}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.recommendations)) {
        setAnalysisSignals(data.recommendations);
      } else {
        setAnalysisSignals([]);
      }
    } catch {
      setAnalysisSignals([]);
    } finally {
      setAnalyzing(false);
    }
  };

  const openBeaconQuery = (query: string) => {
    setBeaconPrompt(query);
    setBeaconOpen(true);
  };

  /**
   * CR-004 & CR-P0-01: Never render a percentage comparison unless both
   * current and previous period values are verified numbers and previous > 0.
   */
  const renderVerifiedDelta = (
    current: number | null | undefined,
    previous: number | null | undefined
  ) => {
    if (!isCertified || !telemetry || telemetry.record_count === 0) {
      return <span className="text-slate-500 font-mono">No verified baseline</span>;
    }
    if (
      typeof current !== 'number' ||
      typeof previous !== 'number' ||
      previous <= 0
    ) {
      return <span className="text-slate-400 font-mono">— (Prior period unavailable)</span>;
    }
    const delta = ((current - previous) / previous) * 100;
    const isPositive = delta >= 0;
    return (
      <span className={`font-mono font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
        {isPositive ? `+${delta.toFixed(1)}%` : `${delta.toFixed(1)}%`} vs prior period
      </span>
    );
  };

  const renderMetricValue = (val: number | null | undefined, isCurrency = false) => {
    if (telemetryLoading) return '...';
    if (!isCertified || !telemetry || telemetry.record_count === 0) return '—';
    if (typeof val !== 'number') return '—';
    return isCurrency ? `$${val.toLocaleString()}` : val.toLocaleString();
  };

  const hasVerifiedRecords = Boolean(isCertified && telemetry && telemetry.record_count > 0);

  return (
    <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6 text-white font-sans">
      {/* Top Banner / Client Dashboard Context */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-6 shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono uppercase tracking-widest text-[#D99614] font-bold">
              OPERATIONAL DECISION SURFACE
            </span>
            <span
              className={`text-xs font-mono px-2.5 py-0.5 rounded border font-bold ${
                hasVerifiedRecords
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              {hasVerifiedRecords ? '✓ CERTIFIED TELEMETRY' : '🔒 UNCERTIFIED / PENDING INGESTION'}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            {clientsLoading ? 'Loading Client...' : activeClient?.name || 'No Client Selected'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {activeClient
              ? `Domain: ${activeClient.domain || 'Unconfigured'} • Timezone: ${
                  activeClient.timezone || 'America/New_York'
                } • Mapped Resources: ${activeClient.mapped_resource_count ?? 0}`
              : 'Select or onboard a client in the Client Portfolio to begin.'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/clients"
            className="px-3.5 py-2 bg-[#151D2A] hover:bg-[#1C273A] border border-[#A9C7E5]/15 rounded-lg text-xs font-medium text-slate-200 transition-all"
          >
            Client Portfolio
          </Link>
          <button
            onClick={() => openBeaconQuery('What verified data sources are currently available for this client?')}
            disabled={!activeClient}
            className="px-4 py-2 bg-[#D99614] hover:bg-[#B97A08] disabled:opacity-50 text-[#0B0F17] font-mono font-bold text-xs rounded-lg transition-all shadow-md"
          >
            ASK BEACON AI
          </button>
        </div>
      </div>

      {/* Control Filter Strip */}
      <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 uppercase text-[10px]">CLIENT:</span>
            <select
              value={activeClient?.id || ''}
              onChange={handleClientChange}
              className="bg-[#151D2A] text-white font-bold border border-[#A9C7E5]/20 rounded px-3 py-1.5 focus:outline-none focus:border-[#D99614]"
            >
              {clientRegistry.length === 0 && <option value="">No Authorized Clients</option>}
              {clientRegistry.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.is_certified ? '✓' : '(Uncertified)'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-400 uppercase text-[10px]">PLATFORM:</span>
            <select
              value={activePlatform}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams.toString());
                params.set('platform', e.target.value);
                router.push(`?${params.toString()}`);
              }}
              className="bg-[#151D2A] text-slate-300 border border-[#A9C7E5]/10 rounded px-2.5 py-1.5 focus:outline-none"
            >
              <option value="ALL">All Platforms</option>
              <option value="GOOGLE_ADS">Google Ads</option>
              <option value="META_ADS">Meta Ads</option>
              <option value="GBP">Google Business Profile</option>
              <option value="GA4">GA4 Analytics</option>
              <option value="OTTERWATCH">OtterWatch SERP</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-400 uppercase text-[10px]">COMPARE:</span>
            <select
              value={compareMode}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams.toString());
                params.set('compare', e.target.value);
                router.push(`?${params.toString()}`);
              }}
              className="bg-[#151D2A] text-slate-300 border border-[#A9C7E5]/10 rounded px-2.5 py-1.5 focus:outline-none"
            >
              <option value="PREVIOUS_PERIOD">Previous Period</option>
              <option value="PREVIOUS_MONTH">Previous Month</option>
              <option value="PREVIOUS_QUARTER">Previous Quarter</option>
              <option value="PREVIOUS_YEAR">Previous Year</option>
            </select>
          </div>
        </div>

        <div className="text-slate-400 text-xs">
          REPORTING PERIOD: <strong className="text-white">{startDate}</strong> to{' '}
          <strong className="text-white">{endDate}</strong>
        </div>
      </div>

      {/* Primary KPI Row — Strictly Driven by Verified Database Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-1">
          <span className="text-xs font-mono text-slate-400 uppercase font-bold block">TOTAL INTERACTIONS</span>
          <div className="text-2xl font-bold text-white font-mono">
            {renderMetricValue(telemetry?.total_interactions)}
          </div>
          <div className="text-xs">
            {renderVerifiedDelta(telemetry?.total_interactions, telemetry?.prev_interactions)}
          </div>
        </div>

        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-1">
          <span className="text-xs font-mono text-slate-400 uppercase font-bold block">PHONE CALLS (GBP)</span>
          <div className="text-2xl font-bold text-white font-mono">
            {renderMetricValue(telemetry?.gmb_calls)}
          </div>
          <div className="text-xs">
            {renderVerifiedDelta(telemetry?.gmb_calls, telemetry?.prev_gmb_calls)}
          </div>
        </div>

        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-1">
          <span className="text-xs font-mono text-slate-400 uppercase font-bold block">DIRECTIONS REQUESTS</span>
          <div className="text-2xl font-bold text-white font-mono">
            {renderMetricValue(telemetry?.gmb_directions)}
          </div>
          <div className="text-xs">
            {renderVerifiedDelta(telemetry?.gmb_directions, telemetry?.prev_gmb_directions)}
          </div>
        </div>

        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-1">
          <span className="text-xs font-mono text-slate-400 uppercase font-bold block">WEBSITE CLICKS</span>
          <div className="text-2xl font-bold text-[#D99614] font-mono">
            {renderMetricValue(telemetry?.gmb_website_clicks)}
          </div>
          <div className="text-xs">
            {renderVerifiedDelta(telemetry?.gmb_website_clicks, telemetry?.prev_gmb_website_clicks)}
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {!hasVerifiedRecords ? (
            <div className="bg-[#111622] border border-[#A9C7E5]/15 rounded-xl p-8 text-center space-y-4">
              <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold block">
                DATA PROVENANCE GATE • NO SYNTHETIC METRICS
              </span>
              <h2 className="text-lg font-bold text-white">
                No Verified Provider Telemetry Recorded for Selected Period
              </h2>
              <p className="text-xs text-slate-400 max-w-lg mx-auto">
                {activeClient?.name || 'This client'} currently has{' '}
                <strong className="text-white">{activeClient?.mapped_resource_count ?? 0}</strong> mapped
                provider resources and <strong className="text-white">0</strong> verified metric rows for{' '}
                {startDate} – {endDate}. Map authorized provider accounts in Connection Center and run an
                ingestion sync to populate Command Center analytics.
              </p>
              {telemetryError && (
                <p className="text-xs font-mono text-red-400">Diagnostic: {telemetryError}</p>
              )}
              <div className="pt-2 flex justify-center space-x-3">
                <Link
                  href={`/connection-center?clientId=${activeClient?.id || ''}`}
                  className="px-4 py-2 bg-[#D99614] hover:bg-[#B97A08] text-[#0B0F17] font-semibold text-xs rounded-lg transition-all"
                >
                  Open Connection Center →
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-3">
                  <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                    PAID MEDIA & ACQUISITION SUMMARY
                  </h3>
                  <span className="text-xs font-mono text-emerald-400">
                    {telemetry?.record_count || 0} VERIFIED DAYS
                  </span>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between p-2.5 bg-[#151D2A] rounded border border-[#A9C7E5]/10">
                    <span className="text-slate-400">Verified Ad Spend</span>
                    <span className="text-white font-bold">
                      {renderMetricValue(telemetry?.total_spend, true)}
                    </span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-[#151D2A] rounded border border-[#A9C7E5]/10">
                    <span className="text-slate-400">Last Ingestion Timestamp</span>
                    <span className="text-slate-200">
                      {telemetry?.last_ingested_at || 'Verified DB Record'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-3">
                  <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                    LOCAL SEARCH VISIBILITY
                  </h3>
                  <Link href="/otterwatch" className="text-xs font-mono text-[#D99614] hover:underline">
                    Open OtterWatch →
                  </Link>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between p-2.5 bg-[#151D2A] rounded border border-[#A9C7E5]/10">
                    <span className="text-slate-400">Verified Average Map Rank</span>
                    <span className="text-[#D99614] font-bold">
                      {typeof telemetry?.avg_map_rank === 'number'
                        ? `#${telemetry.avg_map_rank.toFixed(1)}`
                        : '— (No verified scan)'}
                    </span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-[#151D2A] rounded border border-[#A9C7E5]/10">
                    <span className="text-slate-400">Verified Share of Voice</span>
                    <span className="text-white font-bold">
                      {typeof telemetry?.share_of_voice === 'number'
                        ? `${telemetry.share_of_voice.toFixed(1)}%`
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Operational Rail */}
        <div className="space-y-6">
          <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-3">
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                ANALYZE & RECOMMEND
              </h3>
              <span className="text-xs font-mono text-slate-400">VERIFIED SIGNALS</span>
            </div>

            {!hasVerifiedRecords ? (
              <div className="text-xs text-slate-400 space-y-3">
                <p>
                  Intelligence analysis requires mapped provider accounts and verified telemetry records.
                </p>
                <Link
                  href={`/connection-center?clientId=${activeClient?.id || ''}`}
                  className="block w-full py-2 bg-[#151D2A] hover:bg-[#1C273A] border border-[#A9C7E5]/15 text-center text-slate-200 rounded-lg font-medium transition-all"
                >
                  Configure Connections →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleAnalyzeAndRecommend}
                  disabled={analyzing}
                  className="w-full py-2 bg-[#D99614] hover:bg-[#B97A08] text-[#0B0F17] font-mono font-bold text-xs rounded-lg transition-all shadow"
                >
                  {analyzing ? 'QUERYING SIGNALS LEDGER...' : 'LOAD VERIFIED SIGNALS'}
                </button>

                {analysisSignals !== null && (
                  <div className="space-y-2 pt-2 border-t border-[#A9C7E5]/10 text-xs">
                    {analysisSignals.length === 0 ? (
                      <div className="p-3 bg-[#151D2A] rounded text-slate-400 font-mono">
                        No persisted AI signals recorded for this client in public.signals.
                      </div>
                    ) : (
                      analysisSignals.map((sig: any, idx: number) => (
                        <div key={sig.id || idx} className="p-2.5 bg-[#151D2A] rounded border border-[#A9C7E5]/10 space-y-1">
                          <span className="text-[#D99614] font-mono font-bold block">
                            {sig.category || sig.signal_type || 'SIGNAL'}
                          </span>
                          <p className="text-slate-200">{sig.title || sig.summary || sig.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-3">
            <span className="text-xs font-mono text-[#D99614] uppercase font-bold block">
              BEACON INTELLIGENCE ASSISTANT
            </span>
            <p className="text-xs text-slate-400">
              Query verified client telemetry, provider connection status, and outcome readiness.
            </p>
            <button
              onClick={() => openBeaconQuery('What data sources are mapped and verified for this client?')}
              disabled={!activeClient}
              className="w-full py-2 bg-[#151D2A] hover:bg-[#1C273A] border border-[#D99614]/30 text-emerald-400 text-xs font-mono font-bold rounded-lg transition-all"
            >
              OPEN BEACON ASSISTANT →
            </button>
          </div>
        </div>
      </div>

      <BeaconDrawer
        isOpen={beaconOpen}
        onClose={() => setBeaconOpen(false)}
        initialPrompt={beaconPrompt}
      />
    </main>
  );
}

export default function CommandCenterPage() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col font-sans">
      <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading Header...</div>}>
        <GlobalHeader />
      </Suspense>
      <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading Command Center...</div>}>
        <CommandCenterContent />
      </Suspense>
    </div>
  );
}
