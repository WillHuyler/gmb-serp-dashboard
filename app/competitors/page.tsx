'use client';

import React, { Suspense } from 'react';
import { useClient } from '../../lib/client-context';

export const dynamic = 'force-dynamic';

function CompetitorsContent() {
  const { activeClient } = useClient();
  const hasSerpData = Boolean(activeClient?.mappings?.brightlocal_location_id);

  return (
    <div className="p-8 space-y-6 bg-[#0B0F17] text-white min-h-screen font-sans">
      <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D99614] font-bold block">
            LOCAL COMPETITIVE OVERLAP
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            {activeClient?.name || 'Active Client'}
          </h1>
        </div>
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
              Competitive node rankings generate directly from active OtterWatch geo-grid scans. Map a location for <strong className="text-white">{activeClient?.name}</strong> to view competitors.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-6 space-y-4">
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">LOCAL MAP PACK OVERLAP</h3>
          <p className="text-xs text-slate-300 font-mono">
            Sourced directly from 5x5 geo-grid observations for location {activeClient?.mappings?.brightlocal_location_id}.
          </p>
        </div>
      )}
    </div>
  );
}

export default function CompetitorsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs font-mono text-slate-400">Loading Competitors...</div>}>
      <CompetitorsContent />
    </Suspense>
  );
}
