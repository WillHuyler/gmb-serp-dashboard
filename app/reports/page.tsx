'use client';

import React, { Suspense } from 'react';
import { useClient } from '../../lib/client-context';

export const dynamic = 'force-dynamic';

function ReportsContent() {
  const { activeClient } = useClient();
  const isCertified = Boolean(activeClient?.is_certified);

  return (
    <div className="p-8 space-y-6 bg-[#0B0F17] text-white min-h-screen font-sans">
      <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D99614] font-bold block">
            EXECUTIVE REPORTING WORKSPACE
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            {activeClient?.name || 'Active Client'}
          </h1>
        </div>
      </div>

      {!isCertified ? (
        <div className="bg-[#111622] border border-amber-500/30 rounded-xl p-12 text-center space-y-4 max-w-xl mx-auto mt-12">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-xl text-amber-400 font-mono font-bold">
            📄
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono text-amber-400 uppercase tracking-wider">
              EXPORT GATED ON DATA CERTIFICATION
            </h3>
            <p className="text-xs text-slate-300 mt-2 font-mono leading-relaxed">
              PDF exports require valid provider account mappings and verified baseline metrics for <strong className="text-white">{activeClient?.name}</strong>.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-6 space-y-4">
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">CERTIFIED REPORT GENERATOR</h3>
          <button className="bg-amber-500 text-black text-xs font-mono font-bold px-4 py-2 rounded hover:bg-amber-400 transition-all">
            EXPORT CERTIFIED PDF REPORT
          </button>
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs font-mono text-slate-400">Loading Reports...</div>}>
      <ReportsContent />
    </Suspense>
  );
}
