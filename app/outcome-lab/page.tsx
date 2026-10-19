'use client';

import React, { useState, Suspense } from 'react';
import { useClient } from '../../lib/client-context';

export const dynamic = 'force-dynamic';

function OutcomeLabContent() {
  const { activeClient } = useClient();
  const [mode, setMode] = useState<'REVERSE' | 'FORWARD'>('REVERSE');

  const isCertified = Boolean(activeClient?.is_certified);

  return (
    <div className="p-8 space-y-6 bg-[#0B0F17] text-white min-h-screen font-sans">
      <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D99614] font-bold block">
            OPPORTUNITY LAB DECISION ENGINE
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            {activeClient?.name || 'Active Client'}
          </h1>
        </div>

        <div className="flex space-x-2 bg-[#111622] p-1 rounded-lg border border-[#A9C7E5]/10">
          <button
            onClick={() => setMode('REVERSE')}
            className={`px-3 py-1.5 text-xs font-mono font-bold rounded transition-all ${
              mode === 'REVERSE' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            🎯 REVERSE TARGETING
          </button>
          <button
            onClick={() => setMode('FORWARD')}
            className={`px-3 py-1.5 text-xs font-mono font-bold rounded transition-all ${
              mode === 'FORWARD' ? 'bg-[#55A9E6] text-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            🔮 FORWARD MODELING
          </button>
        </div>
      </div>

      {!isCertified ? (
        <div className="bg-[#111622] border border-amber-500/30 rounded-xl p-12 text-center space-y-4 max-w-xl mx-auto mt-12">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-xl text-amber-400 font-mono font-bold">
            ⚠️
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono text-amber-400 uppercase tracking-wider">
              MODEL NOT READY — UNCERTIFIED BASELINE
            </h3>
            <p className="text-xs text-slate-300 mt-2 font-mono leading-relaxed">
              Predictive outcome simulations require verified source mappings for Google Ads and GA4. Map provider resources for <strong className="text-white">{activeClient?.name}</strong> to unlock modeling.
            </p>
          </div>
          <a
            href="/connection-center"
            className="inline-block bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold px-4 py-2 rounded hover:bg-amber-500/30 transition-all"
          >
            Verify Baseline Mappings →
          </a>
        </div>
      ) : (
        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-6 space-y-4">
          <h3 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
            CERTIFIED BASELINE SIMULATION READY
          </h3>
          <p className="text-xs text-slate-300 font-mono">
            {mode === 'REVERSE'
              ? 'Goal Planner: Back-solves required local SERP velocity and paid media mix to hit lead goals.'
              : 'What-If Scenario: Predicts lead volume lift based on proposed budget and rank adjustments.'}
          </p>
        </div>
      )}
    </div>
  );
}

export default function OutcomeLabPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs font-mono text-slate-400">Loading Opportunity Lab...</div>}>
      <OutcomeLabContent />
    </Suspense>
  );
}
