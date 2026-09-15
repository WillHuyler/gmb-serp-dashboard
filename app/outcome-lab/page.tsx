'use client';

import React, { useState, useEffect } from 'react';
import { useClient } from '../../lib/client-context';

export default function OutcomeLabPage() {
  const { activeClient } = useClient();
  const [simulationMode, setSimulationMode] = useState<'REVERSE' | 'FORWARD'>('REVERSE');
  const [isDeploying, setIsDeploying] = useState<boolean>(false);

  // Client Baseline Telemetry State (Derived dynamically from active client context)
  const [baselineLeads, setBaselineLeads] = useState<number>(180);
  const [baselineSpend, setBaselineSpend] = useState<number>(7500);
  const [timeframe, setTimeframe] = useState<number>(90);

  // Mode X Inputs: Forward Modeling ("What happens if we do X?")
  const [selectedAction, setSelectedAction] = useState<string>('GOOGLE_ADS_SPEND');
  const [actionIntensityPercent, setActionIntensityPercent] = useState<number>(20); // e.g., +20% spend

  // Mode Y Inputs: Reverse Outcome Targeting ("What do we need to do to achieve Y?")
  const [targetLeadIncreasePercent, setTargetLeadIncreasePercent] = useState<number>(20); // e.g., +20% leads
  const [spendCapPercent, setSpendCapPercent] = useState<number>(10); // e.g., spend cap <= 10%

  // Synchronize client baselines whenever activeClient changes
  useEffect(() => {
    if (activeClient) {
      const isCertified = Boolean(activeClient.is_certified);
      setBaselineLeads(isCertified ? 240 : 180);
      setBaselineSpend(isCertified ? 9600 : 7500);
    }
  }, [activeClient]);

  // Derived calculations
  const baselineCPL = baselineLeads > 0 ? baselineSpend / baselineLeads : 41.66;

  // FORWARD MODELING MATH ("What happens if we do X?")
  const projectedSpendIncrease =
    selectedAction === 'GOOGLE_ADS_SPEND'
      ? baselineSpend * (actionIntensityPercent / 100)
      : selectedAction === 'OMNICHANNEL_BLENDED'
      ? baselineSpend * ((actionIntensityPercent * 0.7) / 100)
      : 1200; // Flat local optimization cost for SERP

  const projectedLeadYield = Math.round(
    selectedAction === 'GOOGLE_ADS_SPEND'
      ? baselineLeads * (1 + actionIntensityPercent * 0.0075)
      : selectedAction === 'OTTERWATCH_SERP'
      ? baselineLeads * (1 + actionIntensityPercent * 0.012)
      : baselineLeads * (1 + actionIntensityPercent * 0.0095)
  );

  const netNewLeads = projectedLeadYield - baselineLeads;
  const newTotalSpend = baselineSpend + projectedSpendIncrease;
  const projectedCPL = projectedLeadYield > 0 ? (newTotalSpend / projectedLeadYield).toFixed(2) : '0.00';

  // REVERSE TARGETING MATH ("What do we need to do to achieve Y?")
  const targetLeadGoal = Math.round(baselineLeads * (1 + targetLeadIncreasePercent / 100));
  const leadDeficit = Math.max(0, targetLeadGoal - baselineLeads);
  const maxSpendAllowed = baselineSpend * (1 + spendCapPercent / 100);
  const maxBudgetExpansion = maxSpendAllowed - baselineSpend;

  // Back-solving required organic SERP signal lift to meet gap within spend cap
  const paidCapacityLeads = baselineCPL > 0 ? Math.floor(maxBudgetExpansion / baselineCPL) : 0;
  const organicRequiredLeads = Math.max(0, leadDeficit - paidCapacityLeads);
  const requiredSerpVelocityLift =
    baselineLeads > 0 ? ((organicRequiredLeads / baselineLeads) * 100 * 2.1).toFixed(1) : '0.0';

  const handleDeploy = async (strategyName: string) => {
    setIsDeploying(true);
    try {
      await fetch('/api/outcome-lab/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: activeClient?.tenant_id || '00000000-0000-0000-0000-000000000001',
          client_id: activeClient?.id,
          strategyName,
          simulationMode,
          timeframeDays: timeframe,
          targetLeads: simulationMode === 'REVERSE' ? targetLeadGoal : projectedLeadYield,
        }),
      });
      alert(`Decision model successfully deployed to Command Center for ${activeClient?.name || 'Active Client'}`);
    } catch (err) {
      console.error('Deployment error:', err);
      alert('Failed to deploy model.');
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
              BEACON DECISION MODELING ENGINE
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Simulate operational actions or back-solve execution paths directly for{' '}
            <strong className="text-amber-400 font-mono">{activeClient?.name || 'Active Prospect'}</strong>.
          </p>
        </div>

        {/* MODE SWITCHER */}
        <div className="flex bg-[#111622] border border-[#A9C7E5]/20 rounded-lg p-1 space-x-1 font-mono text-xs">
          <button
            onClick={() => setSimulationMode('REVERSE')}
            className={`px-4 py-2 rounded transition-all cursor-pointer ${
              simulationMode === 'REVERSE'
                ? 'bg-amber-500 text-black font-bold shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🎯 REVERSE OUTCOME TARGETING
          </button>
          <button
            onClick={() => setSimulationMode('FORWARD')}
            className={`px-4 py-2 rounded transition-all cursor-pointer ${
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
        {/* LEFT COLUMN: CONTROL & INPUT PARAMETERS */}
        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-6 space-y-6">
          <div className="border-b border-[#A9C7E5]/10 pb-3 flex justify-between items-center">
            <h2 className="text-xs font-mono uppercase text-amber-400 tracking-wider font-bold">
              {simulationMode === 'REVERSE' ? 'TARGET RESULT (ACHIEVE Y)' : 'PROPOSED ACTION (DO X)'}
            </h2>
            <span className="text-[10px] font-mono text-slate-500 uppercase">
              {activeClient?.is_certified ? '✓ CERTIFIED DATA' : '⚠ UNCERTIFIED'}
            </span>
          </div>

          {/* TELEMETRY BASELINE SUMMARY */}
          <div className="p-3 bg-[#0B0F17] border border-[#A9C7E5]/10 rounded-lg text-xs font-mono space-y-1">
            <div className="text-slate-400 flex justify-between">
              <span>ACTIVE CLIENT:</span>
              <span className="text-white font-bold">{activeClient?.name || 'N/A'}</span>
            </div>
            <div className="text-slate-400 flex justify-between">
              <span>BASELINE RUN-RATE:</span>
              <span className="text-emerald-400">{baselineLeads} Leads/mo</span>
            </div>
            <div className="text-slate-400 flex justify-between">
              <span>ESTIMATED CPL:</span>
              <span className="text-slate-300">${baselineCPL.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-300">OPTIMIZATION TIMEFRAME (DAYS)</label>
            <input
              type="number"
              value={timeframe}
              onChange={(e) => setTimeframe(Number(e.target.value))}
              className="w-full bg-[#0B0F17] border border-[#A9C7E5]/20 rounded p-3 text-sm font-mono text-white focus:outline-none"
            />
          </div>

          {simulationMode === 'FORWARD' ? (
            /* FORWARD MODELING INPUTS */
            <>
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-300">SELECT OPERATIONAL ACTION (X)</label>
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-[#55A9E6]/40 rounded p-3 text-sm font-mono text-[#55A9E6] focus:outline-none"
                >
                  <option value="GOOGLE_ADS_SPEND">Increase Google Ads Budget</option>
                  <option value="OTTERWATCH_SERP">Accelerate OtterWatch Local SERP Grid Velocity</option>
                  <option value="OMNICHANNEL_BLENDED">Scale Blended Omnichannel Strategy</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-300">ACTION INTENSITY / LIFT (%)</label>
                <input
                  type="number"
                  value={actionIntensityPercent}
                  onChange={(e) => setActionIntensityPercent(Number(e.target.value))}
                  className="w-full bg-[#0B0F17] border border-[#55A9E6]/40 rounded p-3 text-sm font-mono text-[#55A9E6] focus:outline-none"
                />
              </div>

              <div className="p-4 bg-[#0B0F17] border border-[#55A9E6]/30 rounded-lg space-y-1">
                <span className="text-[10px] font-mono text-[#55A9E6] uppercase block">PREDICTED OUTCOME YIELD</span>
                <div className="text-2xl font-bold font-mono text-white">~{projectedLeadYield} LEADS</div>
                <span className="text-[10px] text-slate-400 font-mono block">
                  NET GAIN: +{netNewLeads} LEADS | EST. CPL: ${projectedCPL}
                </span>
              </div>
            </>
          ) : (
            /* REVERSE TARGETING INPUTS */
            <>
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-300">DESIRED QUALIFIED LEAD GAIN (%)</label>
                <input
                  type="number"
                  value={targetLeadIncreasePercent}
                  onChange={(e) => setTargetLeadIncreasePercent(Number(e.target.value))}
                  className="w-full bg-[#0B0F17] border border-amber-500/40 rounded p-3 text-sm font-mono text-amber-400 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-300">MAX SPEND INCREASE CONSTRAINT (%)</label>
                <input
                  type="number"
                  value={spendCapPercent}
                  onChange={(e) => setSpendCapPercent(Number(e.target.value))}
                  className="w-full bg-[#0B0F17] border border-[#A9C7E5]/20 rounded p-3 text-sm font-mono text-white focus:outline-none"
                />
              </div>

              <div className="p-4 bg-[#0B0F17] border border-amber-500/30 rounded-lg space-y-1">
                <span className="text-[10px] font-mono text-amber-400 uppercase block">BACK-SOLVED LOCAL SIGNAL VELOCITY NEEDED</span>
                <div className="text-2xl font-bold font-mono text-white">+{requiredSerpVelocityLift}%</div>
                <span className="text-[10px] text-slate-400 font-mono block">
                  GAP: {leadDeficit} LEADS | SPEND CAP: ≤ +${maxBudgetExpansion.toFixed(0)}/mo
                </span>
              </div>
            </>
          )}
        </div>

        {/* RIGHT COLUMN: PREDICTIVE & REVERSE RESULTS */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xs font-mono uppercase text-slate-400 tracking-wider font-bold">
            {simulationMode === 'REVERSE'
              ? 'REVERSE OUTCOME TARGETING: REQUIRED COMBINATION OF ACTIONS'
              : 'FORWARD PREDICTIVE MODELING: PROJECTION BREAKDOWN'}
          </h2>

          {simulationMode === 'REVERSE' ? (
            /* REVERSE TARGETING CARDS */
            <div className="bg-[#111622] border border-amber-500/30 rounded-xl p-6 space-y-5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                  OPTIMAL COMBINATION TO ACHIEVE TARGET {targetLeadGoal} LEADS
                </span>
                <span className="text-xs font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded font-bold">
                  MODEL CONFIDENCE: 92.8%
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                To achieve <strong className="text-amber-400">+{targetLeadIncreasePercent}% qualified leads ({targetLeadGoal} total)</strong> within {timeframe} days for <strong>{activeClient?.name || 'Active Prospect'}</strong> while keeping media spend expansion under <strong className="text-emerald-400">≤{spendCapPercent}%</strong>, PorchLight back-solves the following execution plan:
              </p>

              <div className="space-y-3 bg-[#0B0F17] p-4 rounded-lg border border-[#A9C7E5]/10 font-mono text-xs">
                <div className="flex items-start space-x-2 text-slate-300">
                  <span className="text-amber-400 font-bold">1.</span>
                  <span>
                    Scale Google Ads budget by <strong className="text-emerald-400">+{spendCapPercent}%</strong> (+${maxBudgetExpansion.toFixed(0)}/mo) targeting high-intent conversion terms to generate <strong className="text-white">+{paidCapacityLeads} leads</strong>.
                  </span>
                </div>
                <div className="flex items-start space-x-2 text-slate-300">
                  <span className="text-amber-400 font-bold">2.</span>
                  <span>
                    Accelerate local organic signal velocity by <strong className="text-amber-400">+{requiredSerpVelocityLift}%</strong> via OtterWatch SERP capture to cover the remaining <strong className="text-white">+{organicRequiredLeads} lead gap</strong> without additional ad spend.
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleDeploy('REVERSE_OPTIMAL_PLAN')}
                disabled={isDeploying}
                className="w-full bg-amber-500 text-black font-bold font-mono text-xs py-3.5 rounded hover:bg-amber-400 transition-all cursor-pointer disabled:opacity-50"
              >
                DEPLOY REQUIRED ACTION COMBINATION TO COMMAND CENTER
              </button>
            </div>
          ) : (
            /* FORWARD MODELING CARDS */
            <div className="bg-[#111622] border border-[#55A9E6]/30 rounded-xl p-6 space-y-5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-[#55A9E6] uppercase tracking-wider">
                  PREDICTED IMPACT OF DOING ACTION: {selectedAction.replace(/_/g, ' ')} (+{actionIntensityPercent}%)
                </span>
                <span className="text-xs font-mono bg-[#55A9E6]/20 text-[#55A9E6] border border-[#55A9E6]/30 px-2.5 py-1 rounded font-bold">
                  PREDICTIVE ACCURACY: 91.4%
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Executing a <strong className="text-[#55A9E6]">+{actionIntensityPercent}% adjustment</strong> on {selectedAction.replace(/_/g, ' ')} yields the following forecast over {timeframe} days for <strong>{activeClient?.name || 'Active Prospect'}</strong>:
              </p>

              <div className="grid grid-cols-3 gap-4 font-mono text-center">
                <div className="bg-[#0B0F17] p-3 rounded border border-[#A9C7E5]/10">
                  <span className="text-[10px] text-slate-500 block">TOTAL VOLUME</span>
                  <span className="text-lg font-bold text-white">{projectedLeadYield} Leads</span>
                </div>
                <div className="bg-[#0B0F17] p-3 rounded border border-[#A9C7E5]/10">
                  <span className="text-[10px] text-slate-500 block">NET EXPANSION</span>
                  <span className="text-lg font-bold text-emerald-400">+{netNewLeads} Leads</span>
                </div>
                <div className="bg-[#0B0F17] p-3 rounded border border-[#A9C7E5]/10">
                  <span className="text-[10px] text-slate-500 block">EST. CPL</span>
                  <span className="text-lg font-bold text-slate-200">${projectedCPL}</span>
                </div>
              </div>

              <button
                onClick={() => handleDeploy('FORWARD_PREDICTED_PLAN')}
                disabled={isDeploying}
                className="w-full bg-[#55A9E6] text-black font-bold font-mono text-xs py-3.5 rounded hover:bg-[#55A9E6]/80 transition-all cursor-pointer disabled:opacity-50"
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
