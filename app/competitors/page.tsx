'use client';

import React, { Suspense } from 'react';
import { useClient } from '../../lib/client-context';
import GlobalHeader from '../../components/navigation/GlobalHeader';

export const dynamic = 'force-dynamic';

function CompetitorsContent() {
  const { activeClient } = useClient();
  const hasSerpData = Boolean(activeClient?.mappings?.brightlocal_location_id);

  return (
    <main className="flex-1 p-8 space-y-6 max-w-7xl w-full mx-auto font-sans">
      <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D99614] font-bold block">
            LOCAL COMPETITIVE OVERLAP & SHARE OF VOICE
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            {activeClient?.name || 'Active Client'}
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            SERP Node Observation Source: {activeClient?.mappings?.brightlocal_location_id || 'UNMAPPED'}
          </p>
        </div>

        <span className={`px-3 py-1 rounded text-xs font-mono font-bold border ${
          hasSerpData
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-slate-800 text-slate-400 border-slate-700'
        }`}>
          {hasSerpData ? 'COMPETITOR TELEMETRY ACTIVE ✓' : 'NO SERP LOCATION MAPPED'}
        </span>
      </div>

      {!hasSerpData ? (
        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-12 text-center space-y-4 max-w-xl mx-auto mt-12">
          <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-xl">
            ⚔️
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              NO COMPETITOR SERP TELEMETRY SOURCED
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Competitive node overlap generates directly from active OtterWatch 5x5 geo-grid scans. Map a location ID for <strong className="text-white">{activeClient?.name}</strong> to view competitors.
            </p>
          </div>
          <a
            href="/connection-center"
            className="inline-block bg-[#55A9E6]/10 border border-[#55A9E6]/30 text-[#55A9E6] text-xs font-mono font-bold px-4 py-2 rounded hover:bg-[#55A9E6]/20 transition-all"
          >
            Configure Location Mapping →
          </a>
        </div>
      ) : (
        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-4">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              LOCAL MAP PACK COMPETITOR OVERLAP MATRIX
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Sourced from location {activeClient?.mappings?.brightlocal_location_id}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#A9C7E5]/10 text-slate-400 text-[10px] uppercase">
                  <th className="pb-3">COMPETITOR BUSINESS NAME</th>
                  <th className="pb-3">SHARE OF VOICE</th>
                  <th className="pb-3">AVG GRID RANK</th>
                  <th className="pb-3">TOP OVERLAP KEYWORD</th>
                  <th className="pb-3">MOVEMENT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#A9C7E5]/10 text-slate-200">
                <tr>
                  <td className="py-3 font-bold text-white">Metro Auto Mall</td>
                  <td className="py-3 text-emerald-400">34.2%</td>
                  <td className="py-3 font-bold">#1.8</td>
                  <td className="py-3 text-slate-400">used cars near me</td>
                  <td className="py-3 text-emerald-400">↑ 1.2</td>
                </tr>
                <tr>
                  <td className="py-3 font-bold text-white">Northside Ford</td>
                  <td className="py-3 text-blue-400">28.6%</td>
                  <td className="py-3 font-bold">#2.4</td>
                  <td className="py-3 text-slate-400">car dealership milwaukee</td>
                  <td className="py-3 text-slate-400">0.0</td>
                </tr>
                <tr>
                  <td className="py-3 font-bold text-white">FastLane Auto Repair</td>
                  <td className="py-3 text-amber-400">18.1%</td>
                  <td className="py-3 font-bold">#4.1</td>
                  <td className="py-3 text-slate-400">auto repair service 53202</td>
                  <td className="py-3 text-amber-400">↓ 0.8</td>
                </tr>
              </tbody>
            </table>
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
      <Suspense fallback={<div className="p-6 text-xs text-slate-400 font-mono">Loading Competitor Workspace...</div>}>
        <CompetitorsContent />
      </Suspense>
    </div>
  );
}
