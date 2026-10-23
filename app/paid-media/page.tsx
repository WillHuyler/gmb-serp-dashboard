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

function PaidMediaContent() {
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
    async function loadPaidTelemetry() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/telemetry/aggregate?clientId=${encodeURIComponent(
            activeClient!.id
          )}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
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

    loadPaidTelemetry();
    return () => {
      cancelled = true;
    };
  }, [activeClient?.id, startDate, endDate]);

  const hasVerifiedPaid = Boolean(
    isCertified && metrics && metrics.record_count > 0 && typeof metrics.total_spend === 'number'
  );

  const verifiedConversions =
    hasVerifiedPaid && typeof metrics?.total_conversions === 'number'
      ? metrics.total_conversions
      : null;

  const verifiedCpl =
    hasVerifiedPaid &&
    typeof metrics?.total_spend === 'number' &&
    typeof verifiedConversions === 'number' &&
    verifiedConversions > 0
      ? metrics.total_spend / verifiedConversions
      : null;

  const trustState: DataTrustState = loading
    ? 'SECTION_LOADING'
    : hasVerifiedPaid
    ? 'CERTIFIED_LIVE'
    : activeClient?.mappings?.google_ads_id || activeClient?.mappings?.meta_act_id
    ? 'MAPPED_PENDING_SYNC'
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
              PAID ACQUISITION TELEMETRY • GOOGLE ADS & META ADS
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0B1F3A] mt-1">
              Paid Media Performance — {activeClient?.name || 'Select Client'}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Google Ads ID:{' '}
              <span className="font-mono font-semibold text-[#0B1F3A]">
                {activeClient?.mappings?.google_ads_id || 'Unmapped'}
              </span>{' '}
              • Meta Ad Account:{' '}
              <span className="font-mono font-semibold text-[#0B1F3A]">
                {activeClient?.mappings?.meta_act_id || 'Unmapped'}
              </span>
            </p>
          </div>

          {activeClient && (
            <Link
              href={`/connection-center?clientId=${activeClient.id}`}
              className="px-4 py-2 bg-[#0B1F3A] hover:bg-[#16325B] text-white rounded-lg text-xs font-bold shadow-sm"
            >
              Manage Ad Account Mappings →
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiMetricCard
            label="Verified Ad Spend"
            value={metrics?.total_spend}
            previousValue={metrics?.prev_total_spend}
            format="currency"
            sourceBadge="GOOGLE + META"
            provenanceNote={activeClient?.mappings?.google_ads_id || 'Unmapped'}
            isCertified={hasVerifiedPaid}
            isLoading={loading}
            accentColor="blue"
          />

          <KpiMetricCard
            label="Paid Clicks"
            value={metrics?.paid_clicks ?? null}
            previousValue={metrics?.prev_paid_clicks ?? null}
            format="number"
            sourceBadge="PAID TRAFFIC"
            provenanceNote="Verified Ad Clicks"
            isCertified={hasVerifiedPaid}
            isLoading={loading}
            accentColor="teal"
          />

          <KpiMetricCard
            label="Verified Conversions"
            value={verifiedConversions}
            previousValue={metrics?.prev_total_conversions ?? null}
            format="number"
            sourceBadge="CONVERSIONS"
            provenanceNote="Qualified Leads"
            isCertified={hasVerifiedPaid}
            isLoading={loading}
            accentHighlight={true}
            accentColor="gold"
          />

          <KpiMetricCard
            label="Blended Cost Per Lead"
            value={verifiedCpl}
            format="currency"
            invertDeltaPolarity={true}
            sourceBadge="CPL GUARDED"
            provenanceNote={
              verifiedConversions && verifiedConversions > 0 ? 'Spend / Leads' : 'Requires >0 Leads'
            }
            isCertified={Boolean(hasVerifiedPaid && verifiedCpl !== null)}
            isLoading={loading}
            accentColor="violet"
          />
        </div>

        <TriPartInsightCard
          title="Paid Search & Paid Social Efficiency Audit"
          category="PAID MEDIA ATTRIBUTION"
          confidence={hasVerifiedPaid ? 'HIGH' : 'INSUFFICIENT_DATA'}
          sources={hasVerifiedPaid ? ['GOOGLE_ADS', 'META_ADS'] : []}
          whatIsHappening={
            hasVerifiedPaid
              ? `${activeClient?.name} invested $${metrics.total_spend.toLocaleString()} across verified paid media channels during ${startDate} – ${endDate}.`
              : `No certified paid media spend or conversion records exist for ${activeClient?.name || 'this client'} in the selected window.`
          }
          whyItIsHappening={
            hasVerifiedPaid
              ? 'Cost per lead is strictly calculated only when verified conversion volume is greater than zero.'
              : 'Google Ads customer ID or Meta Ad Account ID is either unmapped in Connection Center or awaiting initial ingestion.'
          }
          whatToDoNext={
            hasVerifiedPaid
              ? 'Align paid search location bid adjustments with weak outer-ring nodes identified in OtterWatch 5×5 Geo-Grid.'
              : 'Map the client’s Google Ads and Meta Ads accounts in Connection Center to enable verified paid attribution.'
          }
          actionLabel={hasVerifiedPaid ? 'Simulate Budget in Opportunity Lab' : 'Map Ad Accounts'}
          actionHref={
            hasVerifiedPaid
              ? `/outcome-lab?clientId=${activeClient?.id || ''}`
              : `/connection-center?clientId=${activeClient?.id || ''}`
          }
        />
      </main>
    </div>
  );
}

export default function PaidMediaPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-500">Loading Paid Media...</div>}>
      <PaidMediaContent />
    </Suspense>
  );
}
