'use client';

import React from 'react';
import Link from 'next/link';
import { useClient } from '../lib/client-context';

export default function HomePage() {
  const { activeClient } = useClient();

  return (
    <div className="p-8 space-y-8 bg-[#0B0F17] text-white min-h-screen">
      <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">PORCHLIGHT DECISION PLATFORM</h1>
          <p className="text-sm text-slate-400 mt-1">
            Active Prospect Context: <strong className="text-amber-400 font-mono">{activeClient?.name || 'Loading Client...'}</strong>
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href={activeClient?.id ? `/outcome-lab?clientId=${activeClient.id}` : '/outcome-lab'}
            className="bg-amber-500 text-black text-xs font-mono font-bold px-4 py-2 rounded hover:bg-amber-400 transition-all"
          >
            LAUNCH OUTCOME LAB
          </Link>
          <Link
            href={activeClient?.id ? `/connection-center?clientId=${activeClient.id}` : '/connection-center'}
            className="bg-[#55A9E6]/10 border border-[#55A9E6]/30 text-[#55A9E6] text-xs font-mono font-bold px-4 py-2 rounded hover:bg-[#55A9E6]/20 transition-all"
          >
            CONNECTION CENTER
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-amber-400 font-mono text-sm">🎯</span>
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">REVERSE OUTCOME TARGETING</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Work backward from desired business outcomes ("What do we need to do to achieve Y?"). Back-solve required local SERP velocity, campaign budget caps, and conversion lift.
          </p>
        </div>

        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-[#55A9E6] font-mono text-sm">🔮</span>
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">FORWARD MODELING</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Predict outcomes from operational inputs ("What happens if we do X?"). Run probabilistic simulations on media budget shifts and local rank movements.
          </p>
        </div>
      </div>
    </div>
  );
}
