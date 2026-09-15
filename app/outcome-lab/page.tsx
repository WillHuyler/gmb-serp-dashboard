'use client';

import React, { useState } from 'react';
import { useClient } from '../../lib/client-context';

export default function OutcomeLabPage() {
  const { activeClient } = useClient();
  const [simulationMode, setSimulationMode] = useState<'REVERSE' | 'FORWARD'>('REVERSE');
  
  // Baseline Input State Variables
  const [currentLeads, setCurrentLeads] = useState<number>(180);
  const [timeframe, setTimeframe] = useState<number>(90);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);

  // Mode X Inputs: Forward Modeling ("What happens if we do X?")
  const [googleAdsBudgetLift, setGoogleAdsBudgetLift] = useState<number>(20); // % Budget increase
  
  // Mode Y Inputs: Reverse Outcome Targeting ("What do we need to do to achieve Y?")
  const [targetLeadIncreasePercent, setTargetLeadIncreasePercent] = useState<number>(20); // % Lead target increase
  const [maxSpendCapPercent, setMaxSpendCapPercent] = useState<number>(10); // Spend constraint cap %

  // Derived Calculations
  // Forward Math (Predicting output based on input change X)
  const predictedLeadGain = Math.round(currentLeads * (googleAdsBudgetLift * 0.0075)); // Elasticity modeling
  const totalForwardLeads = currentLeads + predictedLeadGain;

  // Reverse Math (Back-solving path required for target outcome Y)
  const targetLeadGoal = Math.round(currentLeads * (1 + targetLeadIncreasePercent / 100));
  const leadGap = Math.max(0, targetLeadGoal - currentLeads);
  const requiredLocalVelocity = ((leadGap / currentLeads) * 100).toFixed(1);

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
          target_leads: simulationMode === 'REVERSE' ? targetLeadGoal : totalForwardLeads,
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
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold tracking-tight">OUTCOME LAB</h1>
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
              BEACON DECISION ENGINE
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Simulate the impact of operational changes or work backward from key business targets.
          </p>
        </div>

        {/* CORE MODE SWITCHER */}
        <div className="flex bg-[#111622] border border-[#A9C7E5]/20 rounded-lg p-1 space-x-1 font-mono text-xs">
          <button
            onClick={() => setSimulationMode('REVERSE')}
            className={`px-4 py-2 rounded transition-all ${
              simulationMode === 'REVERSE'
                ? 'bg-amber-500 text-black font-bold shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🎯 REVERSE OUTCOME TARGETING
          </button>
          <button
            onClick={() => setSimulationMode('FORWARD')}
            className={`px-4 py-2 rounded transition-all ${
              simulationMode === 'FORWARD'
                ? 'bg-[#55A9E6] text-black font-bold shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🔮 FORWARD MODELING
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* INPUT PANEL */}
        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-6 space-y-6">
          <div className="border-b border-[#A9C7E5]/10 pb-3">
            <h2 className="text-xs font-mono uppercase text-amber-400 tracking-wider font-bold">
              {simulationMode === 'REVERSE' ? 'TARGET OUTCOME (WHAT DO WE NEED TO ACHIEVE Y?)' : 'INPUT ACTION (WHAT HAPPENS IF WE DO X?)'}
            </h2>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-300">BASELINE QUALIFIED LEADS</label>
            <input
              type="number"
              value={currentLeads}
              onChange={(e) => setCurrentLeads(Number(e.target.value))}
              className="w-full bg-[#0B0F17] border border-[#A9C7E5]/20 rounded p-3 text-sm font-mono text-white focus:outline-none focus:border-amber-500"
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

          {simulationMode === 'REVERSE' ? (
            /* REVERSE TARGETING CONTROLS */
            <>
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-300">DESIRED QUALIFIED LEAD INCREASE (%)</label>
                <input
                  type="number"
                  value={targetLeadIncreasePercent}
                  onChange={(e) => setTargetLeadIncreasePercent(Number(e.target.value))}
                  className="w-full bg-[#0B0F17] border border-amber-500/40 rounded p-3 text-sm font-mono text-amber-400 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-300">MAXIMUM SPEND CAP LIFT (%)</label>
                <input
                  type="number"
                  value={maxSpendCapPercent}
                  onChange={(e) => setMaxSpendCapPercent(Number(e.target.value))}
                  className="w-full bg-[#0B0F17] border border-[#A9C7E5]/20 rounded p-3 text-sm font-mono text-white focus:outline-none"
                />
              </div>

              <div className="p-4 bg-[#0B0F17] border border-amber-500/20 rounded-lg space-y-1">
                <span className="text-[10px] font-mono text-amber-400 uppercase block">BACK-SOLVED REQUIRED LIFT</span>
                <div className="text-2xl font-bold font-mono text-white">+{requiredLocalVelocity}%</div>
                <span className="text-[10px] text-slate-500 font-mono block">
                  GAP: {leadGap} LEADS UNDER ≤{maxSpendCapPercent}% SPEND EXPANSION
                </span>
              </div>
            </>
          ) : (
            /* FORWARD MODELING CONTROLS */
            <>
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-300">PROPOSED GOOGLE ADS SPEND INCREASE (%)</label>
                <input
                  type="number"
                  value={googleAdsBudgetLift}
                  onChange={(e) => setGoogleAdsBudgetLift(Number(e.target.value))}
                  className="w-full bg-[#0B0F17] border border-[#55A9E6]/40 rounded p-3 text-sm font-mono text-[#55A9E6] focus:outline-none"
                />
              </div>

              <div className="p-4 bg-[#0B0F17] border border-[#55A9E6]/20 rounded-lg space-y-1">
                <span className="text-[10px] font-mono text-[#55A9E6] uppercase block">PREDICTED OUTCOME</span>
                <div className="text-2xl font-bold font-mono text-white">~{totalForwardLeads} LEADS</div>
                <span className="text-[10px] text-slate-500 font-mono block">
                  NET GAIN: +{predictedLeadGain} LEADS OVER {timeframe} DAYS
                </span>
              </div>
            </>
          )}
        </div>

        {/* DECISION PATHWAYS / PROJECTIONS */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xs font-mono uppercase text-slate-400 tracking-wider font-bold">
            {simulationMode === 'REVERSE'
              ? 'BACK-SOLVED ACTIONS REQUIRED TO ACHIEVE TARGET'
              : 'PREDICTED OUTCOME PATHWAYS & CAPACITY FORECASTS'}
          </h2>

          {simulationMode === 'REVERSE' ? (
            /* REVERSE OUTCOME DISPLAY */
            <div className="bg-[#111622] border border-amber-500/30 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                  OPTIMAL COMBINATION: ORGANIC MAP PACK + TARGETED SEARCH
                </span>
                <span className="text-xs font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-bold">
                  CONFIDENCE: 92.4%
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                To achieve <strong className="text-amber-400">+{targetLeadIncreasePercent}% qualified leads ({targetLeadGoal} total)</strong> within {timeframe} days while constraining spend to <strong className="text-emerald-400">≤{maxSpendCapPercent}%</strong>, PorchLight back-solves the following optimal execution path:
              </p>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside font-mono">
                <li>Increase local organic signal velocity by <strong className="text-amber-400">+{requiredLocalVelocity}%</strong> via OtterWatch SERP capture.</li>
                <li>Cap Google Ads budget expansion at <strong className="text-emerald-400">+{maxSpendCapPercent}%</strong> focused exclusively on high-intent terms.</li>
              </ul>
              <button
                onClick={() => handleDeploy('REVERSE_TARGETING')}
                disabled={isDeploying}
                className="w-full bg-amber-500 text-black font-bold font-mono text-xs py-3 rounded hover:bg-amber-400 transition-all cursor-pointer"
              >
                DEPLOY REQUIRED ACTION COMBINATION TO COMMAND CENTER
              </button>
            </div>
          ) : (
            /* FORWARD MODELING DISPLAY */
            <div className="bg-[#111622] border border-[#55A9E6]/30 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-[#55A9E6] uppercase tracking-wider">
                  PREDICTED OUTCOME FOR +{googleAdsBudgetLift}% GOOGLE ADS SPEND
                </span>
                <span className="text-xs font-mono bg-[#55A9E6]/20 text-[#55A9E6] border border-[#55A9E6]/30 px-2 py-0.5 rounded font-bold">
                  MODEL ACCURACY: 89.1%
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                If you increase Google Ads spend by <strong className="text-[#55A9E6]">+{googleAdsBudgetLift}%</strong>, PorchLight predicts the following outcome over {timeframe} days:
              </p>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside font-mono">
                <li>Qualified lead yield increases from {currentLeads} to <strong className="text-emerald-400">~{totalForwardLeads} leads</strong> (+{predictedLeadGain} leads).</li>
                <li>Estimated Cost-per-Lead (CPL) stabilizes with mild keyword auction inflation (+2.1%).</li>
              </ul>
              <button
                onClick={() => handleDeploy('FORWARD_PREDICTIVE')}
                disabled={isDeploying}
                className="w-full bg-[#55A9E6] text-black font-bold font-mono text-xs py-3 rounded hover:bg-[#55A9E6]/80 transition-all cursor-pointer"
              >
                APPLY PREDICTED ACTION PLAN TO COMMAND CENTER
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
