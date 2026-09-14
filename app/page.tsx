'use client';

import { useState, useTransition } from 'react';
import { DecisionEngine, PredictionOutcome } from '@/lib/decision-engine';

export default function OutcomeLabPage() {
  const [currentValue, setCurrentValue] = useState<number>(180);
  const [desiredValue, setDesiredValue] = useState<number>(250);
  const [timeframeDays, setTimeframeDays] = useState<number>(30);
  const [isPending, startTransition] = useTransition();

  const channels = ['otterwatch', 'google_ads', 'meta_ads'];

  // Dynamically recalculate reverse optimization pathways using Beacon V2.1
  const targetConfig = {
    targetMetric: 'Leads',
    currentValue: Number(currentValue) || 0,
    desiredValue: Number(desiredValue) || 0,
    timeframeDays: Number(timeframeDays) || 30,
  };

  const pathways: PredictionOutcome[] = DecisionEngine.modelReverseOptimization(
    targetConfig,
    channels
  );

  return (
    <div className="p-8 space-y-8 bg-[#0B0F17] text-white min-h-screen">
      <div>
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold tracking-tight">OUTCOME LAB</h1>
          <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">
            DECISION SIMULATION ENGINE
          </span>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Simulate forward scenarios or reverse-optimize targets with statistical bounds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* DESIRED TARGET OUTCOME FORM */}
        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-6 space-y-6">
          <h2 className="text-xs font-mono uppercase text-slate-400 tracking-wider">
            DESIRED TARGET OUTCOME
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-2">
                CURRENT LEAD VOLUME
              </label>
              <input
                type="number"
                value={currentValue}
                onChange={(e) =>
                  startTransition(() => setCurrentValue(Number(e.target.value)))
                }
                className="w-full bg-[#0B0F17] border border-[#A9C7E5]/20 rounded p-3 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-2">
                TARGET LEAD GOAL
              </label>
              <input
                type="number"
                value={desiredValue}
                onChange={(e) =>
                  startTransition(() => setDesiredValue(Number(e.target.value)))
                }
                className="w-full bg-[#0B0F17] border border-[#A9C7E5]/20 rounded p-3 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-2">
                TIMEFRAME (DAYS)
              </label>
              <input
                type="number"
                value={timeframeDays}
                onChange={(e) =>
                  startTransition(() => setTimeframeDays(Number(e.target.value)))
                }
                className="w-full bg-[#0B0F17] border border-[#A9C7E5]/20 rounded p-3 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* RECOMMENDED STRATEGIC PATHWAYS */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-mono uppercase text-slate-400 tracking-wider mb-4">
            RECOMMENDED STRATEGIC PATHWAYS
          </h2>

          <div className={`space-y-4 transition-opacity ${isPending ? 'opacity-50' : 'opacity-100'}`}>
            {pathways.map((strat, i) => (
              <div
                key={strat.id}
                className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-3"
              >
                <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-2">
                  <span className="text-xs font-bold text-[#FFC44D] uppercase">
                    PATHWAY #{i + 1}: {strat.scenario}
                  </span>
                  <span className="text-[10px] font-mono text-[#55A9E6]">
                    CONFIDENCE: {Math.round(strat.confidenceScore * 100)}%
                  </span>
                </div>

                <p className="text-xs text-[#A9C7E5]">
                  Achieving target requires an estimated{' '}
                  <strong className="text-emerald-400">
                    +{strat.expectedLiftPercent}%
                  </strong>{' '}
                  performance acceleration.
                </p>

                <div className="flex justify-between text-xs font-mono text-[#70839D] bg-[#A9C7E5]/5 p-2.5 rounded border border-[#A9C7E5]/5">
                  <span>
                    Evidence Grade: <strong className="text-white">{strat.evidenceGrade}</strong>
                  </span>
                  <span>
                    Model Engine: <strong className="text-white">{strat.modelVersion}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
