'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useClient } from '../../lib/client-context';
import { PlaidInsightsPanel } from '../../components/PlaidInsightsPanel';
import TerritoryPerformance from '../../components/analytics/TerritoryPerformance';
import KeywordsTable from '../../components/analytics/KeywordsTable';
import type { DataCertificationState } from '../../lib/data-certification';

export const dynamic = 'force-dynamic';

export interface ClientTelemetryPayload {
  clientId: string;
  tenantId: string;
  provenance: {
    certificationState: DataCertificationState;
    isCertified: boolean;
    isLiveSyncVerified: boolean;
    hasHistoricalData: boolean;
    mappedAccountsCount: number;
    verifiedConnectionsCount: number;
    earliestMetricDate: string | null;
    latestMetricDate: string | null;
    stalenessDays: number | null;
    reason: string;
  };
  kpis: {
    totalInteractions: number | null;
    porchlightCalls: number | null;
    porchlightDirections: number | null;
    porchlightWebsiteClicks: number | null;
    ga4Sessions: number | null;
    ga4Conversions: number | null;
    totalAdSpend: number | null;
    gadsSpend: number | null;
    metaSpend: number | null;
    totalPaidLeads: number | null;
    blendedCpl: number | null;
    gscImpressions: number | null;
    gscClicks: number | null;
  };
  dailyMetrics: any[];
  platformMetrics: any[];
  keywords: any[];
  zips: any[];
  aiRecommendations: any[];
}

function formatNullableMetric(
  value: number | null | undefined,
  options?: { prefix?: string; suffix?: string }
): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }
  const formatted = Number(value).toLocaleString();
  return `${options?.prefix || ''}${formatted}${options?.suffix || ''}`;
}

function CommandCenterContent() {
  const { activeClient, authStatus, error: contextError } = useClient();
  const [telemetry, setTelemetry] = useState<ClientTelemetryPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<{ status: number; message: string } | null>(null);

  useEffect(() => {
    // CR-014 Requirement: Always clear prior client state immediately on selection change
    setTelemetry(null);
    setApiError(null);

    if (!activeClient?.id) {
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/api/telemetry/client-data?clientId=${encodeURIComponent(activeClient.id)}`, {
      cache: 'no-store',
      credentials: 'include',
    })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body.success) {
          throw {
            status: res.status,
            message:
              body.message ||
              body.error ||
              `Telemetry request failed with HTTP ${res.status}`,
          };
        }
        return body as ClientTelemetryPayload;
      })
      .then((data) => {
        if (!cancelled) {
          setTelemetry(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setTelemetry(null);
          setApiError({
            status: err?.status || 500,
            message: err?.message || 'Unable to load client telemetry.',
          });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeClient?.id]);

  // CR-014: Explicit 401 / 403 / 500 error handling at context level
  if (authStatus === 'unauthenticated' || authStatus === 'forbidden' || authStatus === 'error') {
    return (
      <div className="p-8 bg-[#0B0F17] text-white min-h-screen flex items-center justify-center">
        <div className="max-w-lg w-full bg-[#111622] border border-rose-500/30 rounded-xl p-6 space-y-3 text-center">
          <span className="text-xs font-mono uppercase tracking-widest text-rose-400 font-bold block">
            {authStatus === 'unauthenticated'
              ? 'HTTP 401 • AUTHENTICATION REQUIRED'
              : authStatus === 'forbidden'
              ? 'HTTP 403 • TENANT ACCESS FORBIDDEN'
              : 'TELEMETRY SERVICE ERROR'}
          </span>
          <h2 className="text-lg font-bold text-white">
            {authStatus === 'unauthenticated'
              ? 'Session Authentication Required'
              : authStatus === 'forbidden'
              ? 'Unauthorized Tenant Scope'
              : 'Unable to Load Client Portfolio'}
          </h2>
          <p className="text-xs text-slate-300">{contextError}</p>
          {authStatus === 'unauthenticated' && (
            <Link
              href="/login"
              className="inline-block bg-[#D99614] hover:bg-[#B97A08] text-black text-xs font-mono font-bold px-4 py-2 rounded-lg"
            >
              Sign In to PorchLight →
            </Link>
          )}
        </div>
      </div>
    );
  }

  const provenance = telemetry?.provenance;
  const kpis = telemetry?.kpis;
  const certState = provenance?.certificationState || activeClient?.certification_state || 'UNMAPPED';
  const hasDisplayableData = Boolean(
    provenance?.isCertified || provenance?.hasHistoricalData
  );

  return (
    <div className="p-6 md:p-8 space-y-6 bg-[#0B0F17] text-white min-h-screen font-sans">
      {/* Top Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#A9C7E5]/10 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#D99614] font-bold">
              EXECUTIVE COMMAND CENTER
            </span>
            {certState === 'CERTIFIED_LIVE' && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ✓ CERTIFIED LIVE SYNCHRONIZATION
              </span>
            )}
            {certState === 'HISTORICAL_UNVERIFIED' && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                ⚠ HISTORICAL RECORDS ONLY • UNMAPPED / UNCERTIFIED ({provenance?.latestMetricDate || 'AUG 2026'})
              </span>
            )}
            {certState === 'STALE_MAPPED' && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-orange-500/10 text-orange-300 border border-orange-500/30">
                ⏳ STALE TELEMETRY ({provenance?.stalenessDays}D OLD)
              </span>
            )}
            {(certState === 'UNMAPPED' || certState === 'MAPPED_PENDING_SYNC') && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-300 border border-slate-700">
                ⚪ {certState} • NO LIVE TELEMETRY
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            {activeClient?.name || 'No Client Selected'}
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {activeClient?.address || 'Address Unmapped'} • Store Code:{' '}
            {activeClient?.store_code || 'N/A'} • Domain: {activeClient?.domain || 'Unmapped'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href={activeClient?.id ? `/outcome-lab?clientId=${activeClient.id}` : '/outcome-lab'}
            className="bg-[#D99614] hover:bg-[#B97A08] text-black text-xs font-mono font-bold px-4 py-2 rounded-lg transition-all"
          >
            🎯 LAUNCH OUTCOME LAB
          </Link>
          <Link
            href={
              activeClient?.id
                ? `/connection-center?clientId=${activeClient.id}`
                : '/connection-center'
            }
            className="bg-[#111622] border border-[#A9C7E5]/20 hover:border-[#55A9E6] text-white text-xs font-mono font-bold px-4 py-2 rounded-lg transition-all"
          >
            🔌 CONNECTION CENTER
          </Link>
        </div>
      </div>

      {/* Provenance & Freshness Disclosure Banner (CR-012 / CR-014) */}
      {provenance && !provenance.isCertified && provenance.hasHistoricalData && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold block">
              PROVENANCE DISCLOSURE • HISTORICAL ARCHIVE (NOT LIVE SYNCED)
            </span>
            <p className="text-xs text-slate-200">
              {provenance.reason} Reporting window:{' '}
              <strong className="font-mono">
                {provenance.earliestMetricDate || 'N/A'} → {provenance.latestMetricDate || 'N/A'}
              </strong>{' '}
              ({provenance.stalenessDays ?? '—'} days stale). Mapped accounts:{' '}
              <strong className="font-mono">{provenance.mappedAccountsCount}</strong>.
            </p>
          </div>
          <Link
            href={`/connection-center?clientId=${activeClient?.id || ''}`}
            className="shrink-0 bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-200 text-xs font-mono font-bold px-3 py-1.5 rounded-lg"
          >
            Map Live Providers →
          </Link>
        </div>
      )}

      {/* API Error State (401 / 403 / 500) */}
      {apiError ? (
        <div className="bg-[#111622] border border-rose-500/30 rounded-xl p-8 text-center space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-rose-400 font-bold block">
            HTTP {apiError.status} • TELEMETRY REQUEST FAILED
          </span>
          <h2 className="text-base font-bold text-white font-mono">{apiError.message}</h2>
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            PorchLight halted rendering because the client-scoped telemetry query returned an error.
          </p>
        </div>
      ) : loading ? (
        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-8 text-center text-xs font-mono text-slate-400 animate-pulse">
          Verifying tenant authorization and querying client-scoped records...
        </div>
      ) : !hasDisplayableData ? (
        <div className="bg-[#111622] border border-amber-500/20 rounded-xl p-8 text-center space-y-3">
          <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold block">
            FAIL-CLOSED TELEMETRY GATE ACTIVE ({certState})
          </span>
          <h2 className="text-lg font-bold text-white font-mono">
            NO VERIFIED OR HISTORICAL METRICS FOR {activeClient?.name?.toUpperCase()}
          </h2>
          <p className="text-xs text-slate-400 max-w-xl mx-auto">
            {provenance?.reason ||
              'Connect and map external provider accounts in Connection Center to synchronize telemetry for this client.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                  GBP INTERACTIONS
                </span>
                <span className="text-[10px] font-mono text-amber-400">
                  {provenance?.isCertified ? 'LIVE' : `HIST (${provenance?.latestMetricDate || 'N/A'})`}
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                {formatNullableMetric(kpis?.totalInteractions)}
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Calls: {formatNullableMetric(kpis?.porchlightCalls)} • Web:{' '}
                {formatNullableMetric(kpis?.porchlightWebsiteClicks)} • Dir:{' '}
                {formatNullableMetric(kpis?.porchlightDirections)}
              </div>
            </div>

            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                  PAID MEDIA SPEND
                </span>
                <span className="text-[10px] font-mono text-amber-400">
                  {provenance?.isCertified ? 'LIVE' : 'HISTORICAL'}
                </span>
              </div>
              <div className="text-2xl font-mono font-bold text-white">
                {formatNullableMetric(kpis?.totalAdSpend, { prefix: '$' })}
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Google Ads: {formatNullableMetric(kpis?.gadsSpend, { prefix: '$' })} • Meta Ads:{' '}
                {formatNullableMetric(kpis?.metaSpend, { prefix: '$' })}
              </div>
            </div>

            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                  PAID + GA4 CONVERSIONS
                </span>
                <span className="text-[10px] font-mono text-amber-400">
                  {provenance?.isCertified ? 'LIVE' : 'HISTORICAL'}
                </span>
              </div>
              <div className="text-2xl font-mono font-bold text-emerald-400">
                {kpis?.totalPaidLeads !== null || kpis?.ga4Conversions !== null
                  ? formatNullableMetric(
                      (kpis?.totalPaidLeads ?? 0) + (kpis?.ga4Conversions ?? 0)
                    )
                  : '—'}
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Blended CPL: {formatNullableMetric(kpis?.blendedCpl, { prefix: '$' })} (
                {formatNullableMetric(kpis?.totalPaidLeads)} paid leads)
              </div>
            </div>

            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                  SEARCH CONSOLE & GA4
                </span>
                <span className="text-[10px] font-mono text-amber-400">
                  {provenance?.isCertified ? 'LIVE' : 'HISTORICAL'}
                </span>
              </div>
              <div className="text-2xl font-mono font-bold text-[#55A9E6]">
                {formatNullableMetric(kpis?.ga4Sessions, { suffix: ' Sessions' })}
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                GSC Clicks: {formatNullableMetric(kpis?.gscClicks)} • Impr:{' '}
                {formatNullableMetric(kpis?.gscImpressions)}
              </div>
            </div>
          </div>

          {/* Territory, Keywords, and Intelligence Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <TerritoryPerformance
                zips={telemetry?.zips}
                provenance={telemetry?.provenance}
                loading={loading}
              />
              <KeywordsTable
                keywords={telemetry?.keywords}
                provenance={telemetry?.provenance}
                loading={loading}
              />
            </div>
            <div>
              <PlaidInsightsPanel
                recommendations={telemetry?.aiRecommendations}
                provenance={telemetry?.provenance}
                loading={loading}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function CommandCenterPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-xs font-mono text-slate-400 bg-[#0B0F17] min-h-screen">
          Loading Command Center...
        </div>
      }
    >
      <CommandCenterContent />
    </Suspense>
  );
}
