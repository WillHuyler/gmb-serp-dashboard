"use client";
import React, { useState } from 'react';
import { Sliders, Target } from 'lucide-react';
import { DecisionEngine, PredictionOutcome } from '@/lib/decision-engine';

export default function OutcomeLab() {
  const [tab, setTab] = useState<'forward' | 'reverse'>('forward');
  const [budgetMultiplier, setBudgetMultiplier] = useState<number>(1.20);
  const [desiredTarget, setDesiredTarget] = useState<number>(250);
  const [currentVal, setCurrentVal] = useState<number>(180);

  const forwardResult: PredictionOutcome = DecisionEngine.modelForwardScenario(
    [175, 182, 178, 185, 180],
    budgetMultiplier,
    "Cross-Channel Ingestion (OtterWatch + Google Ads)"
  );

  const reverseResults: PredictionOutcome[] = DecisionEngine.modelReverseOptimization(
    { targetMetric: "Qualified Leads", desiredValue: desiredTarget, currentValue: currentVal, timeframeDays: 30 },
    ["otterwatch", "google_ads", "meta_ads"]
  );

  return (
    <div className="min-h-screen bg-[#08111F] text-[#F7FAFC] font-sans p-8 space-y-8">
      
      <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-wider text-[#F7FAFC]">OUTCOME LAB</h1>
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#F5A000] bg-[#F5A000]/10 border border-[#F5A000]/30 px-2 py-0.5 rounded">
              Decision Simulation Engine
            </span>
          </div>
          <p className="text-xs text-[#70839D] mt-1">
            Simulate forward scenarios or reverse-optimize targets with statistical bounds.
          </p>
        </div>

        <div className="flex bg-[#0E192B] p-1 rounded-lg border border-[#A9C7E5]/10">
          <button
            onClick={() => setTab('forward')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
              tab === 'forward' ? 'bg-[#F5A000] text-[#08111F]' : 'text-[#70839D] hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> Forward Scenario Modeling
          </button>
          <button
            onClick={() => setTab('reverse')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
              tab === 'reverse' ? 'bg-[#F5A000] text-[#08111F]' : 'text-[#70839D] hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" /> Reverse Outcome Targeting
          </button>
        </div>
      </div>

      {tab === 'forward' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 bg-[#0E192B] border border-[#A9C7E5]/10 rounded-xl p-6 space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F7FAFC] border-b border-[#A9C7E5]/10 pb-3">
              Input Parameters
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-[#A9C7E5]">Budget Adjustment</span>
                  <span className="font-mono font-bold text-[#FFC44D]">+{Math.round((budgetMultiplier - 1) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="2.0"
                  step="0.05"
                  value={budgetMultiplier}
                  onChange={(e) => setBudgetMultiplier(parseFloat(e.target.value))}
                  className="w-full accent-[#F5A000] bg-[#08111F] rounded-lg cursor-pointer"
                />
              </div>

              <div className="p-4 bg-[#08111F] rounded-lg border border-[#A9C7E5]/5 text-xs text-[#70839D] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#A9C7E5] block">Target Channels</span>
                <p>OtterWatch Local Pack + Google Paid Search Engine</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 bg-[#0E192B] border border-[#A9C7E5]/10 rounded-xl p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#F7FAFC]">MODELED FORECAST OUTPUT</h3>
              <span className="text-xs font-mono text-[#55A9E6] bg-[#55A9E6]/10 border border-[#55A9E6]/30 px-2.5 py-0.5 rounded">
                EVIDENCE GRADE {forwardResult.evidenceGrade}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#08111F] p-4 rounded-lg border border-[#A9C7E5]/10">
                <span className="text-[10px] text-[#70839D] uppercase font-bold block">Baseline Value</span>
                <span className="text-2xl font-extrabold font-mono text-[#F7FAFC] mt-1 block">{forwardResult.baselineValue}</span>
              </div>
              <div className="bg-[#08111F] p-4 rounded-lg border border-[#A9C7E5]/10">
                <span className="text-[10px] text-[#70839D] uppercase font-bold block">Expected Value</span>
                <span className="text-2xl font-extrabold font-mono text-emerald-400 mt-1 block">{forwardResult.expectedValue}</span>
              </div>
              <div className="bg-[#08111F] p-4 rounded-lg border border-[#A9C7E5]/10">
                <span className="text-[10px] text-[#70839D] uppercase font-bold block">Model Confidence</span>
                <span className="text-2xl font-extrabold font-mono text-[#FFC44D] mt-1 block">{forwardResult.confidenceScore}%</span>
              </div>
            </div>

            <div className="bg-[#08111F] p-5 rounded-lg border border-[#A9C7E5]/10 space-y-3 font-mono text-xs">
              <span className="text-[10px] uppercase font-bold text-[#70839D] block">95% STATISTICAL CONFIDENCE RANGE</span>
              <div className="flex items-center justify-between bg-[#0E192B] p-3 rounded border border-[#A9C7E5]/5">
                <span>Minimum Bound: <strong className="text-rose-400">{forwardResult.rangeMin}</strong></span>
                <span>Expected Mean: <strong className="text-emerald-400">{forwardResult.expectedValue}</strong></span>
                <span>Maximum Bound: <strong className="text-emerald-400">{forwardResult.rangeMax}</strong></span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#70839D]">MODEL ASSUMPTIONS & CONSTRAINTS</span>
              <ul className="space-y-1.5 text-xs text-[#A9C7E5]">
                {forwardResult.assumptions.map((a, i) => (
                  <li key={i} className="flex items-center gap-2 bg-[#08111F] px-3 py-1.5 rounded border border-[#A9C7E5]/5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F5A000]"></span>
                    {a.label} <span className="text-[9px] text-[#70839D] uppercase font-mono">({a.sensitivity} sensitivity)</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {tab === 'reverse' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 bg-[#0E192B] border border-[#A9C7E5]/10 rounded-xl p-6 space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F7FAFC] border-b border-[#A9C7E5]/10 pb-3">
              Desired Target Outcome
            </h3>

            <div className="space-y-4 font-mono">
              <div>
                <label className="text-[10px] text-[#70839D] uppercase font-bold block mb-1">Current Lead Volume</label>
                <input
                  type="number"
                  value={currentVal}
                  onChange={(e) => setCurrentVal(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#08111F] border border-[#A9C7E5]/15 rounded-lg p-2.5 text-sm text-[#F7FAFC] focus:outline-none focus:border-[#F5A000]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#70839D] uppercase font-bold block mb-1">Target Lead Goal</label>
                <input
                  type="number"
                  value={desiredTarget}
                  onChange={(e) => setDesiredTarget(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#08111F] border border-[#A9C7E5]/15 rounded-lg p-2.5 text-sm text-[#F5A000] font-bold focus:outline-none focus:border-[#F5A000]"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 bg-[#0E192B] border border-[#A9C7E5]/10 rounded-xl p-6 space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F7FAFC] border-b border-[#A9C7E5]/10 pb-3">
              RECOMMENDED STRATEGIC PATHWAYS
            </h3>

            <div className="space-y-4">
              {reverseResults.map((strat, i) => (
                <div key={i} className="bg-[#08111F] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-3">
                  <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-2">
                    <span className="text-xs font-bold text-[#FFC44D]">PATHWAY #{i + 1}: {strat.dataSources[0]}</span>
                    <span className="text-[10px] font-mono text-[#55A9E6]">CONFIDENCE: {strat.confidenceScore}%</span>
                  </div>

                  <p className="text-xs text-[#A9C7E5]">
                    Achieving target requires an estimated <strong className="text-emerald-400">+{strat.expectedLiftPercent}%</strong> performance acceleration.
                  </p>

                  <div className="flex justify-between text-xs font-mono text-[#70839D] bg-[#0E192B] p-2.5 rounded border border-[#A9C7E5]/5">
                    <span>Evidence Grade: <strong className="text-white">{strat.evidenceGrade}</strong></span>
                    <span>Model Engine: <strong className="text-white">{strat.modelVersion}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
