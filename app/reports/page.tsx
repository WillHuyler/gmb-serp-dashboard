'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useClient } from '../../lib/client-context';
import TrustCertificationStrip, {
  DataTrustState,
} from '../../components/design-system/TrustCertificationStrip';
import KpiMetricCard from '../../components/design-system/KpiMetricCard';
import TriPartInsightCard from '../../components/design-system/TriPartInsightCard';

export const dynamic = 'force-dynamic';

function ReportsContent() {
  const { activeClient, reportingPeriod } = useClient();
  const [metrics, setMetrics] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const { startDate, endDate } = reportingPeriod;
  const isCertified = Boolean(activeClient?.is_certified);

  useEffect(() => {
    if (!activeClient?.id) {
      setMetrics(null);
      return;
    }

    let cancelled = false;
    async function loadReportData() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/telemetry/aggregate?clientId=${encodeURIComponent(
            activeClient!.id
          )}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
          { credentials: 'include' }
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

    loadReportData();
    return () => {
      cancelled = true;
    };
  }, [activeClient?.id, startDate, endDate]);

  const hasVerifiedRecords = Boolean(isCertified && metrics && metrics.record_count > 0);
  const trustState: DataTrustState = loading
    ? 'SECTION_LOADING'
    : hasVerifiedRecords
    ? 'CERTIFIED_LIVE'
    : 'UNMAPPED_SETUP';

  return (
    <div className="flex-1 flex flex-col bg-[#F4F7FB] text-[#0B1F3A]">
      <TrustCertificationStrip
        client={activeClient}
        trustState={trustState}
        lastIngestedAt={metrics?.last_ingested_at}
        recordCount={metrics?.record_count || 0}
        reportingPeriod={{ startDate, endDate }}
      />

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6 font-sans">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-[#DCE5EF] rounded-xl p-6 shadow-sm">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#D99614] font-bold block">
              EXECUTIVE INTELLIGENCE BRIEF • PROVENANCE-STAMPED EXPORT
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0B1F3A] mt-1">
              Executive Performance Report — {activeClient?.name || 'Select Client'}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Reporting Period: {startDate} to {endDate} • Provenance Watermark:{' '}
              <strong className={hasVerifiedRecords ? 'text-emerald-700' : 'text-amber-700'}>
                {hasVerifiedRecords ? 'CERTIFIED TELEMETRY' : 'UNCERTIFIED / SETUP REQUIRED'}
              </strong>
            </p>
          </div>

          <button
            type="button"
            onClick={() => typeof window !== 'undefined' && window.print()}
            className="px-4 py-2 bg-[#D99614] hover:bg-[#B87D0E] text-[#0B1F3A] font-bold text-xs rounded-lg transition-all shadow-sm"
          >
            Print / Export PDF Brief
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiMetricCard
            label="Total GBP Interactions"
            value={metrics?.total_interactions}
            previousValue={metrics?.prev_interactions}
            format="number"
            sourceBadge="GBP"
            isCertified={hasVerifiedRecords}
            isLoading={loading}
            accentColor="blue"
          />
          <KpiMetricCard
            label="Verified Phone Calls"
            value={metrics?.gmb_calls}
            previousValue={metrics?.prev_gmb_calls}
            format="number"
            sourceBadge="GBP CALLS"
            isCertified={hasVerifiedRecords}
            isLoading={loading}
            accentColor="teal"
          />
          <KpiMetricCard
            label="Verified Ad Spend"
            value={metrics?.total_spend}
            previousValue={metrics?.prev_total_spend}
            format="currency"
            sourceBadge="PAID MEDIA"
            isCertified={hasVerifiedRecords}
            isLoading={loading}
            accentColor="violet"
          />
          <KpiMetricCard
            label="OtterWatch Avg Grid Rank"
            value={metrics?.avg_map_rank}
            format="rank"
            invertDeltaPolarity={true}
            sourceBadge="5×5 SERP"
            isCertified={hasVerifiedRecords}
            isLoading={loading}
            accentHighlight={true}
            accentColor="gold"
          />
        </div>

        <TriPartInsightCard
          title="Executive Summary & Provenance Attestation"
          category="EXECUTIVE BRIEF"
          confidence={hasVerifiedRecords ? 'HIGH' : 'INSUFFICIENT_DATA'}
          sources={hasVerifiedRecords ? ['SUPABASE_DAILY_CLIENT_METRICS'] : []}
          whatIsHappening={
            hasVerifiedRecords
              ? `This report summarizes ${metrics.record_count} verified daily telemetry records for ${activeClient?.name}.`
              : `This report is stamped UNCERTIFIED because ${activeClient?.name || 'this client'} has 0 verified telemetry records for ${startDate} – ${endDate}.`
          }
          whyItIsHappening="All exported PorchLight reports include an explicit provenance attestation so agency stakeholders never mistake unmapped states for live data."
          whatToDoNext="Complete provider mapping and initial ingestion in Connection Center to issue a Certified Executive Performance Brief."
        />
      </main>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-500">Loading Reports...</div>}>
      <ReportsContent />
    </Suspense>
  );
}
