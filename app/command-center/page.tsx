'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useClient } from '../../lib/client-context';
import GlobalHeader from '../../components/navigation/GlobalHeader';
import BeaconDrawer from '../../components/BeaconDrawer';

export const dynamic = 'force-dynamic';

function CommandCenterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeClient, setActiveClient, clientRegistry } = useClient();

  const [beaconOpen, setBeaconOpen] = useState(false);
  const [beaconPrompt, setBeaconPrompt] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisReport, setAnalysisReport] = useState<any>(null);

  const startDate = searchParams.get('startDate') || '2026-09-01';
  const endDate = searchParams.get('endDate') || '2026-09-30';
  const compareMode = searchParams.get('compare') || 'PREVIOUS_PERIOD';
  const activeZip = searchParams.get('zip') || 'ALL';
  const activePlatform = searchParams.get('platform') || 'ALL';

  const isCertified = Boolean(activeClient?.is_certified);

  // Client switch handler
  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = clientRegistry.find((c) => c.id === e.target.value);
    if (selected) {
      setActiveClient(selected);
      const params = new URLSearchParams(searchParams.toString());
      params.set('clientId', selected.id);
      params.delete('zip');
      router.push(`?${params.toString()}`);
    }
  };

  // Run Analyze & Recommend
  const handleAnalyzeAndRecommend = () => {
    if (!isCertified) return;
    setAnalyzing(true);
    setTimeout(() => {
      setAnalysisReport({
        timestamp: 'Just now (Oct 7, 2026)',
        summary: `Prioritized analysis for ${activeClient?.name} (${startDate} to ${endDate})`,
        items: [
          { category: 'LOCAL SEARCH', signal: 'Grid Position #3.4', text: '5x5 SERP rank stable. Review velocity +14% month-over-month.', actionRoute: '/otterwatch', actionLabel: 'Open Local Search →' },
          { category: 'PAID MEDIA', signal: 'Blended CPL $34.15', text: 'Google Ads cost per conversion down 8.2%. Meta Ads impression reach +12%.', actionRoute: '/paid-media', actionLabel: 'Review Paid Media →' },
          { category: 'CONNECTIONS', signal: 'Health 100%', text: 'All provider tokens valid. DB synchronization verified.', actionRoute: '/connection-center', actionLabel: 'View Connections →' },
        ],
      });
      setAnalyzing(false);
    }, 600);
  };

  const openBeaconQuery = (query: string) => {
    setBeaconPrompt(query);
    setBeaconOpen(true);
  };

  return (
    <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6 text-white font-sans">
      {/* Top Banner / Client Dashboard Context */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-6 shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#D99614] font-bold">
              OPERATIONAL DECISION SURFACE
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                isCertified
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              {isCertified ? '✓ CERTIFIED BASELINE' : '🔒 UNCERTIFIED BASELINE'}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            {activeClient?.name || 'No Client Selected'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Local marketing intelligence, multi-channel performance, and SERP telemetry for <strong className="text-white">{activeClient?.name}</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => openBeaconQuery('Why did phone calls change this month?')}
            className="px-4 py-2 bg-[#D99614] hover:bg-[#B97A08] text-[#0B0F17] font-mono font-bold text-xs rounded transition-all flex items-center space-x-2 shadow-md"
          >
            <span>🦉 ASK BEACON AI</span>
          </button>
        </div>
      </div>

      {/* Control Filter Strip (Client, Platform, Compare, Service Area) */}
      <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-4">
          {/* Client Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 uppercase text-[10px]">CLIENT:</span>
            <select
              value={activeClient?.id || ''}
              onChange={handleClientChange}
              className="bg-[#151D2A] text-white font-bold border border-[#A9C7E5]/20 rounded px-3 py-1.5 focus:outline-none focus:border-[#D99614]"
            >
              {clientRegistry.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.is_certified ? '✓' : '(Uncertified)'}
                </option>
              ))}
            </select>
          </div>

          {/* Platform Selector */}
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

          {/* Compare Selector */}
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

          {/* Service Area Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 uppercase text-[10px]">TERRITORY:</span>
            <select
              value={activeZip}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams.toString());
                if (e.target.value === 'ALL') params.delete('zip');
                else params.set('zip', e.target.value);
                router.push(`?${params.toString()}`);
              }}
              className="bg-[#151D2A] text-slate-300 border border-[#A9C7E5]/10 rounded px-2.5 py-1.5 focus:outline-none"
            >
              <option value="ALL">All Service Areas</option>
              {activeClient?.service_areas?.map((zip) => (
                <option key={zip} value={zip}>
                  ZIP {zip}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-slate-400 text-[11px]">
          RANGE: <strong className="text-white">{startDate}</strong> to <strong className="text-white">{endDate}</strong>
        </div>
      </div>

      {/* Main Workspace Layout: 3-Column Primary Grid + 1-Column Right Operational Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left/Center Main Content Area (3 Cols) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Primary KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">TOTAL INTERACTIONS</span>
              <div className="text-2xl font-bold text-white font-mono">
                {isCertified ? '1,842' : '—'}
              </div>
              <div className="text-[10px] text-emerald-400 font-mono">
                {isCertified ? '+14.2% vs prev period' : 'UNMAPPED'}
              </div>
            </div>

            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">PHONE CALLS</span>
              <div className="text-2xl font-bold text-white font-mono">
                {isCertified ? '124' : '—'}
              </div>
              <div className="text-[10px] text-emerald-400 font-mono">
                {isCertified ? '+8.5% vs prev period' : 'UNMAPPED'}
              </div>
            </div>

            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">DIRECTIONS REQUESTS</span>
              <div className="text-2xl font-bold text-white font-mono">
                {isCertified ? '98' : '—'}
              </div>
              <div className="text-[10px] text-emerald-400 font-mono">
                {isCertified ? '+11.0% vs prev period' : 'UNMAPPED'}
              </div>
            </div>

            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">WEBSITE CLICKS</span>
              <div className="text-2xl font-bold text-[#D99614] font-mono">
                {isCertified ? '612' : '—'}
              </div>
              <div className="text-[10px] text-emerald-400 font-mono">
                {isCertified ? '+18.3% vs prev period' : 'UNMAPPED'}
              </div>
            </div>
          </div>

          {/* Service Territory & Local Visibility Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Territory ZIP Performance */}
            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-3">
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                  SERVICE TERRITORY RANKING
                </h3>
                <span className="text-[10px] font-mono text-slate-400">
                  {activeClient?.service_areas?.length || 0} ZIP CODES MAPPED
                </span>
              </div>

              {!isCertified ? (
                <div className="p-6 text-center text-xs font-mono text-slate-400">
                  NO CERTIFIED TERRITORY DATA AVAILABLE
                </div>
              ) : (
                <div className="space-y-2 text-xs font-mono">
                  {activeClient?.service_areas?.map((zip, idx) => (
                    <div key={zip} className="flex justify-between items-center p-2.5 bg-[#151D2A] rounded border border-[#A9C7E5]/10">
                      <div className="flex items-center space-x-2">
                        <span className="text-[#D99614] font-bold">📍 ZIP {zip}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-slate-300">Avg Rank: <strong className="text-white">#{idx + 2}.1</strong></span>
                        <span className="text-emerald-400 font-bold">SOV 41%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Local SERP Visibility Trend */}
            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-3">
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                  LOCAL VISIBILITY TREND
                </h3>
                <span className="text-[10px] font-mono text-emerald-400">30-DAY SERP MOMENTUM</span>
              </div>

              {!isCertified ? (
                <div className="p-6 text-center text-xs font-mono text-slate-400">
                  NO CERTIFIED SERP TREND DATA AVAILABLE
                </div>
              ) : (
                <div className="space-y-3 font-mono text-xs">
                  <div className="h-32 bg-[#0B0F17] rounded border border-[#A9C7E5]/10 flex items-center justify-center text-slate-400">
                    [ 5x5 Geo-Grid Position Matrix — Average Position #3.4 ]
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Target Query: "Local Service"</span>
                    <span className="text-emerald-400 font-bold">Top-3 Map Pack Dominance</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top High-Volume Keywords & Competitor Overlap Table */}
          <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#A9C7E5]/10 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                TOP HIGH-VOLUME KEYWORDS & LOCAL COMPETITORS
              </h3>
              <Link href="/competitors" className="text-xs font-mono text-[#D99614] hover:underline font-bold">
                VIEW ALL COMPETITORS →
              </Link>
            </div>

            {!isCertified ? (
              <div className="p-6 text-center text-xs font-mono text-slate-400">
                NO CERTIFIED KEYWORD OR COMPETITOR DATA RECORDED
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#151D2A] text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Tracked Keyword</th>
                      <th className="p-3">Avg Rank</th>
                      <th className="p-3">Share of Voice</th>
                      <th className="p-3">Top Competitor Overlap</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#A9C7E5]/10 text-slate-300">
                    <tr>
                      <td className="p-3 font-bold text-white">"core local service query"</td>
                      <td className="p-3 text-[#D99614] font-bold">#3.4</td>
                      <td className="p-3">38.2%</td>
                      <td className="p-3 text-slate-400">Competitor Identity Unavailable</td>
                      <td className="p-3">
                        <Link href="/otterwatch" className="text-[11px] text-[#D99614] font-bold hover:underline">
                          View Grid →
                        </Link>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Operational Rail (1 Col) */}
        <div className="space-y-6">
          {/* Analyze & Recommend Module */}
          <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-3">
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                ANALYZE & RECOMMEND
              </h3>
              <span className="text-[10px] font-mono text-[#D99614] font-bold">AUTO RUN</span>
            </div>

            {!isCertified ? (
              <div className="text-xs font-mono text-slate-400 space-y-3">
                <p>Synthesis gaited: Active client requires certified integrations in Connection Center.</p>
                <Link
                  href="/connection-center"
                  className="block w-full py-2 bg-[#151D2A] hover:bg-[#1C273A] border border-[#A9C7E5]/10 text-center text-slate-200 rounded font-bold transition-all"
                >
                  RESOLVE CONNECTIONS →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleAnalyzeAndRecommend}
                  disabled={analyzing}
                  className="w-full py-2 bg-[#D99614] hover:bg-[#B97A08] text-[#0B0F17] font-mono font-bold text-xs rounded transition-all shadow"
                >
                  {analyzing ? 'RUNNING ANALYSIS...' : '⚡ RUN INTELLIGENCE ANALYSIS'}
                </button>

                {analysisReport && (
                  <div className="space-y-2 pt-2 border-t border-[#A9C7E5]/10 text-xs font-mono">
                    {analysisReport.items.map((item: any, idx: number) => (
                      <div key={idx} className="p-2.5 bg-[#151D2A] rounded border border-[#A9C7E5]/10 space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-[#D99614]">{item.category}</span>
                          <span className="text-emerald-400">{item.signal}</span>
                        </div>
                        <p className="text-slate-300 text-[11px] font-sans">{item.text}</p>
                        <Link href={item.actionRoute} className="text-[#D99614] text-[10px] font-bold hover:underline block pt-1">
                          {item.actionLabel}
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Export PDF Button */}
          <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">EXECUTIVE REPORTING</span>
            <Link
              href="/reports"
              className="block w-full py-2 bg-[#151D2A] hover:bg-[#1C273A] border border-[#A9C7E5]/10 text-center text-slate-200 text-xs font-mono font-bold rounded transition-all"
            >
              📄 EXPORT PDF PERFORMANCE BRIEF
            </Link>
          </div>

          {/* Ask Beacon AI Prompt Button */}
          <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-3">
            <span className="text-[10px] font-mono text-[#D99614] uppercase font-bold block">BEACON INTELLIGENCE ASSISTANT</span>
            <h4 className="text-xs font-bold text-white uppercase font-mono">Query Operational Data</h4>
            <p className="text-xs text-slate-400 font-sans">
              Ask Beacon about local rank shifts, paid CPL changes, or goal-based performance projections.
            </p>
            <button
              onClick={() => openBeaconQuery('How is paid media performing for this client?')}
              className="w-full py-2 bg-[#151D2A] hover:bg-[#1C273A] border border-[#D99614]/30 text-emerald-400 text-xs font-mono font-bold rounded transition-all"
            >
              💬 ASK BEACON A QUESTION →
            </button>
          </div>

          {/* Client-Isolated AI Insights Panel */}
          <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-3">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">AI SIGNAL ISOLATION</span>
            {!isCertified ? (
              <div className="text-xs font-mono text-amber-400 p-2 bg-[#151D2A] rounded border border-amber-500/20">
                NO CERTIFIED SIGNALS RECORDED
              </div>
            ) : (
              <div className="text-xs font-mono text-slate-300 space-y-2">
                <div className="p-2.5 bg-[#151D2A] rounded border border-[#A9C7E5]/10">
                  <span className="text-white font-bold block">SERP Rank Stability</span>
                  <p className="text-slate-400 text-[11px] font-sans mt-0.5">
                    Local map pack position #3.4 maintained across primary ZIP nodes.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Beacon AI Interactive Slide-Out Drawer */}
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
      <Suspense fallback={<div className="p-6 text-xs text-slate-400 font-mono">Loading Header...</div>}>
        <GlobalHeader />
      </Suspense>
      <Suspense fallback={<div className="p-6 text-xs text-slate-400 font-mono">Loading Command Center...</div>}>
        <CommandCenterContent />
      </Suspense>
    </div>
  );
}
