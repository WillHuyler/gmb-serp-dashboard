'use client';

import React from 'react';
import Link from 'next/link';
import { useClient } from '../../lib/client-context';
import GlobalHeader from '../../components/navigation/GlobalHeader';

export default function PaidMediaPage() {
  const { activeClient } = useClient();

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col font-sans">
      <GlobalHeader />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">
            INTELLIGENCE MODULE • PAID MEDIA
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            {activeClient?.name || 'No Client Selected'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Google Ads, Meta Ads, and paid acquisition channel telemetry.
          </p>
        </div>

        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-12 text-center space-y-4 max-w-2xl mx-auto my-12">
          <div className="w-12 h-12 bg-[#151D2A] border border-[#A9C7E5]/20 rounded-full flex items-center justify-center mx-auto text-xl">
            📈
          </div>
          <div>
            <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              PAID MEDIA CONNECTORS NOT MAPPED
            </h2>
            <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
              Google Ads or Meta Ads accounts are not yet mapped to <strong className="text-white">{activeClient?.name || 'this client'}</strong>. No paid media performance telemetry is available.
            </p>
          </div>
          <Link
            href={`/connection-center?clientId=${activeClient?.id || ''}`}
            className="inline-block bg-[#D99614] hover:bg-[#B97A08] text-[#0B0F17] font-mono font-bold text-xs px-5 py-2.5 rounded shadow-sm transition-all"
          >
            Map Accounts in Connection Center →
          </Link>
        </div>
      </main>
    </div>
  );
}
