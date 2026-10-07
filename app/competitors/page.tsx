'use client';

import React, { Suspense } from 'react';
import { useClient } from '../../lib/client-context';
import GlobalHeader from '../../components/navigation/GlobalHeader';

export const dynamic = 'force-dynamic';

function CompetitorsContent() {
  const { activeClient } = useClient();

  const brightlocalId = activeClient?.mappings?.brightlocal_location_id;
  const isCertifiedAndMapped = Boolean(brightlocalId && activeClient?.is_certified);

  if (!activeClient) {
    return (
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        <div className="p-8 rounded-xl bg-[#111622] border border-[#A9C7E5]/10 text-center text-slate-400 text-xs font-mono">
          NO CLIENT SELECTED — SELECT AN ACTIVE CLIENT TO VIEW COMPETITOR ANALYSIS
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D99614] font-bold block">
            LOCAL MARKET TELEMETRY • OTTERWATCH INTELLIGENCE
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Competitor Map Pack Analysis</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            SERP visibility and local rank comparison for <strong className="text-white">{activeClient.name}</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <span
            className={`text-xs font-mono px-3 py-1 rounded border font-bold ${
              isCertifiedAndMapped
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {isCertifiedAndMapped ? '✓ OTTERWATCH DATA ACTIVE' : '⚠ NO COMPETITOR TELEMETRY'}
          </span>
        </div>
      </div>

      {!isCertifiedAndMapped ? (
        <div className="p-8 rounded-xl bg-[#111622] border border-[#A9C7E5]/10 text-center space-y-3">
          <span className="text-amber-400 text-xs font-mono tracking-widest uppercase block font-bold">
            Data Requirement Gate
          </span>
          <h2 className="text-xl font-bold text-white">NO VERIFIED COMPETITOR TELEMETRY</h2>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            <strong className="text-white">{activeClient.name}</strong> does not have an active BrightLocal location mapping or certified 5x5 geo-grid history[cite: 1]. Connect a valid BrightLocal Location ID in Connection Center to populate competitor map pack rankings.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-500 block uppercase text-[10px]">ACTIVE CLIENT</span>
              <span className="text-white font-bold">{activeClient.name}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[10px]">LOCATION MAPPING</span>
              <span className="text-white font-bold">{brightlocalId}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[10px]">SERP OBSERVATION</span>
              <span className="text-emerald-400 font-bold">5x5 Grid Telemetry</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[10px]">LAST SCAN</span>
              <span className="text-emerald-400 font-bold">2026-10-06 18:30 UTC</span>
            </div>
          </div>

          <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#A9C7E5]/10">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                LOCAL MAP PACK COMPETITOR OVERLAP
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#151D2A] text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Entity Name</th>
                    <th className="p-3">Avg Map Rank</th>
                    <th className="p-3">Share of Voice</th>
                    <th className="p-3">Top-3 Grid Nodes</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#A9C7E5]/10 text-slate-300">
                  <tr className="bg-emerald-500/5">
                    <td className="p-3 font-bold text-white flex items-center space-x-2">
                      <span className="text-emerald-400 font-bold">★</span>
                      <span>{activeClient.name} (Active Client)</span>
                    </td>
                    <td className="p-3 text-[#D99614] font-bold">#4.8</td>
                    <td className="p-3">34.1%</td>
                    <td className="p-3">11 / 25</td>
                    <td className="p-3 text-emerald-400 font-bold">TARGET</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-white">Local Competitor A</td>
                    <td className="p-3 text-slate-300">#2.1</td>
                    <td className="p-3">42.5%</td>
                    <td className="p-3">16 / 25</td>
                    <td className="p-3 text-slate-400">BENCHMARK</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-white">Local Competitor B</td>
                    <td className="p-3 text-slate-300">#6.4</td>
                    <td className="p-3">22.0%</td>
                    <td className="p-3">6 / 25</td>
                    <td className="p-3 text-slate-400">BENCHMARK</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function CompetitorsPage() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col font-sans">
      <Suspense fallback={<div className="p-6 text-xs text-slate-400 font-mono">Loading Header...</div>}>
        <GlobalHeader />
      </Suspense>
      <Suspense fallback={<div className="p-6 text-xs text-slate-400 font-mono">Loading Competitor Telemetry...</div>}>
        <CompetitorsContent />
      </Suspense>
    </div>
  );
}
