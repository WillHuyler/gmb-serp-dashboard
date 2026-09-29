'use client';

import React from 'react';
import { useClient } from '../../lib/client-context';

export default function ReputationPage() {
  const { activeClient } = useClient();

  return (
    <div className="space-y-6 text-[#0B1F3A]">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">
            REPUTATION & REVIEWS
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-[#0B1F3A] mt-0.5">
            {activeClient?.name || 'Active Client'}
          </h1>
          <p className="text-xs text-[#53657D] mt-1">
            Review velocity, sentiment tracking, and GMB rating telemetry.
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#DCE5EF] rounded-xl p-12 text-center space-y-4 shadow-sm max-w-2xl mx-auto mt-12">
        <div className="w-12 h-12 bg-[#F4F7FB] border border-[#DCE5EF] rounded-full flex items-center justify-center mx-auto text-xl">
          ⭐
        </div>
        <div>
          <h3 className="text-sm font-bold font-mono text-[#0B1F3A] uppercase tracking-wider">
            REPUTATION PROVIDER UNMAPPED
          </h3>
          <p className="text-xs text-[#53657D] mt-1 max-w-md mx-auto">
            Google Business Profile reviews and third-party reputation feeds are awaiting certified account mapping for <strong className="text-[#0B1F3A]">{activeClient?.name || 'this client'}</strong>.
          </p>
        </div>
        <a
          href="/connection-center"
          className="inline-block bg-[#0B1F3A] hover:bg-[#142E52] text-white font-mono font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm transition-all"
        >
          Map Reputation Accounts →
        </a>
      </div>
    </div>
  );
}
