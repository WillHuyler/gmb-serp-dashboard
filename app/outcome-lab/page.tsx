'use client';

import React from 'react';
import { useClient } from '../../lib/client-context';
import { getOutcomeLabScenarios } from '../../lib/outcome-lab-scenarios';

export default function OutcomeLabPage() {
  const { activeClient } = useClient();

  const scenarioResult = getOutcomeLabScenarios(
    activeClient?.id || '',
    activeClient?.name || 'Selected Client',
    activeClient?.is_certified || false
  );

  return (
    <div className="space-y-6 text-[#0B1F3A]">
      <div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">
          DECISION MODELING ENGINE
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-[#0B1F3A] mt-0.5">
          Outcome Lab — {activeClient?.name}
        </h1>
        <p className="text-xs text-[#53657D] mt-1">
          Simulate performance outcomes and growth scenarios based on certified client telemetry.
        </p>
      </div>

      {scenarioResult.status === 'UNCERTIFIED' ? (
        <div className="bg-[#FFF4EB] border border-[#F58A24]/30 rounded-xl p-8 text-center space-y-3">
          <div className="w-12 h-12 bg-[#F58A24]/10 text-[#F58A24] rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            🔒
          </div>
          <h2 className="text-sm font-mono font-bold text-[#0B1F3A] uppercase tracking-wide">
            MODEL NOT READY — UNCERTIFIED BASELINE
          </h2>
          <p className="text-xs text-[#53657D] max-w-lg mx-auto">
            {scenarioResult.message}
          </p>
          <div className="pt-2">
            <button className="bg-white border border-[#DCE5EF] text-[#0B1F3A] text-xs font-mono font-bold px-4 py-2 rounded-lg shadow-sm hover:bg-[#F4F7FB]">
              Configure Account Mappings in Settings
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {scenarioResult.scenarios?.map((scenario, idx) => (
            <div key={idx} className="bg-white border border-[#DCE5EF] rounded-xl p-5 space-y-3 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-[#12A36D] bg-[#12A36D]/10 px-2 py-0.5 rounded">
                  {scenario.targetGrowth} Target
                </span>
                <span className="text-xs font-bold text-[#0B1F3A]">{scenario.projectedRevenue}</span>
              </div>
              <div className="text-2xl font-bold text-[#0B1F3A]">{scenario.modeledLeads} Leads</div>
              <div className="border-t border-[#DCE5EF] pt-3 space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                  RECOMMENDED ACTIONS
                </span>
                {scenario.recommendedActions.map((act, aIdx) => (
                  <div key={aIdx} className="text-xs font-mono text-[#53657D] flex justify-between">
                    <span>{act.action}</span>
                    <span className="font-bold text-[#0B1F3A]">{act.estimatedCost}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
