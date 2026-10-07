'use client';

import React, { Suspense } from 'react';
import { useClient } from '../../lib/client-context';
import GlobalHeader from '../../components/navigation/GlobalHeader';

export const dynamic = 'force-dynamic';

function PaidMediaContent() {
  const { activeClient } = useClient();

  if (!activeClient || !activeClient.is_certified) {
    return (
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        <div className="p-8 rounded-xl bg-[#111622] border border-[#A9C7E5]/10 text-center space-y-3">
          <span className="text-amber-400 text-xs font-mono tracking-widest uppercase block font-bold">
            Fail-Closed Security Gate
          </span>
          <h2 className="text-xl font-bold text-white">NO CERTIFIED PAID MEDIA MAPPINGS</h2>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            <strong className="text-white">{activeClient?.name || 'Selected Client'}</strong> has no mapped Google Ads or Meta Ads account IDs[cite: 1]. Configure ad account mappings in Connection Center to view live campaign telemetry.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D99614] font-bold block">
            PAID ACQUISITION WORKSPACE
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Paid Media Analytics</h1>
          <p className="text-xs text-slate-400 mt-1">
            Normalized Google Ads & Meta Ads performance metrics for <strong className="text-white">{activeClient.name}</strong>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">GOOGLE ADS SPEND</span>
          <div className="text-xl font-bold text-white font-mono">$0.00</div>
          <span className="text-[10px] text-emerald-400 font-mono">ACCOUNT MAPPED</span>
        </div>
        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">META ADS SPEND</span>
          <div className="text-xl font-bold text-white font-mono">$0.00</div>
          <span className="text-[10px] text-emerald-400 font-mono">ACCOUNT MAPPED</span>
        </div>
        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">BLENDED CPL</span>
          <div className="text-xl font-bold text-[#D99614] font-mono">—</div>
          <span className="text-[10px] text-slate-500 font-mono">CALCULATED AT INGESTION</span>
        </div>
      </div>
    </main>
  );
}

export default function PaidMediaPage() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col font-sans">
      <Suspense fallback={<div className="p-6 text-xs text-slate-400 font-mono">Loading Header...</div>}>
        <GlobalHeader />
      </Suspense>
      <Suspense fallback={<div className="p-6 text-xs text-slate-400 font-mono">Loading Paid Media...</div>}>
        <PaidMediaContent />
      </Suspense>
    </div>
  );
}
