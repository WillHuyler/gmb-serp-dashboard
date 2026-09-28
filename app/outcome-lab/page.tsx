'use client';

import React, { useState } from 'react';
import { useClient } from '../../lib/client-context';
import { getOutcomeLabScenarios } from '../../lib/outcome-lab-scenarios';

export default function OpportunityLabPage() {
  const { activeClient, clients, setActiveClientId } = useClient();
  const [activeTab, setActiveTab] = useState<'REVERSE' | 'FORWARD'>('REVERSE');

  const scenarioResult = getOutcomeLabScenarios(
    activeClient?.id || '',
    activeClient?.name || 'Selected Client',
    activeClient?.is_certified || false
  );

  return (
    <div className="space-y-6 text-[#0B1F3A] p-6">
      {/* Header, Client Selector & Dual-Mode Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#DCE5EF] pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">
            OPPORTUNITY LAB
          </span>
          <div className="flex items-center space-x-3 mt-0.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#0B1F3A]">
              Decision Modeling Engine
            </h1>
            <select
              value={activeClient?.id || ''}
              onChange={(e) => setActiveClientId(e.target.value)}
              className="bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg px-2.5 py-1 text-xs font-bold text-[#0B1F3A] focus:outline-none focus:border-[#D99614] cursor-pointer"
            >
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} {client.is_certified ? '(Certified)' : '(Uncertified)'}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-[#53657D] mt-1">
            Model what could happen — or determine what it takes to reach a specific business outcome for{' '}
            <span className="font-bold text-[#0B1F3A]">{activeClient?.name}</span>.
          </p>
        </div>

        {/* Both Sides Toggle Bar */}
        <div className="flex bg-[#F4F7FB] border border-[#DCE5EF] p-1 rounded-lg space-x-1 font-mono text-xs font-bold">
          <button
            onClick={() => setActiveTab('REVERSE')}
            className={`px-4 py-2 rounded-md transition-all cursor-pointer ${
              activeTab === 'REVERSE'
                ? 'bg-[#0B1F3A] text-white shadow-sm'
                : 'text-[#53657D] hover:text-[#0B1F3A]'
            }`}
          >
            REVERSE OUTCOME TARGETING
          </button>
          <button
            onClick={() => setActiveTab('FORWARD')}
            className={`px-4 py-2 rounded-md transition-all cursor-pointer ${
              activeTab === 'FORWARD'
                ? 'bg-[#0B1F3A] text-white shadow-sm'
                : 'text-[#53657D] hover:text-[#0B1F3A]'
            }`}
          >
            FORWARD SCENARIO MODELING
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      {scenarioResult.status === 'UNCERTIFIED' ? (
        <div className="bg-white border border-[#DCE5EF] rounded-xl p-12 text-center space-y-4 shadow-sm max-w-3xl mx-auto my-8">
          <div className="w-12 h-12 bg-[#FFF4EB] text-[#F58A24] rounded-full flex items-center justify-center mx-auto text-xl font-bold border border-[#F58A24]/30">
            ⚠️
          </div>
          <h2 className="text-sm font-mono font-bold text-[#0B1F3A] uppercase tracking-wider">
            MODEL NOT READY — UNCERTIFIED BASELINE
          </h2>
          <p className="text-xs text-[#53657D] max-w-md mx-auto leading-relaxed">
            Pursuant to the Data Trust Constitution, decision modeling requires a 100% certified client baseline.{' '}
            <span className="font-bold text-[#0B1F3A]">{activeClient?.name}</span> requires provider account mapping and historical validation before deployable recommendations can be calculated.
          </p>

          <div className="bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg p-4 text-left font-mono text-xs space-y-1.5 max-w-md mx-auto">
            <div className="text-[#12A36D] font-bold">✓ Client Context Selected ({activeClient?.name})</div>
            <div className="text-[#E64B4B]">✕ Account Mapping Certified (Pending Review)</div>
            <div className="text-[#E64B4B]">✕ Google Ads / GA4 Baseline Ingested</div>
          </div>

          <div className="pt-2">
            <button className="bg-slate-200 text-slate-500 text-xs font-mono font-bold px-6 py-2.5 rounded-lg cursor-not-allowed uppercase tracking-wider">
              DEPLOYMENT DISABLED — REQUIRES CERTIFICATION
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-mono font-bold text-[#12A36D] bg-[#12A36D]/10 border border-[#12A36D]/30 p-3 rounded-lg flex items-center space-x-2">
            <span>✓ CERTIFIED BASELINE ACTIVE:</span>
            <span>Displaying scenario targets for {activeClient?.name} under {activeTab} mode.</span>
          </div>

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
        </div>
      )}
    </div>
  );
}
