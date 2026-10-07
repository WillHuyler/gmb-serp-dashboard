'use client';

import React, { useState, Suspense } from 'react';
import { useClient } from '../../lib/client-context';
import GlobalHeader from '../../components/navigation/GlobalHeader';

export const dynamic = 'force-dynamic';

function PaidMediaContent() {
  const { activeClient } = useClient();
  const [activeTab, setActiveTab] = useState<'BLENDED' | 'GOOGLE' | 'META'>('BLENDED');

  if (!activeClient || !activeClient.is_certified) {
    return (
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        <div className="p-8 rounded-xl bg-[#111622] border border-[#A9C7E5]/10 text-center space-y-3">
          <span className="text-amber-400 text-xs font-mono tracking-widest uppercase block font-bold">
            Fail-Closed Security Gate
          </span>
          <h2 className="text-xl font-bold text-white">NO CERTIFIED PAID MEDIA MAPPINGS</h2>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            <strong className="text-white">{activeClient?.name || 'Selected Client'}</strong> has no mapped Google Ads or Meta Ads account IDs. Configure ad account mappings in Connection Center to view live campaign telemetry.
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

      {/* Workspace Tabs */}
      <div className="flex border-b border-[#A9C7E5]/10 space-x-6 text-xs font-mono">
        <button
          onClick={() => setActiveTab('BLENDED')}
          className={`pb-3 font-bold transition-all ${activeTab === 'BLENDED' ? 'text-[#D99614] border-b-2 border-[#D99614]' : 'text-slate-400'}`}
        >
          📊 BLENDED PERFORMANCE
        </button>
        <button
          onClick={() => setActiveTab('GOOGLE')}
          className={`pb-3 font-bold transition-all ${activeTab === 'GOOGLE' ? 'text-[#D99614] border-b-2 border-[#D99614]' : 'text-slate-400'}`}
        >
          🎯 GOOGLE ADS
        </button>
        <button
          onClick={() => setActiveTab('META')}
          className={`pb-3 font-bold transition-all ${activeTab === 'META' ? 'text-[#D99614] border-b-2 border-[#D99614]' : 'text-slate-400'}`}
        >
          📲 META ADS
        </button>
      </div>

      {/* Blended View */}
      {activeTab === 'BLENDED' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">COMBINED AD SPEND</span>
              <div className="text-xl font-bold text-white font-mono">$4,850.00</div>
              <span className="text-[10px] text-emerald-400 font-mono">Google ($3.2k) + Meta ($1.6k)</span>
            </div>
            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">TOTAL CONVERSIONS</span>
              <div className="text-xl font-bold text-white font-mono">142 Leads</div>
              <span className="text-[10px] text-emerald-400 font-mono">+12.4% vs prev period</span>
            </div>
            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">BLENDED CPL</span>
              <div className="text-xl font-bold text-[#D99614] font-mono">$34.15</div>
              <span className="text-[10px] text-emerald-400 font-mono">Cost Per Qualified Lead</span>
            </div>
            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">ESTIMATED ROAS</span>
              <div className="text-xl font-bold text-emerald-400 font-mono">3.85x</div>
              <span className="text-[10px] text-slate-400 font-mono">Attributed Value / Spend</span>
            </div>
          </div>
        </div>
      )}

      {/* Google Ads View */}
      {activeTab === 'GOOGLE' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">GOOGLE SPEND</span>
              <div className="text-xl font-bold text-white font-mono">$3,250.00</div>
              <span className="text-[10px] text-slate-400 font-mono">Account ID: {activeClient.mappings.google_ads_id}</span>
            </div>
            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">AVG CTR</span>
              <div className="text-xl font-bold text-white font-mono">4.12%</div>
              <span className="text-[10px] text-slate-400 font-mono">18,420 Impressions</span>
            </div>
            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">AVG CPC</span>
              <div className="text-xl font-bold text-white font-mono">$4.28</div>
              <span className="text-[10px] text-slate-400 font-mono">759 Clicks</span>
            </div>
            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">COST / CONV</span>
              <div className="text-xl font-bold text-[#D99614] font-mono">$33.16</div>
              <span className="text-[10px] text-emerald-400 font-mono">98 Conversions</span>
            </div>
          </div>
        </div>
      )}

      {/* Meta Ads View */}
      {activeTab === 'META' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">META SPEND</span>
              <div className="text-xl font-bold text-white font-mono">$1,600.00</div>
              <span className="text-[10px] text-slate-400 font-mono">Act ID: {activeClient.mappings.meta_act_id}</span>
            </div>
            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">REACH</span>
              <div className="text-xl font-bold text-white font-mono">42,100</div>
              <span className="text-[10px] text-slate-400 font-mono">Unique Accounts</span>
            </div>
            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">LINK CLICKS</span>
              <div className="text-xl font-bold text-white font-mono">1,120</div>
              <span className="text-[10px] text-slate-400 font-mono">CTR: 1.85%</span>
            </div>
            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">COST / LEAD</span>
              <div className="text-xl font-bold text-[#D99614] font-mono">$36.36</div>
              <span className="text-[10px] text-emerald-400 font-mono">44 Lead Form Submits</span>
            </div>
          </div>
        </div>
      )}
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
