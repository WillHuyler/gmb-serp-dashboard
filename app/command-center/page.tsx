'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useClient } from '../../lib/client-context';
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
  const {
    activeClient,
    isLoading: clientsLoading,
    registryState,
    reportingPeriod,
  } = useClient();

  const [telemetry, setTelemetry] = useState<AggregatedTelemetry | null>(null);
  const [telemetryLoading, setTelemetryLoading] = useState<boolean>(false);
  const [beaconOpen, setBeaconOpen] = useState(false);
  const [beaconPrompt, setBeaconPrompt] = useState('');

  const { startDate, endDate } = reportingPeriod;
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
          )}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(
            endDate
          )}`,
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
    <div className="flex-1 flex flex-col bg-[#F4F7FB] text-[#0B1F3A]">
      <TrustCertificationStrip
        client={activeClient}
        trustState={trustState}
        lastIngestedAt={telemetry?.last_ingested_at}
        recordCount={telemetry?.record_count || 0}
        reportingPeriod={{ startDate, endDate }}
      />

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6 font-sans">
        {/* Auth Prompt Banner if Session Cookie Expired/Missing */}
        {registryState === 'AUTH_REQUIRED' && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 flex items-center justify-between gap-4 shadow-sm">
            <div>
              <h2 className="text-sm font-bold text-amber-900">
                Session Authentication Required to Load Your 9 Portfolio Clients
              </h2>
              <p className="text-xs text-amber-800 mt-0.5">
                Your Supabase database has 9 authorized clients ready. Sign in with your administrator credentials to load your active session cookie.
              </p>
            </div>
            <Link
              href="/login"
              className="px-4 py-2 bg-[#0B1F3A] hover:bg-[#16325B] text-white font-bold text-xs rounded-lg shrink-0"
            >
              Sign In Now →
            </Link>
          </div>
        )}

        {/* Executive Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-[#DCE5EF] rounded-xl p-6 shadow-sm">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#D99614] font-bold block">
              EXECUTIVE COMMAND CENTER • MULTI-CHANNEL ATTRIBUTION & LOCAL SERP TELEMETRY
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0B1F3A] mt-1">
              {clientsLoading
                ? 'Loading Client Workspace...'
                : activeClient?.name || 'Select a Client Account'}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              {activeClient
                ? `Location: ${activeClient.address || 'Address pending'} • Domain: ${
                    activeClient.domain || 'Not configured'
                  } • Store Code: ${activeClient.store_code || '—'}`
                : 'Select an authorized client from the top header or Clients Portfolio.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/otterwatch?clientId=${activeClient?.id || ''}`}
              className="px-4 py-2 bg-[#F4F7FB] hover:bg-slate-200 border border-[#DCE5EF] rounded-lg text-xs font-bold text-[#0B1F3A] transition-all"
            >
              Open 5×5 Geo-Grid →
            </Link>
            <button
              type="button"
              onClick={() =>
                openBeaconQuery(
                  `Summarize verified performance and data readiness for ${
                    activeClient?.name || 'this client'
                  }.`
                )
              }
              disabled={!activeClient}
              className="px-4 py-2 bg-[#D99614] hover:bg-[#B87D0E] disabled:opacity-50 text-[#0B1F3A] font-bold text-xs rounded-lg transition-all shadow-sm"
            >
              Ask Beacon AI
            </button>
          </div>
        </div>

        {/* Tier 2: Executive KPI Cards with Multi-Color Top Accents */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiMetricCard
            label="Total GBP Interactions"
            value={telemetry?.total_interactions}
            previousValue={telemetry?.prev_interactions}
            format="number"
            sourceBadge={hasVerifiedRecords ? 'GBP • VERIFIED' : 'AWAITING SYNC'}
            provenanceNote={activeClient?.store_code ? `Store #${activeClient.store_code}` : 'Unmapped GBP'}
            isCertified={hasVerifiedRecords}
            isLoading={telemetryLoading}
            accentColor="blue"
          />

          <KpiMetricCard
            label="Verified Phone Calls"
            value={telemetry?.gmb_calls}
            previousValue={telemetry?.prev_gmb_calls}
            format="number"
            sourceBadge={hasVerifiedRecords ? 'GBP • CALLS' : 'AWAITING SYNC'}
            provenanceNote="Direct Location Calls"
            isCertified={hasVerifiedRecords}
            isLoading={telemetryLoading}
            accentColor="teal"
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
            sourceBadge={hasVerifiedRecords ? 'GBP • INTENT' : 'AWAITING SYNC'}
            provenanceNote="Clicks + Route Requests"
            isCertified={hasVerifiedRecords}
            isLoading={telemetryLoading}
            accentColor="violet"
          />

          <KpiMetricCard
            label="OtterWatch Avg Map Rank"
            value={telemetry?.avg_map_rank}
            previousValue={telemetry?.prev_avg_map_rank}
            format="rank"
            invertDeltaPolarity={true}
            sourceBadge={hasVerifiedRecords ? '5×5 SERP GRID' : 'UNSCANNED'}
            provenanceNote={
              typeof telemetry?.share_of_voice === 'number'
                ? `SOV: ${telemetry.share_of_voice.toFixed(1)}%`
                : 'No Verified Scan'
            }
            isCertified={hasVerifiedRecords}
            isLoading={telemetryLoading}
            accentHighlight={true}
            accentColor="gold"
          />
        </div>

        {/* Tier 3: Split Intelligence Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Cols: Multi-Channel Attribution & Provenance Table */}
          <div className="lg:col-span-7 bg-white border border-[#DCE5EF] rounded-xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#DCE5EF] pb-3.5">
              <div>
                <span className="text-[11px] uppercase text-[#D99614] font-bold block">
                  MULTI-CHANNEL ATTRIBUTION LEDGER
                </span>
                <h3 className="text-base font-bold text-[#0B1F3A] mt-0.5">
                  Provider Connection & Telemetry Readiness
                </h3>
              </div>
              <Link
                href={`/connection-center?clientId=${activeClient?.id || ''}`}
                className="text-xs font-bold text-[#D99614] hover:underline"
              >
                Configure Providers →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#DCE5EF] text-slate-500 font-bold uppercase text-[11px] bg-[#F4F7FB]">
                    <th className="py-3 px-3 rounded-tl-lg">Channel / Integration</th>
                    <th className="py-3 px-3">Resource Identifier</th>
                    <th className="py-3 px-3">State</th>
                    <th className="py-3 px-3 text-right rounded-tr-lg">Verified Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE5EF]">
                  {[
                    {
                      name: 'Google Business Profile',
                      resourceId:
                        activeClient?.mappings?.gmb_location_id ||
                        activeClient?.store_code ||
                        null,
                      metric:
                        hasVerifiedRecords &&
                        typeof telemetry?.total_interactions === 'number'
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
                      name: 'OtterWatch 5×5 Geo-Grid',
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
                      <tr key={row.name} className="hover:bg-[#F4F7FB] transition-colors">
                        <td className="py-3.5 px-3 font-bold text-[#0B1F3A]">{row.name}</td>
                        <td className="py-3.5 px-3 font-mono text-slate-600">
                          {row.resourceId || 'Not Mapped'}
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`font-mono text-[10px] px-2.5 py-0.5 rounded border font-bold ${
                              hasVerifiedRecords && isMapped
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : isMapped
                                ? 'bg-sky-50 text-sky-800 border-sky-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {hasVerifiedRecords && isMapped
                              ? 'CERTIFIED'
                              : isMapped
                              ? 'MAPPED'
                              : 'SETUP REQUIRED'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-bold text-[#0B1F3A]">
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
              clientId={activeClient?.id}
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

        {/* Tier 4: Tri-Part Executive Synthesis */}
        <TriPartInsightCard
          title="Executive Performance & Data Readiness Synthesis"
          category="COMMAND CENTER TRIAGE"
          confidence={hasVerifiedRecords ? 'HIGH' : 'INSUFFICIENT_DATA'}
          sources={hasVerifiedRecords ? ['GBP', 'PAID_MEDIA', 'OTTERWATCH_SERP'] : []}
          whatIsHappening={
            hasVerifiedRecords
              ? `${activeClient?.name} recorded ${
                  telemetry?.record_count || 0
                } verified daily telemetry rows across ${startDate} to ${endDate}.`
              : `${
                  activeClient?.name || 'Selected client'
                } is currently in ${trustState} state with 0 verified metric rows for ${startDate} – ${endDate}.`
          }
          whyItIsHappening={
            hasVerifiedRecords
              ? 'Mapped provider accounts have completed verified ingestion and passed certification checks.'
              : mappedCount > 0
              ? `Client has ${mappedCount} mapped identifier(s), but initial telemetry ingestion has not yet been executed for this period.`
              : 'External provider accounts (GBP, Google Ads, Meta Ads, GA4, BrightLocal) have not yet been bound in Connection Center.'
          }
          whatToDoNext={
            hasVerifiedRecords
              ? 'Inspect node-by-node 5×5 rank distribution in OtterWatch Local Search or model budget scenarios in Opportunity Lab.'
              : 'Open Connection Center to bind discovered provider resources and run an authenticated ingestion sync.'
          }
          actionLabel={
            hasVerifiedRecords ? 'Open 5×5 Geo-Grid' : 'Configure Provider Mappings'
          }
          actionHref={
            hasVerifiedRecords
              ? `/otterwatch?clientId=${activeClient?.id || ''}`
              : `/connection-center?clientId=${activeClient?.id || ''}`
          }
        />

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
    <Suspense
      fallback={
        <div className="p-6 text-xs text-slate-500">Loading Command Center...</div>
      }
    >
      <CommandCenterContent />
    </Suspense>
  );
}
