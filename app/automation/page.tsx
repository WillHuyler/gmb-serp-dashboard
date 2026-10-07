'use client';

import React, { Suspense } from 'react';
import { useClient } from '../../lib/client-context';
import GlobalHeader from '../../components/navigation/GlobalHeader';

export const dynamic = 'force-dynamic';

function AutomationContent() {
  const { activeClient } = useClient();

  const isCertified = Boolean(activeClient?.is_certified);

  if (!activeClient) {
    return (
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        <div className="p-8 rounded-xl bg-[#111622] border border-[#A9C7E5]/10 text-center text-slate-400 text-xs font-mono">
          NO CLIENT SELECTED — SELECT AN ACTIVE CLIENT TO VIEW AUTOMATION WORKFLOWS
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D99614] font-bold block">
            WORKFLOW ENGINE • REAL-TIME DISPATCH
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Automation & Trigger Rules</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated alerts, lead dispatches, and signal webhooks for <strong className="text-white">{activeClient.name}</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <span
            className={`text-xs font-mono px-3 py-1 rounded border font-bold ${
              isCertified
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {isCertified ? '✓ TRIGGERS ACTIVE' : '⚠ AUTOMATION GAITED'}
          </span>
        </div>
      </div>

      {!isCertified ? (
        <div className="p-8 rounded-xl bg-[#111622] border border-[#A9C7E5]/10 text-center space-y-3">
          <span className="text-amber-400 text-xs font-mono tracking-widest uppercase block font-bold">
            Execution Guard Active
          </span>
          <h2 className="text-xl font-bold text-white">AUTOMATION TRIGGERS GAITED</h2>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            <strong className="text-white">{activeClient.name}</strong> is operating on an uncertified baseline[cite: 1]. Connect required integration providers in Connection Center to enable automated webhook triggers and lead dispatches.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">SIGNAL TRIGGER</span>
                  <h3 className="text-sm font-bold text-white mt-0.5">SERP Drop Alert</h3>
                </div>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                  ENABLED
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Fires a Slack / Email notification when OtterWatch 5x5 average rank drops below position #5.0.
              </p>
              <div className="pt-2 border-t border-[#A9C7E5]/10 flex justify-between text-[11px] font-mono text-slate-400">
                <span>Last Dispatched: 2 hours ago</span>
                <span className="text-emerald-400">200 OK</span>
              </div>
            </div>

            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">LEAD ROUTING</span>
                  <h3 className="text-sm font-bold text-white mt-0.5">Webhook Dispatch</h3>
                </div>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                  ENABLED
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Routes high-intent qualified leads directly to the client CRM endpoint.
              </p>
              <div className="pt-2 border-t border-[#A9C7E5]/10 flex justify-between text-[11px] font-mono text-slate-400">
                <span>Last Dispatched: Today at 14:15 UTC</span>
                <span className="text-emerald-400">200 OK</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function AutomationPage() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col font-sans">
      <Suspense fallback={<div className="p-6 text-xs text-slate-400 font-mono">Loading Header...</div>}>
        <GlobalHeader />
      </Suspense>
      <Suspense fallback={<div className="p-6 text-xs text-slate-400 font-mono">Loading Automation Workflows...</div>}>
        <AutomationContent />
      </Suspense>
    </div>
  );
}
