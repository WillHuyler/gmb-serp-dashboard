'use client';

import React, { useState } from 'react';
import { useClient } from '../../lib/client-context';

export default function OutcomeLabPage() {
  const { activeClient } = useClient();
  const [mode, setMode] = useState<'REVERSE' | 'FORWARD'>('REVERSE');

  const isCertified = Boolean(activeClient?.is_certified);

  return (
    <div className="space-y-6 text-[#0B1F3A]">
      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">
            OPPORTUNITY LAB
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-[#0B1F3A] mt-0.5">
            Decision Modeling Engine
          </h1>
          <p className="text-xs text-[#53657D] mt-1">
            Model what could happen — or determine what it takes to reach a specific business outcome for{' '}
            <strong className="text-[#0B1F3A]">{activeClient?.name || 'Selected Client'}</strong>.
          </p>
        </div>

        {/* MODE TOGGLE */}
        <div className="bg-[#F4F7FB] border border-[#DCE5EF] p-1 rounded-lg flex space-x-1 font-mono text-xs font-bold">
          <button
            onClick={() => setMode('REVERSE')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              mode === 'REVERSE' ? 'bg-[#0B1F3A] text-white shadow-sm' : 'text-[#53657D] hover:text-[#0B1F3A]'
            }`}
          >
            REVERSE OUTCOME TARGETING
          </button>
          <button
            onClick={() => setMode('FORWARD')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              mode === 'FORWARD' ? 'bg-[#0B1F3A] text-white shadow-sm' : 'text-[#53657D] hover:text-[#0B1F3A]'
            }`}
          >
            FORWARD SCENARIO MODELING
          </button>
        </div>
      </div>

      {/* FAIL-CLOSED TRUST GATE CHECK */}
      {!isCertified ? (
        <div className="bg-white border border-[#E64B4B]/30 rounded-xl p-8 text-center space-y-4 shadow-sm max-w-2xl mx-auto mt-8">
          <div className="w-12 h-12 bg-[#E64B4B]/10 text-[#E64B4B] rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            ⚠️
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono text-[#0B1F3A] uppercase tracking-wider">
              MODEL NOT READY — UNCERTIFIED BASELINE
            </h3>
            <p className="text-xs text-[#53657D] mt-2 max-w-md mx-auto leading-relaxed">
              Pursuant to the Data Trust Constitution, decision modeling requires a 100% certified client baseline.{' '}
              <strong className="text-[#0B1F3A]">{activeClient?.name || 'This client'}</strong> requires provider account mapping and historical validation before deployable recommendations can be calculated.
            </p>
          </div>

          {/* READINESS CHECKLIST */}
          <div className="bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg p-4 max-w-md mx-auto text-left font-mono text-xs space-y-2">
            <div className="flex items-center space-x-2 text-[#12A36D]">
              <span>✓</span>
              <span>Client Context Selected</span>
            </div>
            <div className="flex items-center space-x-2 text-[#E64B4B]">
              <span>✕</span>
              <span>Account Mapping Certified (Pending Review)</span>
            </div>
            <div className="flex items-center space-x-2 text-[#E64B4B]">
              <span>✕</span>
              <span>Google Ads Baseline Ingested</span>
            </div>
          </div>

          <button
            disabled
            className="bg-slate-200 text-slate-400 font-mono font-bold text-xs px-6 py-3 rounded-lg cursor-not-allowed uppercase tracking-wider"
          >
            DEPLOYMENT DISABLED — REQUIRES CERTIFICATION
          </button>
        </div>
      ) : (
        /* CERTIFIED WORKSPACE DISPLAY */
        <div className="bg-white border border-[#DCE5EF] rounded-xl p-6 space-y-6 shadow-sm">
          <div className="flex justify-between items-center border-b border-[#DCE5EF] pb-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-[#12A36D] font-bold bg-[#12A36D]/10 px-2.5 py-0.5 rounded border border-[#12A36D]/30">
                ✓ CERTIFIED BASELINE
              </span>
              <h3 className="text-sm font-bold font-mono text-[#0B1F3A] uppercase tracking-wider mt-1">
                {mode === 'REVERSE' ? 'Reverse Outcome Targeting Workspace' : 'Forward Scenario Modeling Workspace'}
              </h3>
            </div>
            <span className="text-xs font-mono text-[#53657D]">Evidence Grade: <strong className="text-[#0B1F3A]">B (Historical Response)</strong></span>
          </div>

          <div className="p-4 bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg text-xs font-mono text-[#53657D]">
            [ Certified decision modeling workspace active for {activeClient?.name} ]
          </div>

          <button className="bg-[#D99614] hover:bg-[#B97A08] text-white font-mono font-bold text-xs px-5 py-3 rounded-lg shadow-sm transition-all cursor-pointer">
            ⚡ Generate Decision Pathways
          </button>
        </div>
      )}
    </div>
  );
}
}
