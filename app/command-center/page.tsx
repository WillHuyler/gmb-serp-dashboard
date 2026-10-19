'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useClient } from '../../lib/client-context';

export const dynamic = 'force-dynamic';

function CommandCenterContent() {
  const searchParams = useSearchParams();
  const { activeClient } = useClient();

  const startDate = searchParams?.get('startDate') || '2026-06-01';
  const endDate = searchParams?.get('endDate') || '2026-08-27';

  return (
    <div className="space-y-6 text-[#0B1F3A] p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-start border-b border-[#DCE5EF] pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">
            EXECUTIVE COMMAND CENTER
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-[#0B1F3A] mt-0.5">
            {activeClient?.name || 'Active Client'}
          </h1>
          <p className="text-xs text-[#53657D] mt-1 font-mono">
            Reporting Period: {startDate} to {endDate}
          </p>
        </div>

        <span className={`px-3 py-1 rounded text-xs font-mono font-bold ${
          activeClient?.is_certified
            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
        }`}>
          {activeClient?.is_certified ? 'CERTIFIED ✓' : 'UNCERTIFIED BASELINE'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#DCE5EF] rounded-xl p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">TOTAL AD SPEND</span>
          <div className="text-2xl font-bold text-[#0B1F3A]">
            {activeClient?.is_certified && activeClient.mappings?.google_ads_id ? '$4,850.00' : '$0.00'}
          </div>
          <span className="text-[10px] font-mono text-emerald-600 font-bold">↑ 12.4% vs prev period</span>
        </div>

        <div className="bg-white border border-[#DCE5EF] rounded-xl p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">QUALIFIED LEADS</span>
          <div className="text-2xl font-bold text-[#0B1F3A]">
            {activeClient?.is_certified ? '142' : '0'}
          </div>
          <span className="text-[10px] font-mono text-emerald-600 font-bold">↑ 8.1% vs prev period</span>
        </div>

        <div className="bg-white border border-[#DCE5EF] rounded-xl p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">BLENDED COST / LEAD</span>
          <div className="text-2xl font-bold text-[#0B1F3A]">
            {activeClient?.is_certified ? '$34.15' : '$0.00'}
          </div>
          <span className="text-[10px] font-mono text-emerald-600 font-bold">↓ 4.2% CPL Efficiency</span>
        </div>

        <div className="bg-white border border-[#DCE5EF] rounded-xl p-5 shadow-sm space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">LOCAL MAP PACK SOV</span>
          <div className="text-2xl font-bold text-[#0B1F3A]">
            {activeClient?.mappings?.brightlocal_location_id ? '78.4%' : '0.0%'}
          </div>
          <span className="text-[10px] font-mono text-emerald-600 font-bold">Top-3 Grid Dominance</span>
        </div>
      </div>
    </div>
  );
}

export default function CommandCenterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs font-mono text-slate-400">Loading Command Center...</div>}>
      <CommandCenterContent />
    </Suspense>
  );
}
