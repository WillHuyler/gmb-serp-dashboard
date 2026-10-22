'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useClient } from '../../lib/client-context';
import { PlaidInsightsPanel } from '../../components/PlaidInsightsPanel';
import TerritoryPerformance from '../../components/analytics/TerritoryPerformance';
import KeywordsTable from '../../components/analytics/KeywordsTable';

export const dynamic = 'force-dynamic';

interface ClientTelemetryPayload {
  isCertified: boolean;
  kpis: {
    totalInteractions: number;
    porchlightCalls: number;
    porchlightDirections: number;
    porchlightWebsiteClicks: number;
    ga4Sessions: number;
    ga4Conversions: number;
    totalAdSpend: number;
    gadsSpend: number;
    metaSpend: number;
    totalPaidLeads: number;
    blendedCpl: number;
    gscImpressions: number;
    gscClicks: number;
  };
  dailyMetrics: any[];
}

function CommandCenterContent() {
  const { activeClient } = useClient();
  const [telemetry, setTelemetry] = useState<ClientTelemetryPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!activeClient?.id) {
      setTelemetry(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch(`/api/telemetry/client-data?clientId=${encodeURIComponent(activeClient.id)}`, {
      cache: 'no-store',
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success) {
          setTelemetry(data);
        }
      })
      .catch(() => {
        if (!cancelled) setTelemetry(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeClient?.id]);

  const isCertified = Boolean(activeClient?.is_certified && telemetry?.isCertified);
  const kpis = telemetry?.kpis;

  return (
    <div className="p-6 md:p-8 space-y-6 bg-[#0B0F17] text-white min-h-screen font-sans">
      {/* Top Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#A9C7E5]/10 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#D99614] font-bold">
              EXECUTIVE COMMAND CENTER
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                isCertified
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              {isCertified ? '✓ CERTIFIED SUPABASE TELEMETRY' : '⚠ DATA REVIEW REQUIRED'}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            {activeClient?.name || 'Select Client'}
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

      {/* Primary KPI Strip */}
      {!isCertified ? (
        <div className="bg-[#111622] border border-amber-500/20 rounded-xl p-8 text-center space-y-3">
          <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold block">
            FAIL-CLOSED TELEMETRY GATE ACTIVE
          </span>
          <h2 className="text-lg font-bold text-white font-mono">
            NO CERTIFIED METRICS MAPPED FOR {activeClient?.name?.toUpperCase()}
          </h2>
          <p className="text-xs text-slate-400 max-w-xl mx-auto font-mono">
            PorchLight blocks synthetic fallback metrics. Connect and certify Google Business Profile, Google Ads, GA4, or BrightLocal accounts in Connection Center to populate executive KPIs for this client.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                TOTAL GBP INTERACTIONS (10D)
              </span>
              <div className="text-2xl font-bold font-mono text-white">
                {loading ? '...' : kpis?.totalInteractions.toLocaleString() || '0'}
              </div>
              <div className="text-[11px] font-mono text-emerald-400">
                Calls: {kpis?.porchlightCalls || 0} • Website: {kpis?.porchlightWebsiteClicks || 0} • Directions: {kpis?.porchlightDirections || 0}
              </div>
            </div>

            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                TOTAL PAID MEDIA SPEND
              </span>
              <div className="text-2xl font-mono font-bold text-white">
                {loading ? '...' : `$${(kpis?.totalAdSpend || 0).toLocaleString()}`}
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Google Ads: ${kpis?.gadsSpend || 0} • Meta Ads: ${kpis?.metaSpend || 0}
              </div>
            </div>

            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                PAID + ORGANIC CONVERSIONS
              </span>
              <div className="text-2xl font-mono font-bold text-emerald-400">
                {loading
                  ? '...'
                  : ((kpis?.totalPaidLeads || 0) + (kpis?.ga4Conversions || 0)).toLocaleString()}
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Blended Paid CPL: ${kpis?.blendedCpl || 0} ({kpis?.totalPaidLeads || 0} paid leads)
              </div>
            </div>

            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                SEARCH CONSOLE & GA4 TRAFFIC
              </span>
              <div className="text-2xl font-mono font-bold text-[#55A9E6]">
                {loading ? '...' : (kpis?.ga4Sessions || 0).toLocaleString()} Sessions
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                GSC Clicks: {(kpis?.gscClicks || 0).toLocaleString()} • Impressions:{' '}
                {(kpis?.gscImpressions || 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Territory & Keywords Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <TerritoryPerformance />
              <KeywordsTable />
            </div>
            <div>
              <PlaidInsightsPanel />
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
