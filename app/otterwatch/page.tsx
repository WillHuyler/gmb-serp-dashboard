'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useClient } from '../../lib/client-context';
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

function OtterWatchLocalSearchContent() {
  const { activeClient, isLoading: clientsLoading, reportingPeriod } = useClient();
  const [scanData, setScanData] = useState<any | null>(null);
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

  const isVerifiedScan = Boolean(
    isCertified && scanData?.isVerifiedScan && scanData?.keyword
  );

  const trustState: DataTrustState = loading
    ? 'SECTION_LOADING'
    : isVerifiedScan
    ? 'CERTIFIED_LIVE'
    : mappedCount > 0
    ? 'MAPPED_PENDING_SYNC'
    : 'UNMAPPED_SETUP';

  return (
    <div className="flex-1 flex flex-col bg-[#F4F7FB] text-[#0B1F3A]">
      <TrustCertificationStrip
        client={activeClient}
        trustState={trustState}
        lastIngestedAt={scanData?.scanTimestamp}
        recordCount={isVerifiedScan ? 25 : 0}
        reportingPeriod={reportingPeriod}
      />

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6 font-sans">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-[#DCE5EF] rounded-xl p-6 shadow-sm">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#D99614] font-bold block">
              FLAGSHIP SERP TELEMETRY ENGINE • 5×5 GEOGRAPHIC COORDINATE MATRIX
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0B1F3A] mt-1">
              OtterWatch Local Search Intelligence
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              {clientsLoading
                ? 'Loading client territory...'
                : activeClient
                ? `${activeClient.name} • Anchor: ${
                    activeClient.address || 'Address pending'
                  } • Store Code: ${activeClient.store_code || 'Unassigned'}`
                : 'Select an authorized client from the top header to inspect 5×5 geo-grid rankings.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeClient && (
              <Link
                href={`/connection-center?clientId=${activeClient.id}`}
                className="px-4 py-2 bg-[#0B1F3A] hover:bg-[#16325B] text-white rounded-lg text-xs font-bold transition-all shadow-sm"
              >
                Configure SERP & GBP Mapping →
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
            sourceBadge={isVerifiedScan ? 'SERP • VERIFIED' : 'UNSCANNED'}
            provenanceNote={scanData?.keyword ? `Query: ${scanData.keyword}` : 'Unconfigured'}
            isCertified={isVerifiedScan}
            isLoading={loading}
            accentHighlight={true}
            accentColor="gold"
          />

          <KpiMetricCard
            label="Local Pack Share of Voice"
            value={scanData?.shareOfVoice}
            previousValue={scanData?.prevShareOfVoice}
            format="percent"
            sourceBadge={isVerifiedScan ? '25 NODES' : 'UNSCANNED'}
            provenanceNote="Top-3 Map Pack Density"
            isCertified={isVerifiedScan}
            isLoading={loading}
            accentColor="blue"
          />

          <KpiMetricCard
            label="Top-3 Map Pack Nodes"
            value={scanData?.top3NodeCount}
            format="number"
            sourceBadge={isVerifiedScan ? 'OUT OF 25' : 'UNSCANNED'}
            provenanceNote="Rank #1–#3 Coordinates"
            isCertified={isVerifiedScan}
            isLoading={loading}
            accentColor="teal"
          />

          <KpiMetricCard
            label="Tracked Keyword Count"
            value={scanData?.trackedKeywords?.length ?? null}
            format="number"
            sourceBadge="KEYWORD LIBRARY"
            provenanceNote="Active SERP Queries"
            isCertified={isVerifiedScan}
            isLoading={loading}
            accentColor="violet"
          />
        </div>

        {/* Tier 3: Flagship 5x5 Geo-Grid Matrix & Node Inspector */}
        <GeoGridMatrix
          clientId={activeClient?.id}
          clientName={activeClient?.name || 'Selected Client'}
          centerAddress={activeClient?.address}
          keyword={scanData?.keyword || null}
          scanTimestamp={scanData?.scanTimestamp || null}
          isVerifiedScan={isVerifiedScan}
          nodes={(scanData?.nodes as GeoGridNode[]) || []}
        />

        {/* Tier 4: Tri-Part Executive Insight */}
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
              ? 'Outer-ring coordinate nodes experience proximity decay against competitors closer to adjacent ZIP centroids.'
              : 'BrightLocal / SerpAPI location resource or tracked keyword library has not yet executed an initial verified scan.'
          }
          whatToDoNext={
            isVerifiedScan
              ? 'Reinforce secondary GBP categories and deploy localized Google Ads location extensions in outer-ring quadrants where rank > #3.'
              : 'Map the verified GBP location and SERP provider in Connection Center to activate automated 5×5 coordinate tracking.'
          }
          actionLabel={
            isVerifiedScan ? 'Model Impact in Opportunity Lab' : 'Open Connection Center'
          }
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
    <Suspense
      fallback={<div className="p-6 text-xs text-slate-500">Loading OtterWatch...</div>}
    >
      <OtterWatchLocalSearchContent />
    </Suspense>
  );
}
