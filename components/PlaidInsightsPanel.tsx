'use client';

import React from 'react';
import { useClient } from '../lib/client-context';

export function PlaidInsightsPanel() {
  const { activeClient } = useClient();

  // Fail-Closed Security Gate: If client is uncertified or missing, halt AI insight rendering
  if (!activeClient?.is_certified) {
    return (
      <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-6 text-center space-y-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
          AI SIGNAL ISOLATION • FAIL-CLOSED GATE
        </span>
        <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
          NO CERTIFIED SIGNALS RECORDED
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto font-mono">
          Active client (<strong className="text-white">{activeClient?.name || 'Unassigned'}</strong>) has no certified integration baseline[cite: 1]. AI signal synthesis and recommendation vectors are suspended to prevent cross-tenant telemetry contamination[cite: 1].
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-4">
      <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-3">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D99614] font-bold block">
            PLAID AI INTELLIGENCE LEDGER
          </span>
          <h2 className="text-sm font-bold text-white uppercase font-mono">
            CERTIFIED INSIGHT VECTORS • {activeClient.name}
          </h2>
        </div>
        <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
          ISOLATED & VERIFIED
        </span>
      </div>

      <div className="space-y-3">
        <div className="p-3 bg-[#151D2A] border border-[#A9C7E5]/10 rounded-lg space-y-1">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-white font-bold">Local SERP Momentum Optimization</span>
            <span className="text-[#D99614]">HIGH IMPACT</span>
          </div>
          <p className="text-xs text-slate-300 font-sans">
            5x5 grid analysis indicates top-3 map pack dominance in core geographic nodes. Recommend increasing local review response velocity to maintain rank stability.
          </p>
        </div>
      </div>
    </div>
  );
}
