'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useClient } from '../../lib/client-context';
import TrustCertificationStrip, {
  DataTrustState,
} from '../../components/design-system/TrustCertificationStrip';
import KpiMetricCard from '../../components/design-system/KpiMetricCard';
import TriPartInsightCard from '../../components/design-system/TriPartInsightCard';

export const dynamic = 'force-dynamic';

function ReputationContent() {
  const { activeClient, reportingPeriod } = useClient();
  const [metrics, setMetrics] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const isCertified = Boolean(activeClient?.is_certified);

  useEffect(() => {
    if (!activeClient?.id) {
      setMetrics(null);
      return;
    }

    let cancelled = false;
    async function loadReputation() {
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

    loadReputation();
    return () => {
      cancelled = true;
    };
  }, [activeClient?.id]);

  const hasVerifiedReputation = Boolean(
    isCertified && metrics && metrics.record_count > 0 && typeof metrics.avg_rating === 'number'
  );

  const trustState: DataTrustState = loading
    ? 'SECTION_LOADING'
    : hasVerifiedReputation
    ? 'CERTIFIED_LIVE'
    : activeClient?.store_code || activeClient?.mappings?.gmb_location_id
    ? 'MAPPED_PENDING_SYNC'
    : 'UNMAPPED_SETUP';

  return (
    <div className="flex-1 flex flex-col bg-[#F4F7FB] text-[#0B1F3A]">
      <TrustCertificationStrip
        client={activeClient}
        trustState={trustState}
        lastIngestedAt={metrics?.last_ingested_at}
        recordCount={metrics?.record_count || 0}
        reportingPeriod={reportingPeriod}
      />

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6 font-sans">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-[#DCE5EF] rounded-xl p-6 shadow-sm">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#D99614] font-bold block">
              GBP REPUTATION & SENTIMENT TELEMETRY
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0B1F3A] mt-1">
              Reputation Intelligence — {activeClient?.name || 'Select Client'}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              GBP Store Code:{' '}
              <span className="font-mono font-semibold text-[#0B1F3A]">
                {activeClient?.store_code || 'Unassigned'}
              </span>{' '}
              • Location: {activeClient?.address || 'Address pending'}
            </p>
          </div>

          {activeClient && (
            <Link
              href={`/connection-center?clientId=${activeClient.id}`}
              className="px-4 py-2 bg-[#0B1F3A] hover:bg-[#16325B] text-white rounded-lg text-xs font-bold shadow-sm"
            >
              Verify GBP Location Mapping →
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiMetricCard
            label="Verified GBP Star Rating"
            value={metrics?.avg_rating ?? null}
            format="number"
            sourceBadge="GBP • VERIFIED"
            provenanceNote={
              activeClient?.store_code ? `Store #${activeClient.store_code}` : 'Unmapped'
            }
            isCertified={hasVerifiedReputation}
            isLoading={loading}
            accentHighlight={true}
            accentColor="gold"
          />

          <KpiMetricCard
            label="Total Verified Reviews"
            value={metrics?.total_reviews ?? null}
            previousValue={metrics?.prev_total_reviews ?? null}
            format="number"
            sourceBadge="GBP • REVIEWS"
            provenanceNote="Cumulative Count"
            isCertified={hasVerifiedReputation}
            isLoading={loading}
            accentColor="blue"
          />

          <KpiMetricCard
            label="New Reviews (Period)"
            value={metrics?.new_reviews ?? null}
            format="number"
            sourceBadge="VELOCITY"
            provenanceNote="30-Day Review Gain"
            isCertified={hasVerifiedReputation}
            isLoading={loading}
            accentColor="teal"
          />

          <KpiMetricCard
            label="Owner Response Coverage"
            value={metrics?.response_rate ?? null}
            format="percent"
            sourceBadge="GOVERNANCE"
            provenanceNote="Replied / Total"
            isCertified={hasVerifiedReputation}
            isLoading={loading}
            accentColor="violet"
          />
        </div>

        <TriPartInsightCard
          title="Review Velocity & Local Map Pack Prominence Impact"
          category="REPUTATION DIAGNOSTIC"
          confidence={hasVerifiedReputation ? 'HIGH' : 'INSUFFICIENT_DATA'}
          sources={hasVerifiedReputation ? ['GOOGLE_BUSINESS_PROFILE'] : []}
          whatIsHappening={
            hasVerifiedReputation
              ? `${activeClient?.name} holds a verified ${metrics.avg_rating}★ average across ${metrics.total_reviews} GBP reviews.`
              : `No verified GBP review telemetry has been ingested for ${activeClient?.name || 'this client'} yet.`
          }
          whyItIsHappening={
            hasVerifiedReputation
              ? 'Consistent review velocity with service-specific keywords directly strengthens Top-3 Map Pack placement across outer-ring 5×5 grid nodes.'
              : 'GBP location resource requires confirmed mapping and initial review sync before sentiment and velocity metrics populate.'
          }
          whatToDoNext="Ensure the verified GBP location is mapped in Connection Center and maintain <24h owner response coverage on all new customer reviews."
          actionLabel="Inspect Local Pack Impact in OtterWatch"
          actionHref={`/otterwatch?clientId=${activeClient?.id || ''}`}
        />
      </main>
    </div>
  );
}

export default function ReputationPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-500">Loading Reputation...</div>}>
      <ReputationContent />
    </Suspense>
  );
}
