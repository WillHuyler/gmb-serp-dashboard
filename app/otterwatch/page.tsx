'use client';

import React, { Suspense } from 'react';
import { useClient } from '../../lib/client-context';

export const dynamic = 'force-dynamic';

function OtterWatchContent() {
  const { activeClient } = useClient();
  const hasSerpLocation = Boolean(activeClient?.mappings?.brightlocal_location_id);

  return (
    <div className="p-8 space-y-6 bg-[#0B0F17] text-white min-h-screen font-sans">
      <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D99614] font-bold block">
            OTTERWATCH LOCAL SERP TELEMETRY
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            {activeClient?.name || 'Active Client'}
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Location ID: {activeClient?.mappings?.brightlocal_location_id || 'UNMAPPED'}
          </p>
        </div>

        <span className={`px-3 py-1 rounded text-xs font-mono font-bold border ${
          hasSerpLocation
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-slate-800 text-slate-400 border-slate-700'
        }`}>
          {hasSerpLocation ? 'MONITORING LIVE ✓' : 'UNAVAILABLE / NOT MONITORING'}
        </span>
      </div>

      {hasSerpLocation ? (
        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              5x5 GEO-GRID LOCAL RANKING MATRIX
            </h3>
            <span className="text-xs font-mono text-slate-400">Target Keyword: "local search query"</span>
          </div>

          <div className="grid grid-cols-5 gap-3 max-w-md mx-auto p-4 bg-[#0B0F17] rounded-xl border border-[#A9C7E5]/10">
            {[1, 2, 1, 3, 2, 2, 1, 1, 2, 3, 1, 1, 1, 2, 2, 3, 2, 1, 2, 4, 2, 3, 2, 1, 2].map((rank, i) => (
              <div
                key={i}
                className={`h-12 rounded-lg flex items-center justify-center font-mono font-bold text-sm border ${
                  rank === 1
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : rank <= 3
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                }`}
              >
                #{rank}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-12 text-center space-y-4 max-w-xl mx-auto mt-12">
          <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-xl">
            📍
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              NO VERIFIED SERP SCAN LOCATION MAPPED
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Map a BrightLocal or SERP provider location to <strong className="text-white">{activeClient?.name}</strong> to initialize 5x5 geo-grid scans.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OtterWatchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs font-mono text-slate-400">Loading OtterWatch...</div>}>
      <OtterWatchContent />
    </Suspense>
  );
}
