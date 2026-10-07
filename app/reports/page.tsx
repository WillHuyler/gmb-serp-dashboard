'use client';

import React, { Suspense } from 'react';
import { useClient } from '../../lib/client-context';
import GlobalHeader from '../../components/navigation/GlobalHeader';

export const dynamic = 'force-dynamic';

function ReportsContent() {
  const { activeClient } = useClient();

  const isCertified = Boolean(activeClient?.is_certified);

  if (!activeClient) {
    return (
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        <div className="p-8 rounded-xl bg-[#111622] border border-[#A9C7E5]/10 text-center text-slate-400 text-xs font-mono">
          NO CLIENT SELECTED — SELECT AN ACTIVE CLIENT TO VIEW REPORTING
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D99614] font-bold block">
            EXECUTIVE REPORTING • PROVENANCE AUDIT
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Performance Reports</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Client-scoped executive summaries and exportable audit ledgers for <strong className="text-white">{activeClient.name}</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <span
            className={`text-xs font-mono px-3 py-1 rounded border font-bold ${
              isCertified
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {isCertified ? '✓ REPORTS CERTIFIED' : '⚠ UNCERTIFIED BASELINE'}
          </span>
        </div>
      </div>

      {/* Fail-Closed Gate for Uncertified Clients */}
      {!isCertified ? (
        <div className="p-8 rounded-xl bg-[#111622] border border-[#A9C7E5]/10 text-center space-y-3">
          <span className="text-amber-400 text-xs font-mono tracking-widest uppercase block font-bold">
            Report Generation Gate
          </span>
          <h2 className="text-xl font-bold text-white">EXPORT GAITED (UNCERTIFIED BASELINE)</h2>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            <strong className="text-white">{activeClient.name}</strong> operates on an uncertified baseline. Configure active integrations in Connection Center to generate exportable client performance reports.
          </p>
        </div>
      ) : (
        /* Certified Reporting Surface */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-3">
              <span className="text-[10px] font-mono text-slate-400 uppercase">EXECUTIVE SUMMARY</span>
              <h3 className="text-sm font-bold text-white">Monthly Performance Brief</h3>
              <p className="text-xs text-slate-400">
                Consolidated cross-channel KPIs including Paid Spend, GA4 Traffic, Organic Clicks, and Local Map Rank.
              </p>
              <button className="w-full py-2 bg-[#D99614] hover:bg-[#B97A08] text-[#0B0F17] text-xs font-mono font-bold rounded transition-all">
                EXPORT PDF REPORT →
              </button>
            </div>

            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-3">
              <span className="text-[10px] font-mono text-slate-400 uppercase">LOCAL SERP AUDIT</span>
              <h3 className="text-sm font-bold text-white">OtterWatch 5x5 Grid Audit</h3>
              <p className="text-xs text-slate-400">
                Granular node-by-node rankings, rank velocity shifts, and share-of-voice position maps.
              </p>
              <button className="w-full py-2 bg-[#151D2A] hover:bg-[#1C273A] border border-[#A9C7E5]/10 text-slate-200 text-xs font-mono font-bold rounded transition-all">
                EXPORT CSV DATA →
              </button>
            </div>

            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-3">
              <span className="text-[10px] font-mono text-slate-400 uppercase">TELEMETRY PROVENANCE</span>
              <h3 className="text-sm font-bold text-white">Ingestion Audit Ledger</h3>
              <p className="text-xs text-slate-400">
                Complete system event logs, OAuth sync records, and database payload timestamps.
              </p>
              <button className="w-full py-2 bg-[#151D2A] hover:bg-[#1C273A] border border-[#A9C7E5]/10 text-slate-200 text-xs font-mono font-bold rounded transition-all">
                VIEW AUDIT LOG →
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col font-sans">
      <Suspense fallback={<div className="p-6 text-xs text-slate-400 font-mono">Loading Header...</div>}>
        <GlobalHeader />
      </Suspense>
      <Suspense fallback={<div className="p-6 text-xs text-slate-400 font-mono">Loading Reports...</div>}>
        <ReportsContent />
      </Suspense>
    </div>
  );
}
