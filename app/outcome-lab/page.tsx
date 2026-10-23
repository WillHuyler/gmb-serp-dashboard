'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useClient } from '../../lib/client-context';
import GlobalHeader from '../../components/navigation/GlobalHeader';
import TrustCertificationStrip, {
  DataTrustState,
} from '../../components/design-system/TrustCertificationStrip';
import TriPartInsightCard from '../../components/design-system/TriPartInsightCard';

export const dynamic = 'force-dynamic';

function OpportunityLabContent() {
  const { activeClient } = useClient();
  const isCertified = Boolean(activeClient?.is_certified);

  const [mode, setMode] = useState<'REVERSE_GOAL' | 'FORWARD_SIMULATOR'>('REVERSE_GOAL');

  // Reverse Goal Targeting Controls (Interactive Manual Assumptions)
  const [targetMonthlyLeads, setTargetMonthlyLeads] = useState<number>(60);
  const [assumedCvrPercent, setAssumedCvrPercent] = useState<number>(8.5);
  const [assumedCpcDollars, setAssumedCpcDollars] = useState<number>(6.25);
  const [assumedCloseRatePercent, setAssumedCloseRatePercent] = useState<number>(28);
  const [assumedAvgTicketDollars, setAssumedAvgTicketDollars] = useState<number>(850);

  // Forward What-If Simulator Controls
  const [monthlyAdBudget, setMonthlyAdBudget] = useState<number>(4500);
  const [expectedRankLiftNodes, setExpectedRankLiftNodes] = useState<number>(6);

  // Transparent Deterministic Calculations
  const requiredClicks =
    assumedCvrPercent > 0 ? Math.ceil(targetMonthlyLeads / (assumedCvrPercent / 100)) : 0;
  const requiredAdBudget = Math.round(requiredClicks * assumedCpcDollars);
  const projectedClosedDeals = Math.round(targetMonthlyLeads * (assumedCloseRatePercent / 100));
  const projectedGrossRevenue = projectedClosedDeals * assumedAvgTicketDollars;
  const modeledCpl =
    targetMonthlyLeads > 0 ? requiredAdBudget / targetMonthlyLeads : 0;

  // Forward Model Calculations
  const forwardClicks =
    assumedCpcDollars > 0 ? Math.floor(monthlyAdBudget / assumedCpcDollars) : 0;
  const forwardPaidLeads = Math.round(forwardClicks * (assumedCvrPercent / 100));
  const forwardOrganicLiftLeads = Math.round(expectedRankLiftNodes * 2.5);
  const forwardTotalLeads = forwardPaidLeads + forwardOrganicLiftLeads;

  const trustState: DataTrustState = isCertified ? 'CERTIFIED_LIVE' : 'UNMAPPED_SETUP';

  return (
    <div className="flex-1 flex flex-col">
      <TrustCertificationStrip client={activeClient} trustState={trustState} />

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6 text-white font-sans">
        {/* Header & DEF-001 Fail-Closed Gate Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#111622] border border-[#A9C7E5]/15 rounded-xl p-6">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-[#D99614] font-bold block">
              OPPORTUNITY LAB • REVERSE GOAL TARGETING & FORWARD SCENARIO MODELING
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
              Opportunity Lab & Decision Desk — {activeClient?.name || 'Select Client'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Interactive forward and reverse business outcome modeling with transparent formulas and strict baseline provenance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('REVERSE_GOAL')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all ${
                mode === 'REVERSE_GOAL'
                  ? 'bg-[#D99614] text-[#0B0F17] border-[#D99614]'
                  : 'bg-[#151D2A] text-slate-300 border-[#A9C7E5]/15'
              }`}
            >
              Reverse Goal Planner
            </button>
            <button
              onClick={() => setMode('FORWARD_SIMULATOR')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all ${
                mode === 'FORWARD_SIMULATOR'
                  ? 'bg-[#D99614] text-[#0B0F17] border-[#D99614]'
                  : 'bg-[#151D2A] text-slate-300 border-[#A9C7E5]/15'
              }`}
            >
              Forward What-If Simulator
            </button>
          </div>
        </div>

        {/* DEF-001 Fail-Closed Safety Gate */}
        {!isCertified && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-mono text-xs font-bold text-amber-400 uppercase block">
                🔒 MODEL NOT READY FOR LIVE DEPLOYMENT • MANUAL ASSUMPTION SANDBOX ACTIVE
              </span>
              <p className="text-xs text-slate-300">
                {activeClient?.name || 'This client'} does not yet have a certified telemetry baseline. You may interactively model scenarios using manual assumptions below, but live strategy deployment is locked until provider data is certified.
              </p>
            </div>
            {activeClient && (
              <Link
                href={`/connection-center?clientId=${activeClient.id}`}
                className="px-3.5 py-2 bg-[#151D2A] hover:bg-[#1C273A] border border-amber-500/40 rounded-lg text-xs font-mono font-semibold text-amber-300 shrink-0"
              >
                Certify Client Baseline →
              </Link>
            )}
          </div>
        )}

        {/* Interactive Modeling Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 6 Cols: Interactive Sliders & Inputs */}
          <div className="lg:col-span-6 bg-[#111622] border border-[#A9C7E5]/15 rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#A9C7E5]/10 pb-3">
              <div>
                <span className="font-mono text-[10px] uppercase text-[#D99614] font-bold block">
                  INTERACTIVE ASSUMPTION CONTROLS
                </span>
                <h3 className="text-base font-bold text-white">
                  {mode === 'REVERSE_GOAL'
                    ? 'Define Target Business Outcome'
                    : 'Adjust Forward Scenario Inputs'}
                </h3>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/25">
                MANUAL ASSUMPTIONS
              </span>
            </div>

            {mode === 'REVERSE_GOAL' ? (
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-slate-300 font-medium">Target Qualified Monthly Leads</label>
                    <span className="font-mono font-bold text-[#D99614]">{targetMonthlyLeads} Leads</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={300}
                    step={5}
                    value={targetMonthlyLeads}
                    onChange={(e) => setTargetMonthlyLeads(Number(e.target.value))}
                    className="w-full accent-[#D99614]"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-slate-300 font-medium">Assumed Landing Page / Call Conversion Rate (%)</label>
                    <span className="font-mono font-bold text-white">{assumedCvrPercent.toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={25}
                    step={0.5}
                    value={assumedCvrPercent}
                    onChange={(e) => setAssumedCvrPercent(Number(e.target.value))}
                    className="w-full accent-[#D99614]"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-slate-300 font-medium">Assumed Average Cost Per Click ($ CPC)</label>
                    <span className="font-mono font-bold text-white">${assumedCpcDollars.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={1.5}
                    max={25}
                    step={0.25}
                    value={assumedCpcDollars}
                    onChange={(e) => setAssumedCpcDollars(Number(e.target.value))}
                    className="w-full accent-[#D99614]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-slate-400 mb-1">Lead-to-Sale Close Rate (%)</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={assumedCloseRatePercent}
                      onChange={(e) => setAssumedCloseRatePercent(Number(e.target.value) || 0)}
                      className="w-full bg-[#151D2A] border border-[#A9C7E5]/20 rounded px-3 py-1.5 font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Avg Customer Value ($)</label>
                    <input
                      type="number"
                      min={50}
                      step={50}
                      value={assumedAvgTicketDollars}
                      onChange={(e) => setAssumedAvgTicketDollars(Number(e.target.value) || 0)}
                      className="w-full bg-[#151D2A] border border-[#A9C7E5]/20 rounded px-3 py-1.5 font-mono text-white"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-slate-300 font-medium">Modeled Monthly Ad Budget ($)</label>
                    <span className="font-mono font-bold text-[#D99614]">
                      ${monthlyAdBudget.toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={500}
                    max={25000}
                    step={250}
                    value={monthlyAdBudget}
                    onChange={(e) => setMonthlyAdBudget(Number(e.target.value))}
                    className="w-full accent-[#D99614]"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-slate-300 font-medium">
                      OtterWatch 5×5 Nodes Promoted into Top-3 Map Pack
                    </label>
                    <span className="font-mono font-bold text-emerald-400">
                      +{expectedRankLiftNodes} Nodes
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={25}
                    step={1}
                    value={expectedRankLiftNodes}
                    onChange={(e) => setExpectedRankLiftNodes(Number(e.target.value))}
                    className="w-full accent-[#D99614]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right 6 Cols: Modeled Scenario Outputs & Formula Transparency */}
          <div className="lg:col-span-6 bg-[#111622] border border-[#A9C7E5]/15 rounded-xl p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#A9C7E5]/10 pb-3">
                <div>
                  <span className="font-mono text-[10px] uppercase text-[#D99614] font-bold block">
                    SCENARIO PROJECTION OUTPUT
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {mode === 'REVERSE_GOAL'
                      ? 'Required Supporting Investment & Funnel Math'
                      : 'Projected Monthly Volume & Local Pack Lift'}
                  </h3>
                </div>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#151D2A] text-slate-300 border border-[#A9C7E5]/15">
                  SCENARIO SIMULATION
                </span>
              </div>

              {mode === 'REVERSE_GOAL' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#151D2A] border border-[#A9C7E5]/12">
                    <span className="text-[11px] text-slate-400 block">Required Monthly Budget</span>
                    <span className="text-2xl font-bold font-mono text-[#D99614]">
                      ${requiredAdBudget.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 block mt-1">
                      Formula: {requiredClicks} Clicks × ${assumedCpcDollars.toFixed(2)} CPC
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#151D2A] border border-[#A9C7E5]/12">
                    <span className="text-[11px] text-slate-400 block">Modeled Cost Per Lead</span>
                    <span className="text-2xl font-bold font-mono text-white">
                      ${modeledCpl.toFixed(2)}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 block mt-1">
                      Formula: Budget / {targetMonthlyLeads} Target Leads
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#151D2A] border border-[#A9C7E5]/12">
                    <span className="text-[11px] text-slate-400 block">Required High-Intent Clicks</span>
                    <span className="text-xl font-bold font-mono text-white">
                      {requiredClicks.toLocaleString()} Clicks
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 block mt-1">
                      At {assumedCvrPercent.toFixed(1)}% CVR
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#151D2A] border border-[#A9C7E5]/12">
                    <span className="text-[11px] text-slate-400 block">Projected Gross Revenue</span>
                    <span className="text-xl font-bold font-mono text-emerald-400">
                      ${projectedGrossRevenue.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 block mt-1">
                      {projectedClosedDeals} Deals × ${assumedAvgTicketDollars}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#151D2A] border border-[#A9C7E5]/12">
                    <span className="text-[11px] text-slate-400 block">Projected Total Monthly Leads</span>
                    <span className="text-2xl font-bold font-mono text-[#D99614]">
                      {forwardTotalLeads} Leads
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 block mt-1">
                      {forwardPaidLeads} Paid + {forwardOrganicLiftLeads} Local Pack Lift
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#151D2A] border border-[#A9C7E5]/12">
                    <span className="text-[11px] text-slate-400 block">Projected Paid Traffic</span>
                    <span className="text-2xl font-bold font-mono text-white">
                      {forwardClicks.toLocaleString()} Clicks
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 block mt-1">
                      ${monthlyAdBudget.toLocaleString()} / ${assumedCpcDollars.toFixed(2)} CPC
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#A9C7E5]/10 flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] text-slate-400">
                {isCertified
                  ? '✓ Baseline Certified — Ready for Strategy Approval'
                  : '🔒 Deployment Locked (Uncertified Client Baseline)'}
              </span>
              <button
                type="button"
                disabled={!isCertified}
                className="px-4 py-2 bg-[#D99614] hover:bg-[#B97A08] disabled:opacity-40 disabled:cursor-not-allowed text-[#0B0F17] font-semibold text-xs rounded-lg transition-all"
              >
                {isCertified ? 'Approve Scenario for Execution' : 'Deployment Gate Locked'}
              </button>
            </div>
          </div>
        </div>

        <TriPartInsightCard
          title="Opportunity Lab Modeling Governance"
          category="DECISION DESK"
          confidence={isCertified ? 'HIGH' : 'MEDIUM'}
          sources={['OPPORTUNITY_LAB_ENGINE']}
          whatIsHappening={`Currently modeling ${targetMonthlyLeads} target monthly leads requiring an estimated $${requiredAdBudget.toLocaleString()} monthly ad budget at ${assumedCvrPercent.toFixed(1)}% CVR.`}
          whyItIsHappening="Scenario outputs are explicitly separated from historical telemetry so agency strategists can test sensitivity assumptions transparently."
          whatToDoNext="Certify the client's live provider connections in Connection Center to unlock live strategy deployment."
        />
      </main>
    </div>
  );
}

export default function OutcomeLabPage() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col font-sans">
      <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading Header...</div>}>
        <GlobalHeader />
      </Suspense>
      <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading Opportunity Lab...</div>}>
        <OpportunityLabContent />
      </Suspense>
    </div>
  );
}
