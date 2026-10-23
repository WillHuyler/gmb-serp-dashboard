'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useClient } from '../../lib/client-context';
import GlobalHeader from '../../components/navigation/GlobalHeader';
import TrustCertificationStrip, {
  DataTrustState,
} from '../../components/design-system/TrustCertificationStrip';
import KpiMetricCard from '../../components/design-system/KpiMetricCard';
import TriPartInsightCard from '../../components/design-system/TriPartInsightCard';

export const dynamic = 'force-dynamic';

function CompetitorsContent() {
  const { activeClient } = useClient();
  const [metrics, setMetrics] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const isCertified = Boolean(activeClient?.is_certified);

  useEffect(() => {
    if (!activeClient?.id) {
      setMetrics(null);
      return;
    }

    let cancelled = false;
    async function loadCompetitors() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/telemetry/aggregate?clientId=${encodeURIComponent(activeClient!.id)}`,
          { credentials: 'include', headers: { 'Cache-Control': 'no-cache' } }
        );
        const data = await res.json();
        if (!cancelled) {
          setMetrics(res.ok && data.success ? data.metrics : null);
        }
      } catch {
        if (!cancelled) setMetrics(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCompetitors();
    return () => {
      cancelled = true;
    };
  }, [activeClient?.id]);

  const competitorsList: any[] =
    isCertified && Array.isArray(metrics?.competitors) ? metrics.competitors : [];
  const hasVerifiedCompetitors = competitorsList.length > 0;

  const trustState: DataTrustState = loading
    ? 'SECTION_LOADING'
    : hasVerifiedCompetitors
    ? 'CERTIFIED_LIVE'
    : activeClient?.mappings?.brightlocal_location_id
    ? 'MAPPED_PENDING_SYNC'
    : 'UNMAPPED_SETUP';

  return (
    <div className="flex-1 flex flex-col">
      <TrustCertificationStrip
        client={activeClient}
        trustState={trustState}
        lastIngestedAt={metrics?.last_ingested_at}
        recordCount={competitorsList.length}
      />

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6 text-white font-sans">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#111622] border border-[#A9C7E5]/15 rounded-xl p-6">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-[#D99614] font-bold block">
              KEYWORD-BOUND SERP DISPLACEMENT MATRIX
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
              Competitive Overlap — {activeClient?.name || 'Select Client'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Tracks real local businesses competing across the same 25 geo-grid coordinates and target keywords. Zero hardcoded competitor fixtures.
            </p>
          </div>

          <Link
            href={`/otterwatch?clientId=${activeClient?.id || ''}`}
            className="px-4 py-2 bg-[#D99614] hover:bg-[#B97A08] text-[#0B0F17] font-semibold text-xs rounded-lg"
          >
            Inspect 5×5 Geo-Grid →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiMetricCard
            label="Client Share of Voice"
            value={metrics?.share_of_voice ?? null}
            format="percent"
            sourceBadge="OTTERWATCH SOV"
            provenanceNote="25-Node Map Pack Share"
            isCertified={hasVerifiedCompetitors}
            isLoading={loading}
            accentHighlight={true}
          />

          <KpiMetricCard
            label="Client Weighted Avg Rank"
            value={metrics?.avg_map_rank ?? null}
            format="rank"
            invertDeltaPolarity={true}
            sourceBadge="5×5 GRID"
            provenanceNote="Across Scanned Nodes"
            isCertified={hasVerifiedCompetitors}
            isLoading={loading}
          />

          <KpiMetricCard
            label="Observed SERP Competitors"
            value={hasVerifiedCompetitors ? competitorsList.length : null}
            format="number"
            sourceBadge="SERP OBSERVATIONS"
            provenanceNote="Verified Local Contenders"
            isCertified={hasVerifiedCompetitors}
            isLoading={loading}
          />
        </div>

        <div className="bg-[#111622] border border-[#A9C7E5]/15 rounded-xl p-5 space-y-4">
          <div className="border-b border-[#A9C7E5]/10 pb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-white">
              Observed Map Pack Competitors ({activeClient?.name || 'Client'})
            </h3>
            <span className="font-mono text-xs text-slate-400">
              SOURCE: PUBLIC.KEYWORD_RANKINGS / RANK_HISTORY
            </span>
          </div>

          {!hasVerifiedCompetitors ? (
            <div className="p-8 text-center bg-[#151D2A] rounded-xl border border-[#A9C7E5]/10 space-y-2">
              <p className="text-sm font-bold text-white">
                No Verified Competitor SERP Observations Recorded
              </p>
              <p className="text-xs text-slate-400 max-w-lg mx-auto">
                Per CR-007, PorchLight never renders hardcoded competitor names or synthetic Share-of-Voice percentages. Execute a verified 5×5 SERP scan for {activeClient?.name || 'this client'} to populate observed local pack competitors.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#A9C7E5]/10 text-slate-400 font-mono text-[10px] uppercase">
                    <th className="py-2.5 px-3">Business Name</th>
                    <th className="py-2.5 px-3">Observed Avg Rank</th>
                    <th className="py-2.5 px-3">Grid Share of Voice</th>
                    <th className="py-2.5 px-3 text-right">Verified Reviews</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#A9C7E5]/10">
                  {competitorsList.map((comp: any, idx: number) => (
                    <tr key={comp.name || idx} className="hover:bg-[#151D2A]/60">
                      <td className="py-3 px-3 font-semibold text-white">{comp.name}</td>
                      <td className="py-3 px-3 font-mono text-[#D99614]">
                        #{Number(comp.avgRank || 0).toFixed(1)}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-200">
                        {Number(comp.sovPercent || 0).toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {comp.reviewCount ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <TriPartInsightCard
          title="Competitive Displacement & Map Pack Share Strategy"
          category="COMPETITIVE INTELLIGENCE"
          confidence={hasVerifiedCompetitors ? 'HIGH' : 'INSUFFICIENT_DATA'}
          sources={hasVerifiedCompetitors ? ['OTTERWATCH_SERP_GRID'] : []}
          whatIsHappening={
            hasVerifiedCompetitors
              ? `${competitorsList.length} verified local businesses were observed competing across ${activeClient?.name}'s target geo-grid.`
              : `Competitor discovery awaits an initial verified SERP scan for ${activeClient?.name || 'this client'}.`
          }
          whyItIsHappening="Map Pack displacement in outer grid nodes is driven by competitor proximity to peripheral ZIP centroids and category-specific review velocity."
          whatToDoNext="Use OtterWatch node inspection to identify which specific quadrants are lost to top displacers, then target those ZIPs with localized ad extensions."
        />
      </main>
    </div>
  );
}

export default function CompetitorsPage() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col font-sans">
      <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading Header...</div>}>
        <GlobalHeader />
      </Suspense>
      <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading Competitors...</div>}>
        <CompetitorsContent />
      </Suspense>
    </div>
  );
}
