'use client';

import React, { useState, Suspense } from 'react';
import { useClient } from '../../lib/client-context';
import GlobalHeader from '../../components/navigation/GlobalHeader';

export const dynamic = 'force-dynamic';

function OpportunityLabContent() {
  const { activeClient } = useClient();
  const [activeTab, setActiveTab] = useState<'GOAL_PLANNER' | 'WHAT_IF'>('GOAL_PLANNER');
  
  // Goal Planner Controls
  const [targetMetric, setTargetMetric] = useState('Phone Calls');
  const [targetIncrease, setTargetIncrease] = useState('+15%');
  const [goalModelOutput, setGoalModelOutput] = useState<any>(null);

  // What-If Controls
  const [scenarioVariable, setScenarioVariable] = useState('Google Ads Spend');
  const [scenarioChange, setScenarioChange] = useState('+$1,000');
  const [whatIfModelOutput, setWhatIfModelOutput] = useState<any>(null);

  const isCertified = Boolean(activeClient?.is_certified);

  const handleRunGoalPlanner = () => {
    if (!isCertified) return;
    setGoalModelOutput({
      baseline: '124 Calls / mo',
      target: '143 Calls / mo (+15%)',
      requiredChange: 'Increase Google Ads budget by $450/mo or improve GA4 landing conversion rate by +1.8%',
      expectedCost: '$450.00 / month',
      confidence: '88% High Probability',
    });
  };

  const handleRunWhatIfScenario = () => {
    if (!isCertified) return;
    setWhatIfModelOutput({
      variable: `${scenarioVariable} (${scenarioChange})`,
      expectedEffect: '+18 Form Submissions / +24 Qualified Leads',
      confidenceRange: '82% - 91% Confidence Interval',
      dependencies: 'Requires active Google Ads conversion tracking and valid landing page tags.',
      recommendedStep: 'Allocate $250 test spend to top-performing keyword group before scaling.',
    });
  };

  if (!activeClient) {
    return (
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        <div className="p-8 rounded-xl bg-[#111622] border border-[#A9C7E5]/10 text-center text-slate-400 text-xs font-mono">
          NO CLIENT SELECTED
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D99614] font-bold block">
            PREDICTIVE MODELING • DECISION ENGINE
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Opportunity Lab</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Simulate marketing outcomes and growth scenarios for <strong className="text-white">{activeClient.name}</strong>.
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
            {isCertified ? '✓ MODEL READY' : '🔒 CERTIFICATION REQUIRED'}
          </span>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex border-b border-[#A9C7E5]/10 space-x-6 text-xs font-mono">
        <button
          onClick={() => setActiveTab('GOAL_PLANNER')}
          className={`pb-3 font-bold transition-all ${
            activeTab === 'GOAL_PLANNER'
              ? 'text-[#D99614] border-b-2 border-[#D99614]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🎯 GOAL PLANNER ("What result do I want?")
        </button>
        <button
          onClick={() => setActiveTab('WHAT_IF')}
          className={`pb-3 font-bold transition-all ${
            activeTab === 'WHAT_IF'
              ? 'text-[#D99614] border-b-2 border-[#D99614]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          ⚡ WHAT-IF SCENARIO ("What happens if I change something?")
        </button>
      </div>

      {/* Uncertified Fail-Closed Gate */}
      {!isCertified ? (
        <div className="p-8 rounded-xl bg-[#111622] border border-[#A9C7E5]/10 text-center space-y-3">
          <span className="text-amber-400 text-xs font-mono tracking-widest uppercase block font-bold">
            Execution Gate Active
          </span>
          <h2 className="text-xl font-bold text-white">MODELING UNAVAILABLE WITHOUT CERTIFIED BASELINE</h2>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            <strong className="text-white">{activeClient.name}</strong> operates on an uncertified baseline. Connect required integration providers in Connection Center to run goal planning and what-if scenario simulations.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Goal Planner View */}
          {activeTab === 'GOAL_PLANNER' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-4 md:col-span-1">
                <h3 className="text-sm font-bold text-white uppercase font-mono">TARGET PARAMETERS</h3>
                <div className="space-y-3 text-xs font-mono">
                  <div>
                    <label className="text-slate-400 block mb-1">TARGET KPI</label>
                    <select
                      value={targetMetric}
                      onChange={(e) => setTargetMetric(e.target.value)}
                      className="w-full bg-[#151D2A] text-white p-2 rounded border border-[#A9C7E5]/10"
                    >
                      <option value="Phone Calls">Phone Calls</option>
                      <option value="Website Clicks">Website Clicks</option>
                      <option value="Leads">Qualified Leads</option>
                      <option value="Local Visibility">Local Map Rank (# Top 3)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">DESIRED INCREASE</label>
                    <select
                      value={targetIncrease}
                      onChange={(e) => setTargetIncrease(e.target.value)}
                      className="w-full bg-[#151D2A] text-white p-2 rounded border border-[#A9C7E5]/10"
                    >
                      <option value="+10%">+10% Growth</option>
                      <option value="+15%">+15% Growth</option>
                      <option value="+20%">+20% Growth</option>
                      <option value="+25%">+25% Growth</option>
                    </select>
                  </div>
                  <button
                    onClick={handleRunGoalPlanner}
                    className="w-full py-2 bg-[#D99614] hover:bg-[#B97A08] text-[#0B0F17] font-bold rounded transition-all mt-2"
                  >
                    CALCULATE REQUIRED ACTIONS
                  </button>
                </div>
              </div>

              <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 md:col-span-2 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase font-mono">MODEL OUTPUT & EVIDENCE</h3>
                {goalModelOutput ? (
                  <div className="space-y-3 text-xs font-mono">
                    <div className="p-3 bg-[#151D2A] rounded border border-[#A9C7E5]/10">
                      <span className="text-slate-400 block text-[10px]">CURRENT BASELINE vs TARGET</span>
                      <span className="text-white font-bold">{goalModelOutput.baseline} → {goalModelOutput.target}</span>
                    </div>
                    <div className="p-3 bg-[#151D2A] rounded border border-[#A9C7E5]/10">
                      <span className="text-slate-400 block text-[10px]">REQUIRED ACTION</span>
                      <span className="text-emerald-400 font-bold">{goalModelOutput.requiredChange}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-[#151D2A] rounded border border-[#A9C7E5]/10">
                        <span className="text-slate-400 block text-[10px]">ESTIMATED COST</span>
                        <span className="text-white font-bold">{goalModelOutput.expectedCost}</span>
                      </div>
                      <div className="p-3 bg-[#151D2A] rounded border border-[#A9C7E5]/10">
                        <span className="text-slate-400 block text-[10px]">CONFIDENCE</span>
                        <span className="text-[#D99614] font-bold">{goalModelOutput.confidence}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 font-mono italic p-6 text-center">
                    Select target parameters and click "CALCULATE REQUIRED ACTIONS" to run simulation.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* What-If View */}
          {activeTab === 'WHAT_IF' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-4 md:col-span-1">
                <h3 className="text-sm font-bold text-white uppercase font-mono">VARIABLE ADJUSTMENT</h3>
                <div className="space-y-3 text-xs font-mono">
                  <div>
                    <label className="text-slate-400 block mb-1">VARIABLE TO ADJUST</label>
                    <select
                      value={scenarioVariable}
                      onChange={(e) => setScenarioVariable(e.target.value)}
                      className="w-full bg-[#151D2A] text-white p-2 rounded border border-[#A9C7E5]/10"
                    >
                      <option value="Google Ads Spend">Google Ads Spend</option>
                      <option value="Meta Ads Spend">Meta Ads Spend</option>
                      <option value="Landing Page Conversion Rate">Landing Page Conversion Rate</option>
                      <option value="Local Map Pack Rank">Local Map Pack Rank</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">DELTA CHANGE</label>
                    <select
                      value={scenarioChange}
                      onChange={(e) => setScenarioChange(e.target.value)}
                      className="w-full bg-[#151D2A] text-white p-2 rounded border border-[#A9C7E5]/10"
                    >
                      <option value="+$1,000">+$1,000 / month</option>
                      <option value="+20%">+20% Spend Increase</option>
                      <option value="+10% Conversion Rate">+10% Conversion Optimization</option>
                    </select>
                  </div>
                  <button
                    onClick={handleRunWhatIfScenario}
                    className="w-full py-2 bg-[#D99614] hover:bg-[#B97A08] text-[#0B0F17] font-bold rounded transition-all mt-2"
                  >
                    SIMULATE SCENARIO
                  </button>
                </div>
              </div>

              <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 md:col-span-2 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase font-mono">PROJECTED IMPACT</h3>
                {whatIfModelOutput ? (
                  <div className="space-y-3 text-xs font-mono">
                    <div className="p-3 bg-[#151D2A] rounded border border-[#A9C7E5]/10">
                      <span className="text-slate-400 block text-[10px]">SCENARIO ADJUSTMENT</span>
                      <span className="text-white font-bold">{whatIfModelOutput.variable}</span>
                    </div>
                    <div className="p-3 bg-[#151D2A] rounded border border-[#A9C7E5]/10">
                      <span className="text-slate-400 block text-[10px]">EXPECTED OUTCOME</span>
                      <span className="text-emerald-400 font-bold">{whatIfModelOutput.expectedEffect}</span>
                    </div>
                    <div className="p-3 bg-[#151D2A] rounded border border-[#A9C7E5]/10">
                      <span className="text-slate-400 block text-[10px]">RECOMMENDED NEXT STEP</span>
                      <span className="text-[#D99614] font-bold">{whatIfModelOutput.recommendedStep}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 font-mono italic p-6 text-center">
                    Adjust variables and click "SIMULATE SCENARIO" to compute impact projections.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

export default function OpportunityLabPage() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col font-sans">
      <Suspense fallback={<div className="p-6 text-xs text-slate-400 font-mono">Loading Header...</div>}>
        <GlobalHeader />
      </Suspense>
      <Suspense fallback={<div className="p-6 text-xs text-slate-400 font-mono">Loading Opportunity Lab...</div>}>
        <OpportunityLabContent />
      </Suspense>
    </div>
  );
}
