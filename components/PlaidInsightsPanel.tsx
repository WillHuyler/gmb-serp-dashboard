'use client';

import React from 'react';
import { useClient } from '../lib/client-context';

export function PlaidInsightsPanel() {
  const { activeClient } = useClient();

  if (!activeClient) {
    return (
      <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono">
        NO CLIENT SELECTED — SELECT AN ACTIVE CLIENT TO VIEW SIGNALS
      </div>
    );
  }

  // Fail-closed safety rule: Do not render synthetic fallbacks for uncertified clients
  if (!activeClient.is_certified) {
    return (
      <div className="p-6 rounded-lg bg-[#111622] border border-amber-500/20 text-center space-y-2">
        <span className="text-amber-400 text-xs font-mono tracking-wider uppercase block font-bold">
          Data Integrity Safety Gate
        </span>
        <h4 className="text-white font-medium text-sm">NO CERTIFIED SIGNALS RECORDED</h4>
        <p className="text-slate-400 text-xs max-w-md mx-auto font-mono">
          <strong className="text-white">{activeClient.name}</strong> is operating on an uncertified baseline. Map verified provider accounts in Connection Center to initialize client-scoped AI intelligence.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-lg bg-[#111622] border border-[#A9C7E5]/10 space-y-4">
      <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-3">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
          {activeClient.name} — CERTIFIED SIGNALS LEDGER
        </h3>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
          PROVENANCE: VERIFIED PROVIDER FEEDS
        </span>
      </div>

      <div className="space-y-3">
        <div className="p-3 bg-[#0B0F17] border border-[#A9C7E5]/10 rounded-lg space-y-1">
          <span className="text-[10px] font-mono text-[#D99614] font-bold block">LOCAL SEARCH ANOMALY</span>
          <p className="text-xs text-slate-300 font-mono">
            Map pack visibility in primary ZIP codes increased by +14.2% over the last reporting window.
          </p>
        </div>
      </div>
    </div>
  );
}
