'use client';

import React, { Suspense } from 'react';
import { useClient } from '../../lib/client-context';

export const dynamic = 'force-dynamic';

function PaidMediaContent() {
  const { activeClient } = useClient();
  const hasAdsMapping = Boolean(activeClient?.mappings?.google_ads_id || activeClient?.mappings?.meta_act_id);

  return (
    <div className="p-8 space-y-6 bg-[#0B0F17] text-white min-h-screen font-sans">
      <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D99614] font-bold block">
            PAID MEDIA PERFORMANCE
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            {activeClient?.name || 'Active Client'}
          </h1>
        </div>

        <span className={`px-3 py-1 rounded text-xs font-mono font-bold border ${
          hasAdsMapping
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        }`}>
          {hasAdsMapping ? 'PAID MEDIA CONNECTED ✓' : 'UNMAPPED / DATA UNAVAILABLE'}
        </span>
      </div>

      {!hasAdsMapping ? (
        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-12 text-center space-y-4 max-w-xl mx-auto mt-12">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-xl text-amber-400">
            🎯
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              GOOGLE ADS / META DATA UNAVAILABLE
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              No verified ad customer account is mapped to <strong className="text-white">{activeClient?.name}</strong>. Data is kept fail-closed until an explicit mapping is confirmed.
            </p>
          </div>
          <a
            href="/connection-center"
            className="inline-block bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold px-4 py-2 rounded hover:bg-amber-500/30 transition-all"
          >
            Configure Account Mappings →
          </a>
        </div>
      ) : (
        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-6 space-y-4">
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">ACTIVE AD ACCOUNTS</h3>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Google Ads Customer ID:</span>
              <span className="text-white font-bold">{activeClient?.mappings?.google_ads_id || 'NONE'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Meta Ads Account ID:</span>
              <span className="text-white font-bold">{activeClient?.mappings?.meta_act_id || 'NONE'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaidMediaPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs font-mono text-slate-400">Loading Paid Media...</div>}>
      <PaidMediaContent />
    </Suspense>
  );
}
