'use client';

import React, { useState, Suspense } from 'react';
import { useClient } from '../../lib/client-context';
import GlobalHeader from '../../components/navigation/GlobalHeader';

export const dynamic = 'force-dynamic';

function SettingsContent() {
  const { activeClient } = useClient();
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  return (
    <main className="flex-1 p-8 space-y-6 max-w-7xl w-full mx-auto font-sans">
      <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D99614] font-bold block">
            TENANT & CLIENT CONFIGURATION
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            {activeClient?.name || 'Active Client'}
          </h1>
        </div>

        <button
          onClick={() => setShowDiagnostics(!showDiagnostics)}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono px-3 py-1.5 rounded transition-all"
        >
          {showDiagnostics ? 'HIDE DIAGNOSTICS' : '🔒 SHOW ADMIN DIAGNOSTICS'}
        </button>
      </div>

      <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-6 space-y-4 max-w-2xl">
        <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider border-b border-[#A9C7E5]/10 pb-3">
          ACTIVE CLIENT PROVENANCE & CERTIFICATION SUMMARY
        </h3>
        
        <div className="space-y-3 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-slate-400">Client Profile:</span>
            <span className="text-white font-bold">{activeClient?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Certification State:</span>
            <span className={activeClient?.is_certified ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {activeClient?.is_certified ? 'PORCHLIGHT CERTIFIED ✓' : 'UNCERTIFIED BASELINE'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Mapped Service Areas:</span>
            <span className="text-slate-200">
              {activeClient?.service_areas?.join(', ') || 'Default Service Region'}
            </span>
          </div>
        </div>

        {showDiagnostics && (
          <div className="pt-4 border-t border-amber-500/20 space-y-2 text-[11px] font-mono text-amber-300/80 bg-amber-500/5 p-4 rounded-lg">
            <span className="font-bold text-amber-400 block uppercase text-[10px]">
              PRIVILEGED ADMIN KEYS
            </span>
            <div className="flex justify-between">
              <span>Client UUID:</span>
              <span className="text-white font-mono">{activeClient?.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Tenant UUID:</span>
              <span className="text-white font-mono">{activeClient?.tenant_id}</span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col font-sans">
      <Suspense fallback={<div className="p-6 text-xs text-slate-400 font-mono">Loading Header...</div>}>
        <GlobalHeader />
      </Suspense>
      <Suspense fallback={<div className="p-6 text-xs text-slate-400 font-mono">Loading Settings Workspace...</div>}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}
