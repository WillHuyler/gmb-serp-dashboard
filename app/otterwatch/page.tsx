'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useClient } from '../../lib/client-context';
import GlobalHeader from '../../components/navigation/GlobalHeader';
import TrustCertificationStrip, {
  DataTrustState,
} from '../../components/design-system/TrustCertificationStrip';
import KpiMetricCard from '../../components/design-system/KpiMetricCard';
import GeoGridMatrix, {
  buildEmptyGeoGridNodes,
  GeoGridNode,
} from '../../components/design-system/GeoGridMatrix';
import TriPartInsightCard from '../../components/design-system/TriPartInsightCard';

export const dynamic = 'force-dynamic';

interface SerpScanPayload {
  keyword: string | null;
  scanTimestamp: string | null;
  isVerifiedScan: boolean;
  avgGridRank: number | null;
  prevAvgGridRank: number | null;
  shareOfVoice: number | null;
  prevShareOfVoice: number | null;
  top3NodeCount: number | null;
  nodes: GeoGridNode[];
  trackedKeywords: {
    keyword: string;
    avgRank: number | null;
    top3Nodes: number | null;
    lastScanAt: string | null;
  }[];
  competitors: {
    name: string;
    avgRank: number;
    sovPercent: number;
    reviewCount?: number;
  }[];
}

function OtterWatchLocalSearchContent() {
  const { activeClient, isLoading: clientsLoading } = useClient();
  const [scanData, setScanData] = useState<SerpScanPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const isCertified = Boolean(activeClient?.is_certified);
  const mappedCount =
    activeClient?.mapped_resource_count ??
    Object.values(activeClient?.mappings || {}).filter(Boolean).length;

  useEffect(() => {
    if (!activeClient?.id) {
      setScanData(null);
      return;
    }

    let cancelled = false;
    async function loadSerpTelemetry() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/telemetry/aggregate?clientId=${encodeURIComponent(activeClient!.id)}`,
          { credentials: 'include', headers: { 'Cache-Control': 'no-cache' } }
        );
        const data = await res.json();

        if (!cancelled) {
          if (
            res.ok &&
            data.success &&
            data.metrics &&
            data.metrics.record_count > 0 &&
            typeof data.metrics.avg_map_rank === 'number'
          ) {
            setScanData({
              keyword: data.metrics.primary_keyword || null,
              scanTimestamp: data.metrics.last_ingested_at || null,
              isVerifiedScan: true,
              avgGridRank: data.metrics.avg_map_rank,
              prevAvgGridRank: data.metrics.prev_avg_map_rank ?? null,
              shareOfVoice: data.metrics.share_of_voice ?? null,
              prevShareOfVoice: data.metrics.prev_share_of_voice ?? null,
              top3NodeCount: data.metrics.top3_node_count ?? null,
              nodes: Array.isArray(data.metrics.grid_nodes)
                ? data.metrics.grid_nodes
                : buildEmptyGeoGridNodes(),
              trackedKeywords: Array.isArray(data.metrics.tracked_keywords)
                ? data.metrics.tracked_keywords
                : [],
              competitors: Array.isArray(data.metrics.competitors)
                ? data.metrics.competitors
                : [],
            });
          } else {
            setScanData(null);
          }
        }
      } catch {
        if (!cancelled) setScanData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSerpTelemetry();
    return () => {
      cancelled = true;
    };
  }, [activeClient?.id]);

  const isVerifiedScan = Boolean(isCertified && scanData?.isVerifiedScan && scanData?.keyword);

  const trustState: DataTrustState = loading
    ? 'SECTION_LOADING'
    : isVerifiedScan
    ? 'CERTIFIED_LIVE'
    : mappedCount > 0
    ? 'MAPPED_PENDING_SYNC'
    : 'UNMAPPED_SETUP';

  return (
    <div className="flex-1 flex flex-col">
      <TrustCertificationStrip
        client={activeClient}
        trustState={trustState}
        lastIngestedAt={scanData?.scanTimestamp}
        recordCount={isVerifiedScan ? 25 : 0}
      />

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6 text-white font-sans">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#111622] border border-[#A9C7E5]/15 rounded-xl p-6">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-[#D99614] font-bold block">
              FLAGSHIP SERP TELEMETRY ENGINE • 5×5 GEOGRAPHIC COORDINATE MATRIX
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
              OtterWatch Local Search Intelligence
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {clientsLoading
                ? 'Loading client territory...'
                : activeClient
                ? `${activeClient.name} • Location: ${
                    activeClient.address || 'Address pending'
                  } • Store Code: ${activeClient.store_code || 'Unassigned'}`
                : 'Select an authorized client to inspect 5×5 geo-grid rankings.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeClient && (
              <Link
                href={`/connection-center?clientId=${activeClient.id}`}
                className="px-4 py-2 bg-[#151D2A] hover:bg-[#1C273A] border border-[#A9C7E5]/20 rounded-lg text-xs font-semibold text-slate-200 transition-all"
              >
                Configure SERP & GBP Mapping
              </Link>
            )}
          </div>
        </div>

        {/* Tier 2: SERP Telemetry KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiMetricCard
            label="Weighted 5×5 Grid Rank"
            value={scanData?.avgGridRank}
            previousValue={scanData?.prevAvgGridRank}
            format="rank"
            invertDeltaPolarity={true}
            sourceBadge={isVerifiedScan ? 'SERP • VERIFIED' : 'NO SCAN'}
            provenanceNote={scanData?.keyword ? `Query: ${scanData.keyword}` : 'Unconfigured'}
            isCertified={isVerifiedScan}
            isLoading={loading}
            accentHighlight={true}
          />

          <KpiMetricCard
            label="Local Pack Share of Voice"
            value={scanData?.shareOfVoice}
            previousValue={scanData?.prevShareOfVoice}
            format="percent"
            sourceBadge={isVerifiedScan ? '25 NODES' : 'NO SCAN'}
            provenanceNote="Top-3 Map Pack Density"
            isCertified={isVerifiedScan}
            isLoading={loading}
          />

          <KpiMetricCard
            label="Top-3 Map Pack Nodes"
            value={scanData?.top3NodeCount}
            format="number"
            sourceBadge={isVerifiedScan ? 'OUT OF 25' : 'NO SCAN'}
            provenanceNote="Rank #1–#3 Coordinates"
            isCertified={isVerifiedScan}
            isLoading={loading}
          />

          <KpiMetricCard
            label="Tracked Keyword Count"
            value={scanData?.trackedKeywords?.length ?? null}
            format="number"
            sourceBadge="KEYWORD LIBRARY"
            provenanceNote="Active SERP Queries"
            isCertified={isVerifiedScan}
            isLoading={loading}
          />
        </div>

        {/* Tier 3: Flagship 5x5 Geo-Grid Matrix & Node Inspector */}
        <GeoGridMatrix
          clientName={activeClient?.name || 'Selected Client'}
          centerAddress={activeClient?.address}
          keyword={scanData?.keyword || null}
          scanTimestamp={scanData?.scanTimestamp || null}
          isVerifiedScan={isVerifiedScan}
          nodes={scanData?.nodes || []}
        />

        {/* Tier 4: Tri-Part Executive Insight ("What / Why / Next") */}
        <TriPartInsightCard
          title="Local Pack Territory Coverage & Proximity Assessment"
          category="OTTERWATCH GEO-GRID DIAGNOSTIC"
          confidence={isVerifiedScan ? 'HIGH' : 'INSUFFICIENT_DATA'}
          sources={isVerifiedScan ? ['GBP', 'SERP_GRID'] : []}
          whatIsHappening={
            isVerifiedScan
              ? `${activeClient?.name} averages Rank #${scanData?.avgGridRank?.toFixed(
                  1
                )} across the 25-node grid for "${scanData?.keyword}".`
              : `No verified 5×5 geo-grid scan has been recorded for ${
                  activeClient?.name || 'this client'
                }.`
          }
          whyItIsHappening={
            isVerifiedScan
              ? 'Outer-ring coordinate nodes (>2.5 miles from primary address) experience proximity decay against competitors closer to adjacent ZIP centroids.'
              : 'BrightLocal / SerpAPI location resource or tracked keyword library has not yet executed an initial verified scan.'
          }
          whatToDoNext={
            isVerifiedScan
              ? 'Reinforce secondary GBP categories and deploy localized Google Ads location extensions in outer-ring quadrants where rank > #3.'
              : 'Map the verified GBP location and SERP provider in Connection Center to activate automated 5×5 coordinate tracking.'
          }
          actionLabel={isVerifiedScan ? 'Model Impact in Opportunity Lab' : 'Open Connection Center'}
          actionHref={
            isVerifiedScan
              ? `/outcome-lab?clientId=${activeClient?.id || ''}`
              : `/connection-center?clientId=${activeClient?.id || ''}`
          }
        />
      </main>
    </div>
  );
}

export default function OtterWatchPage() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col font-sans">
      <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading Header...</div>}>
        <GlobalHeader />
      </Suspense>
      <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading OtterWatch...</div>}>
        <OtterWatchLocalSearchContent />
      </Suspense>
    </div>
  );
}
