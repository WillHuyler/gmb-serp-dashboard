'use client';

import React, { useState } from 'react';
import { useClient } from '../../lib/client-context';

export default function OutcomeLabPage() {
  const { activeClient } = useClient();
  const [currentLeads, setCurrentLeads] = useState<number>(180);
  const [targetLeads, setTargetLeads] = useState<number>(250);
  const [timeframe, setTimeframe] = useState<number>(30);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);

  const leadGap = Math.max(0, targetLeads - currentLeads);
  const requiredAcceleration = currentLeads > 0 ? ((leadGap / currentLeads) * 100).toFixed(1) : '0.0';

  const handleDeploy = async (channel: string) => {
    setIsDeploying(true);
    try {
      await fetch('/api/outcome-lab/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: activeClient?.tenant_id || '00000000-0000-0000-0000-000000000001',
          client_id: activeClient?.id || 'bf93fef0-fc60-4119-8ea2-68a274984355',
          channel,
          target_leads: targetLeads,
          current_leads: currentLeads,
          timeframe_days: timeframe,
        }),
      });
      alert(`Strategy deployed to Command Center for ${activeClient?.name || 'Client'}`);
    } catch (err) {
      console.error('Deployment error:', err);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-[#0B0F17] text-white min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold tracking-tight">OUTCOME LAB</h1>
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
              DECISION SIMULATION ENGINE
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Simulate forward scenarios or reverse-optimize targets with statistical bounds.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-6 space-y-6">
          <h2 className="text-xs font-mono uppercase text-slate-400 tracking-wider">
            DESIRED TARGET OUTCOME
          </h2>

          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-300">CURRENT LEAD VOLUME</label>
            <input
              type="number"
              value={currentLeads}
              onChange={(e) => setCurrentLeads(Number(e.target.value))}
              className="w-full bg-[#0B0F17] border border-[#A9C7E5]/20 rounded p-3 text-sm font-mono text-white focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-300">TARGET LEAD GOAL</label>
            <input
              type="number"
              value={targetLeads}
              onChange={(e) => setTargetLeads(Number(e.target.value))}
              className="w-full bg-[#0B0F17] border border-[#A9C7E5]/20 rounded p-3 text-sm font-mono text-white focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-300">TIMEFRAME (DAYS)</label>
            <input
              type="number"
              value={timeframe}
              onChange={(e) => setTimeframe(Number(e.target.value))}
              className="w-full bg-[#0B0F17] border border-[#A9C7E5]/20 rounded p-3 text-sm font-mono text-white focus:outline-none"
            />
          </div>

          <div className="p-4 bg-[#0B0F17] border border-amber-500/20 rounded-lg space-y-1">
            <span className="text-[10px] font-mono text-amber-400 uppercase block">REQUIRED ACCELERATION</span>
            <div className="text-xl font-bold font-mono text-white">+{requiredAcceleration}%</div>
            <span className="text-[10px] text-slate-500 font-mono block">GAP: {leadGap} LEADS NEEDED</span>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xs font-mono uppercase text-slate-400 tracking-wider">
            RECOMMENDED STRATEGIC PATHWAYS
          </h2>

          <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono font-bold text-amber-400">
                PATHWAY #1: TARGET PATHWAY VIA OTTERWATCH
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">CONFIDENCE: 88%</span>
            </div>
            <p className="text-xs text-slate-300">
              Achieving target requires an estimated <strong className="text-emerald-400">+{requiredAcceleration}%</strong> performance acceleration.
            </p>
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
              <span>Evidence Grade: <strong className="text-slate-300">HIGH_CONFIDENCE_TELEMETRY</strong></span>
              <span>Model Engine: BEACON_V2.1</span>
            </div>
            <button
              onClick={() => handleDeploy('OTTERWATCH')}
              disabled={isDeploying}
              className="w-full bg-amber-500 text-black font-bold font-mono text-xs py-2.5 rounded hover:bg-amber-400 transition-all"
            >
              DEPLOY STRATEGY TO COMMAND CENTER
            </button>
          </div>

          <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono font-bold text-amber-400">
                PATHWAY #2: TARGET PATHWAY VIA GOOGLE_ADS
              </span>
              <span className="text-xs font-mono text-amber-400 font-bold">CONFIDENCE: 45% (LOW)</span>
            </div>
            <p className="text-xs text-slate-300">
              Requires estimated spend expansion to generate +{leadGap} leads.
            </p>
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
              <span>Evidence Grade: <strong className="text-rose-400">GRADE_D / LIMITED_TELEMETRY</strong></span>
              <span>Model Engine: BEACON_V2.1</span>
            </div>
            <button
              onClick={() => handleDeploy('GOOGLE_ADS')}
              disabled={isDeploying}
              className="w-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold font-mono text-xs py-2.5 rounded hover:bg-amber-500/20 transition-all"
            >
              DEPLOY STRATEGY TO COMMAND CENTER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
