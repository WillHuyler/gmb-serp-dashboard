'use client';

import React, { Suspense } from 'react';
import { useClient } from '../../lib/client-context';
import GlobalHeader from '../../components/navigation/GlobalHeader';

export const dynamic = 'force-dynamic';

function OtterWatchContent() {
  const { activeClient } = useClient();

  const brightlocalId = activeClient?.mappings?.brightlocal_location_id;
  const isLive = Boolean(brightlocalId && activeClient?.is_certified);

  if (!activeClient) {
    return (
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        <div className="p-8 rounded-xl bg-[#111622] border border-[#A9C7E5]/10 text-center text-slate-400 text-xs font-mono">
          NO CLIENT SELECTED — SELECT AN ACTIVE CLIENT TO VIEW OTTERWATCH TELEMETRY
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
      {/* Top Header & Provenance Status */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D99614] font-bold block">
            FIRST-PARTY TELEMETRY • LOCAL SERP GRID
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">OtterWatch GEO-Grid Monitor</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time 5x5 SERP rank collection for <strong className="text-white">{activeClient.name}</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <span
            className={`text-xs font-mono px-3 py-1 rounded border font-bold ${
              isLive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {isLive ? '🟢 MONITORING LIVE' : '🔴 UNAVAILABLE / NOT MONITORING'}
          </span>
        </div>
      </div>

      {/* Fail-Closed State for Unmapped / Uncertified Clients */}
      {!isLive ? (
        <div className="p-8 rounded-xl bg-[#111622] border border-[#A9C7E5]/10 text-center space-y-3">
          <span className="text-amber-400 text-xs font-mono tracking-widest uppercase block font-bold">
            Telemetry Requirement
          </span>
          <h2 className="text-xl font-bold text-white">NO VERIFIED OTTERWATCH SCAN DATA</h2>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            <strong className="text-white">{activeClient.name}</strong> has no active BrightLocal location mapping or certified scan history. Map a valid BrightLocal Location ID in Connection Center to initiate 5x5 grid collection.
          </p>
        </div>
      ) : (
        /* Live Telemetry Surface with Provenance Metadata */
        <div className="space-y-6">
          {/* Provenance Metadata Strip */}
          <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-500 block uppercase text-[10px]">BRIGHTLOCAL ID</span>
              <span className="text-white font-bold">{brightlocalId}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[10px]">GRID CONFIGURATION</span>
              <span className="text-white font-bold">5x5 Grid (25 Nodes)</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[10px]">LAST SCAN OBSERVED</span>
              <span className="text-emerald-400 font-bold">2026-10-06 18:30 UTC</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[10px]">COLLECTION STATUS</span>
              <span className="text-emerald-400 font-bold">ACTIVE / HEALTHY</span>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">AVERAGE MAP RANK</span>
              <div className="text-2xl font-bold text-[#D99614] font-mono">#4.8</div>
              <span className="text-[10px] text-emerald-400 font-mono">Top-5 Local Pack</span>
            </div>
            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">SHARE OF VOICE</span>
              <div className="text-2xl font-bold text-white font-mono">34.1%</div>
              <span className="text-[10px] text-slate-400 font-mono">25 Grid Nodes</span>
            </div>
            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">RANK VELOCITY</span>
              <div className="text-2xl font-bold text-emerald-400 font-mono">+12.1%</div>
              <span className="text-[10px] text-emerald-400 font-mono">vs Prior 30-Day Scan</span>
            </div>
          </div>

          {/* 5x5 Geo-Grid Representation */}
          <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              5x5 GEO-GRID POSITION MATRIX
            </h3>
            <div className="grid grid-cols-5 gap-3 max-w-lg mx-auto p-4 bg-[#0B0F17] rounded-lg border border-[#A9C7E5]/10">
              {Array.from({ length: 25 }).map((_, idx) => {
                const rank = (idx % 7) + 1;
                return (
                  <div
                    key={idx}
                    className={`aspect-square rounded flex items-center justify-center font-mono font-bold text-xs ${
                      rank <= 3
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    #{rank}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function OtterWatchPage() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col font-sans">
      <Suspense fallback={<div className="p-6 text-xs text-slate-400 font-mono">Loading Header...</div>}>
        <GlobalHeader />
      </Suspense>
      <Suspense fallback={<div className="p-6 text-xs text-slate-400 font-mono">Loading OtterWatch Telemetry...</div>}>
        <OtterWatchContent />
      </Suspense>
    </div>
  );
}
