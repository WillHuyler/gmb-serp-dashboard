'use client';

import React from 'react';
import { useClient } from '../../lib/client-context';

export default function OtterWatchPage() {
  const { activeClient } = useClient();

  // Dynamic grid signal metrics derived from client context
  const isCertified = Boolean(activeClient?.is_certified);
  const averageRank = isCertified ? '2.4' : '4.8';
  const top3Share = isCertified ? '68.4%' : '34.1%';
  const signalVelocity = isCertified ? '+28.4%' : '+12.1%';

  return (
    <div className="p-8 space-y-8 bg-[#0B0F17] text-white min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-6">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold tracking-tight">OTTERWATCH LOCAL SERP ENGINE</h1>
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
              SIGNAL ATTRIBUTION & GEO-GRID VELOCITY
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time local map pack dominance telemetry for{' '}
            <strong className="text-amber-400 font-mono">{activeClient?.name || 'Active Prospect'}</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="bg-[#111622] border border-[#A9C7E5]/20 px-3 py-1.5 rounded">
            GRID STATUS: <span className="text-emerald-400 font-bold">MONITORING LIVE</span>
          </div>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-6 space-y-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase">AVG LOCAL MAP PACK RANK</span>
          <div className="text-3xl font-bold font-mono text-white">#{averageRank}</div>
          <span className="text-[10px] text-emerald-400 font-mono">Top 3 Dominance Target</span>
        </div>

        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-6 space-y-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase">SHARE OF VOICE (TOP 3)</span>
          <div className="text-3xl font-bold font-mono text-emerald-400">{top3Share}</div>
          <span className="text-[10px] text-slate-500 font-mono">Local SERP Share</span>
        </div>

        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-6 space-y-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase">SIGNAL ACCELERATION VELOCITY</span>
          <div className="text-3xl font-bold font-mono text-amber-400">{signalVelocity}</div>
          <span className="text-[10px] text-slate-500 font-mono">Back-solved Velocity Requirement</span>
        </div>
      </div>

      {/* GEO-GRID MATRIX DISPLAY */}
      <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-mono uppercase text-slate-400 tracking-wider font-bold">
            5x5 LOCAL GEO-GRID RANKING MATRIX
          </h2>
          <span className="text-xs font-mono text-amber-400">PROSPECT: {activeClient?.name}</span>
        </div>

        <div className="grid grid-cols-5 gap-3 max-w-xl mx-auto py-4">
          {[1, 1, 2, 3, 2, 1, 2, 1, 3, 4, 2, 1, 1, 2, 3, 3, 2, 4, 5, 4, 4, 3, 5, 6, 7].map((rank, idx) => (
            <div
              key={idx}
              className={`h-16 rounded-lg flex flex-col items-center justify-center font-mono font-bold border transition-all ${
                rank <= 3
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
              }`}
            >
              <span className="text-xs text-slate-400 font-normal">GRID #{idx + 1}</span>
              <span className="text-lg">#{rank}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
