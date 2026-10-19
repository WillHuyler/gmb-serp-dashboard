'use client';

import React, { Suspense } from 'react';
import { useClient } from '../../lib/client-context';

export const dynamic = 'force-dynamic';

function AutomationContent() {
  const { activeClient } = useClient();

  return (
    <div className="p-8 space-y-6 bg-[#0B0F17] text-white min-h-screen font-sans">
      <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D99614] font-bold block">
            WORKFLOW AUTOMATION & RULES
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            {activeClient?.name || 'Active Client'}
          </h1>
        </div>
      </div>

      <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-12 text-center space-y-4 max-w-xl mx-auto mt-12">
        <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-xl">
          ⚡
        </div>
        <div>
          <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
            AUTOMATION ENGINE IDLE
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Automations trigger upon verified signal anomalies for <strong className="text-white">{activeClient?.name}</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AutomationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs font-mono text-slate-400">Loading Automation...</div>}>
      <AutomationContent />
    </Suspense>
  );
}
