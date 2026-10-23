'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useClient } from '../../lib/client-context';
import GlobalHeader from '../../components/navigation/GlobalHeader';
import BeaconDrawer from '../../components/BeaconDrawer';
import TrustCertificationStrip, {
  DataTrustState,
} from '../../components/design-system/TrustCertificationStrip';
import KpiMetricCard from '../../components/design-system/KpiMetricCard';
import TriPartInsightCard from '../../components/design-system/TriPartInsightCard';
import GeoGridMatrix, {
  buildEmptyGeoGridNodes,
} from '../../components/design-system/GeoGridMatrix';

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
  prev_avg_map_rank?: number | null;
  share_of_voice: number | null;
  primary_keyword?: string | null;
  record_count: number;
  last_ingested_at: string | null;
}

function CommandCenterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeClient, isLoading: clientsLoading } = useClient();

  const [telemetry, setTelemetry] = useState<AggregatedTelemetry | null>(null);
  const [telemetryLoading, setTelemetryLoading] = useState<boolean>(false);
  const [beaconOpen, setBeaconOpen] = useState(false);
  const [beaconPrompt, setBeaconPrompt] = useState('');

  const startDate = searchParams.get('startDate') || '2026-09-01';
  const endDate = searchParams.get('endDate') || '2026-09-30';

  const isCertified = Boolean(activeClient?.is_certified);
  const mappedCount =
    activeClient?.mapped_resource_count ??
    Object.values(activeClient?.mappings || {}).filter(Boolean).length;

  useEffect(() => {
    if (!activeClient?.id) {
      setTelemetry(null);
      return;
    }

    let cancelled = false;
    async function fetchVerifiedTelemetry() {
      setTelemetryLoading(true);
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
          }
        }
      } catch {
        if (!cancelled) setTelemetry(null);
      } finally {
        if (!cancelled) setTelemetryLoading(false);
      }
    }

    fetchVerifiedTelemetry();
    return () => {
      cancelled = true;
    };
  }, [activeClient?.id, startDate, endDate]);

  const hasVerifiedRecords = Boolean(
    isCertified && telemetry && telemetry.record_count > 0
  );

  const trustState: DataTrustState = telemetryLoading
    ? 'SECTION_LOADING'
    : hasVerifiedRecords
    ? 'CERTIFIED_LIVE'
    : mappedCount > 0
    ? 'MAPPED_PENDING_SYNC'
    : 'UNMAPPED_SETUP';

  const openBeaconQuery = (query: string) => {
    setBeaconPrompt(query);
    setBeaconOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col">
      <TrustCertificationStrip
        client={activeClient}
        trustState={trustState}
        lastIngestedAt={telemetry?.last_ingested_at}
        recordCount={telemetry?.record_count || 0}
        reportingPeriod={{ startDate, endDate }}
      />

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6 text-white font-sans">
        {/* Executive Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#111622] border border-[#A9C7E5]/15 rounded-xl p-6">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#D99614] font-bold block">
              EXECUTIVE COMMAND CENTER • MULTI-CHANNEL ATTRIBUTION & LOCAL SERP TELEMETRY
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
              {clientsLoading
                ? 'Loading Client Workspace...'
                : activeClient?.name || 'Select a Client Profile'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {activeClient
                ? `Address: ${activeClient.address || 'Unconfigured'} • Domain: ${
                    activeClient.domain || 'Unconfigured'
                  } • Store Code: ${activeClient.store_code || '—'}`
                : 'Choose an authorized client from the top bar or Client Portfolio.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/otterwatch?clientId=${activeClient?.id || ''}`}
              className="px-3.5 py-2 bg-[#151D2A] hover:bg-[#1C273A] border border-[#A9C7E5]/20 rounded-lg text-xs font-semibold text-slate-200 transition-all"
            >
              5×5 Geo-Grid →
            </Link>
            <button
              onClick={() =>
                openBeaconQuery(
                  `Summarize verified performance and data availability for ${
                    activeClient?.name || 'this client'
                  }.`
                )
              }
              disabled={!activeClient}
              className="px-4 py-2 bg-[#D99614] hover:bg-[#B97A08] disabled:opacity-50 text-[#0B0F17] font-mono font-bold text-xs rounded-lg transition-all shadow"
            >
              ASK BEACON AI
            </button>
          </div>
        </div>

        {/* Tier 2: Provenance-Locked KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiMetricCard
            label="Total GBP Interactions"
            value={telemetry?.total_interactions}
            previousValue={telemetry?.prev_interactions}
            format="number"
            sourceBadge={hasVerifiedRecords ? 'GBP • VERIFIED' : 'UNVERIFIED'}
            provenanceNote={activeClient?.mappings?.gmb_location_id || 'Unmapped GBP'}
            isCertified={hasVerifiedRecords}
            isLoading={telemetryLoading}
          />

          <KpiMetricCard
            label="Verified Phone Calls"
            value={telemetry?.gmb_calls}
            previousValue={telemetry?.prev_gmb_calls}
            format="number"
            sourceBadge={hasVerifiedRecords ? 'GBP • CALLS' : 'UNVERIFIED'}
            provenanceNote="Direct Location Calls"
            isCertified={hasVerifiedRecords}
            isLoading={telemetryLoading}
          />

          <KpiMetricCard
            label="Website Clicks & Directions"
            value={
              typeof telemetry?.gmb_website_clicks === 'number'
                ? telemetry.gmb_website_clicks + (telemetry.gmb_directions || 0)
                : null
            }
            previousValue={
              typeof telemetry?.prev_gmb_website_clicks === 'number'
                ? telemetry.prev_gmb_website_clicks + (telemetry.prev_gmb_directions || 0)
                : null
            }
            format="number"
            sourceBadge={hasVerifiedRecords ? 'GBP • INTENT' : 'UNVERIFIED'}
            provenanceNote="Clicks + Route Requests"
            isCertified={hasVerifiedRecords}
            isLoading={telemetryLoading}
          />

          <KpiMetricCard
            label="OtterWatch Avg Map Rank"
            value={telemetry?.avg_map_rank}
            previousValue={telemetry?.prev_avg_map_rank}
            format="rank"
            invertDeltaPolarity={true}
            sourceBadge={hasVerifiedRecords ? '5×5 SERP GRID' : 'NO SCAN'}
            provenanceNote={
              typeof telemetry?.share_of_voice === 'number'
                ? `SOV: ${telemetry.share_of_voice.toFixed(1)}%`
                : 'No Verified Scan'
            }
            isCertified={hasVerifiedRecords}
            isLoading={telemetryLoading}
            accentHighlight={true}
          />
        </div>

        {/* Tier 3: Tri-Part Executive Insight ("What / Why / Next") */}
        <TriPartInsightCard
          title="Executive Performance & Data Readiness Synthesis"
          category="COMMAND CENTER TRIAGE"
          confidence={hasVerifiedRecords ? 'HIGH' : 'INSUFFICIENT_DATA'}
          sources={hasVerifiedRecords ? ['GBP', 'PAID_MEDIA', 'OTTERWATCH_SERP'] : []}
          whatIsHappening={
            hasVerifiedRecords
              ? `${activeClient?.name} recorded ${
                  telemetry?.record_count || 0
                } verified daily telemetry rows across the ${startDate} to ${endDate} reporting window.`
              : `${
                  activeClient?.name || 'Selected client'
                } is currently in ${trustState} state with 0 verified metric rows for ${startDate} – ${endDate}.`
          }
          whyItIsHappening={
            hasVerifiedRecords
              ? 'Mapped provider accounts have completed verified ingestion and passed certification checks.'
              : mappedCount > 0
              ? `Client has ${mappedCount} mapped provider account(s), but initial telemetry ingestion has not yet been executed for this period.`
              : 'No external provider accounts (GBP, Google Ads, Meta Ads, GA4, BrightLocal) are currently mapped in public.account_mappings.'
          }
          whatToDoNext={
            hasVerifiedRecords
              ? 'Inspect node-by-node 5×5 rank distribution in OtterWatch Local Search or model budget scenarios in Opportunity Lab.'
              : 'Open Connection Center to map verified provider resources and trigger an authenticated ingestion sync.'
          }
          actionLabel={
            hasVerifiedRecords ? 'Open Flagship 5×5 Geo-Grid' : 'Configure Provider Mappings'
          }
          actionHref={
            hasVerifiedRecords
              ? `/otterwatch?clientId=${activeClient?.id || ''}`
              : `/connection-center?clientId=${activeClient?.id || ''}`
          }
        />

        {/* Tier 4: Split Intelligence Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Cols: Channel Provenance & Attribution Ledger */}
          <div className="lg:col-span-7 bg-[#111622] border border-[#A9C7E5]/15 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#A9C7E5]/10 pb-3">
              <div>
                <span className="font-mono text-[10px] uppercase text-[#D99614] font-bold block">
                  MULTI-CHANNEL PROVENANCE MATRIX
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Provider Connection & Telemetry Attribution
                </h3>
              </div>
              <Link
                href={`/connection-center?clientId=${activeClient?.id || ''}`}
                className="font-mono text-xs text-[#D99614] hover:underline"
              >
                Manage Connections →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#A9C7E5]/10 text-slate-400 font-mono text-[10px] uppercase">
                    <th className="py-2.5 px-3">Channel / Provider</th>
                    <th className="py-2.5 px-3">Mapped Resource ID</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Verified Metric</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#A9C7E5]/10 font-sans">
                  {[
                    {
                      name: 'Google Business Profile',
                      resourceId:
                        activeClient?.mappings?.gmb_location_id ||
                        activeClient?.store_code ||
                        null,
                      metric:
                        hasVerifiedRecords && typeof telemetry?.total_interactions === 'number'
                          ? `${telemetry.total_interactions.toLocaleString()} Interactions`
                          : '—',
                    },
                    {
                      name: 'Google Ads (Paid Search)',
                      resourceId: activeClient?.mappings?.google_ads_id || null,
                      metric:
                        hasVerifiedRecords && typeof telemetry?.total_spend === 'number'
                          ? `$${telemetry.total_spend.toLocaleString()} Spend`
                          : '—',
                    },
                    {
                      name: 'Meta Ads (Paid Social)',
                      resourceId: activeClient?.mappings?.meta_act_id || null,
                      metric: '—',
                    },
                    {
                      name: 'Google Analytics 4 (GA4)',
                      resourceId: activeClient?.mappings?.ga4_property_id || null,
                      metric: '—',
                    },
                    {
                      name: 'OtterWatch SERP (BrightLocal / SerpAPI)',
                      resourceId:
                        activeClient?.mappings?.brightlocal_location_id ||
                        activeClient?.mappings?.serpapi_location_key ||
                        null,
                      metric:
                        hasVerifiedRecords && typeof telemetry?.avg_map_rank === 'number'
                          ? `#${telemetry.avg_map_rank.toFixed(1)} Avg Rank`
                          : '—',
                    },
                  ].map((row) => {
                    const isMapped = Boolean(row.resourceId);
                    return (
                      <tr key={row.name} className="hover:bg-[#151D2A]/60">
                        <td className="py-3 px-3 font-medium text-white">{row.name}</td>
                        <td className="py-3 px-3 font-mono text-slate-300">
                          {row.resourceId || 'Not Mapped'}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`font-mono text-[10px] px-2 py-0.5 rounded border font-semibold ${
                              hasVerifiedRecords && isMapped
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                : isMapped
                                ? 'bg-sky-500/10 text-sky-400 border-sky-500/25'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                            }`}
                          >
                            {hasVerifiedRecords && isMapped
                              ? 'CERTIFIED'
                              : isMapped
                              ? 'MAPPED'
                              : 'UNMAPPED'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-white">
                          {row.metric}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right 5 Cols: Compact OtterWatch 5x5 Geo-Grid Preview */}
          <div className="lg:col-span-5">
            <GeoGridMatrix
              clientName={activeClient?.name || 'Selected Client'}
              centerAddress={activeClient?.address}
              keyword={telemetry?.primary_keyword || null}
              scanTimestamp={telemetry?.last_ingested_at || null}
              isVerifiedScan={Boolean(
                hasVerifiedRecords && typeof telemetry?.avg_map_rank === 'number'
              )}
              nodes={buildEmptyGeoGridNodes()}
              compact={true}
            />
          </div>
        </div>

        <BeaconDrawer
          isOpen={beaconOpen}
          onClose={() => setBeaconOpen(false)}
          initialPrompt={beaconPrompt}
        />
      </main>
    </div>
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
