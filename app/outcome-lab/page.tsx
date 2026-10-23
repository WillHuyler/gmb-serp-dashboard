'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useClient } from '../../lib/client-context';
import TrustCertificationStrip, {
  DataTrustState,
} from '../../components/design-system/TrustCertificationStrip';
import TriPartInsightCard from '../../components/design-system/TriPartInsightCard';

export const dynamic = 'force-dynamic';

function OpportunityLabContent() {
  const { activeClient, reportingPeriod } = useClient();
  const isCertified = Boolean(activeClient?.is_certified);

  const [mode, setMode] = useState<'REVERSE_GOAL' | 'FORWARD_SIMULATOR'>('REVERSE_GOAL');

  const [targetMonthlyLeads, setTargetMonthlyLeads] = useState<number>(60);
  const [assumedCvrPercent, setAssumedCvrPercent] = useState<number>(8.5);
  const [assumedCpcDollars, setAssumedCpcDollars] = useState<number>(6.25);
  const [assumedCloseRatePercent, setAssumedCloseRatePercent] = useState<number>(28);
  const [assumedAvgTicketDollars, setAssumedAvgTicketDollars] = useState<number>(850);

  const [monthlyAdBudget, setMonthlyAdBudget] = useState<number>(4500);
  const [expectedRankLiftNodes, setExpectedRankLiftNodes] = useState<number>(6);

  const requiredClicks =
    assumedCvrPercent > 0 ? Math.ceil(targetMonthlyLeads / (assumedCvrPercent / 100)) : 0;
  const requiredAdBudget = Math.round(requiredClicks * assumedCpcDollars);
  const projectedClosedDeals = Math.round(targetMonthlyLeads * (assumedCloseRatePercent / 100));
  const projectedGrossRevenue = projectedClosedDeals * assumedAvgTicketDollars;
  const modeledCpl =
    targetMonthlyLeads > 0 ? requiredAdBudget / targetMonthlyLeads : 0;

  const forwardClicks =
    assumedCpcDollars > 0 ? Math.floor(monthlyAdBudget / assumedCpcDollars) : 0;
  const forwardPaidLeads = Math.round(forwardClicks * (assumedCvrPercent / 100));
  const forwardOrganicLiftLeads = Math.round(expectedRankLiftNodes * 2.5);
  const forwardTotalLeads = forwardPaidLeads + forwardOrganicLiftLeads;

  const trustState: DataTrustState = isCertified ? 'CERTIFIED_LIVE' : 'UNMAPPED_SETUP';

  return (
    <div className="flex-1 flex flex-col bg-[#F4F7FB] text-[#0B1F3A]">
      <TrustCertificationStrip
        client={activeClient}
        trustState={trustState}
        reportingPeriod={reportingPeriod}
      />

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6 font-sans">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-[#DCE5EF] rounded-xl p-6 shadow-sm">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#D99614] font-bold block">
              OPPORTUNITY LAB • REVERSE GOAL TARGETING & FORWARD SCENARIO MODELING
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0B1F3A] mt-1">
              Opportunity Lab & Decision Desk — {activeClient?.name || 'Select Client'}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Interactive forward and reverse business outcome modeling with transparent formulas and strict baseline provenance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode('REVERSE_GOAL')}
              className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                mode === 'REVERSE_GOAL'
                  ? 'bg-[#0B1F3A] text-white border-[#0B1F3A]'
                  : 'bg-[#F4F7FB] text-slate-700 border-[#DCE5EF]'
              }`}
            >
              Reverse Goal Planner
            </button>
            <button
              type="button"
              onClick={() => setMode('FORWARD_SIMULATOR')}
              className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                mode === 'FORWARD_SIMULATOR'
                  ? 'bg-[#0B1F3A] text-white border-[#0B1F3A]'
                  : 'bg-[#F4F7FB] text-slate-700 border-[#DCE5EF]'
              }`}
            >
              Forward What-If Simulator
            </button>
          </div>
        </div>

        {!isCertified && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-900 uppercase block">
                🔒 MODEL NOT READY FOR LIVE DEPLOYMENT • MANUAL ASSUMPTION SANDBOX ACTIVE
              </span>
              <p className="text-xs text-amber-800">
                {activeClient?.name || 'This client'} does not yet have a certified telemetry baseline. You may interactively model scenarios using manual assumptions below, but live strategy deployment is locked until provider data is certified.
              </p>
            </div>
            {activeClient && (
              <Link
                href={`/connection-center?clientId=${activeClient.id}`}
                className="px-4 py-2 bg-[#0B1F3A] hover:bg-[#16325B] text-white rounded-lg text-xs font-bold shrink-0"
              >
                Certify Client Baseline →
              </Link>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white border border-[#DCE5EF] rounded-xl p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#DCE5EF] pb-3">
              <div>
                <span className="text-[11px] uppercase text-[#D99614] font-bold block">
                  INTERACTIVE ASSUMPTION CONTROLS
                </span>
                <h3 className="text-base font-bold text-[#0B1F3A]">
                  {mode === 'REVERSE_GOAL'
                    ? 'Define Target Business Outcome'
                    : 'Adjust Forward Scenario Inputs'}
                </h3>
              </div>
              <span className="font-mono text-[10px] px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                MANUAL ASSUMPTIONS
              </span>
            </div>

            {mode === 'REVERSE_GOAL' ? (
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-[#0B1F3A] font-bold">Target Qualified Monthly Leads</label>
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
                    <label className="text-[#0B1F3A] font-bold">Assumed Landing Page / Call Conversion Rate (%)</label>
                    <span className="font-mono font-bold text-[#0B1F3A]">{assumedCvrPercent.toFixed(1)}%</span>
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
                    <label className="text-[#0B1F3A] font-bold">Assumed Average Cost Per Click ($ CPC)</label>
                    <span className="font-mono font-bold text-[#0B1F3A]">${assumedCpcDollars.toFixed(2)}</span>
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
                    <label className="block text-slate-600 font-semibold mb-1">Lead-to-Sale Close Rate (%)</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={assumedCloseRatePercent}
                      onChange={(e) => setAssumedCloseRatePercent(Number(e.target.value) || 0)}
                      className="w-full bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg px-3 py-2 font-mono font-bold text-[#0B1F3A]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Avg Customer Value ($)</label>
                    <input
                      type="number"
                      min={50}
                      step={50}
                      value={assumedAvgTicketDollars}
                      onChange={(e) => setAssumedAvgTicketDollars(Number(e.target.value) || 0)}
                      className="w-full bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg px-3 py-2 font-mono font-bold text-[#0B1F3A]"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-[#0B1F3A] font-bold">Modeled Monthly Ad Budget ($)</label>
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
                    <label className="text-[#0B1F3A] font-bold">
                      OtterWatch 5×5 Nodes Promoted into Top-3 Map Pack
                    </label>
                    <span className="font-mono font-bold text-emerald-700">
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

          <div className="lg:col-span-6 bg-white border border-[#DCE5EF] rounded-xl p-6 flex flex-col justify-between space-y-5 shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#DCE5EF] pb-3">
                <div>
                  <span className="text-[11px] uppercase text-[#D99614] font-bold block">
                    SCENARIO PROJECTION OUTPUT
                  </span>
                  <h3 className="text-base font-bold text-[#0B1F3A]">
                    {mode === 'REVERSE_GOAL'
                      ? 'Required Supporting Investment & Funnel Math'
                      : 'Projected Monthly Volume & Local Pack Lift'}
                  </h3>
                </div>
                <span className="font-mono text-[10px] px-2.5 py-0.5 rounded bg-[#F4F7FB] text-[#0B1F3A] border border-[#DCE5EF] font-bold">
                  SCENARIO SIMULATION
                </span>
              </div>

              {mode === 'REVERSE_GOAL' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#F4F7FB] border border-[#DCE5EF]">
                    <span className="text-xs font-semibold text-slate-600 block">Required Monthly Budget</span>
                    <span className="text-2xl font-extrabold font-sans text-[#D99614]">
                      ${requiredAdBudget.toLocaleString()}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 block mt-1">
                      Formula: {requiredClicks} Clicks × ${assumedCpcDollars.toFixed(2)} CPC
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F4F7FB] border border-[#DCE5EF]">
                    <span className="text-xs font-semibold text-slate-600 block">Modeled Cost Per Lead</span>
                    <span className="text-2xl font-extrabold font-sans text-[#0B1F3A]">
                      ${modeledCpl.toFixed(2)}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 block mt-1">
                      Formula: Budget / {targetMonthlyLeads} Target Leads
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F4F7FB] border border-[#DCE5EF]">
                    <span className="text-xs font-semibold text-slate-600 block">Required High-Intent Clicks</span>
                    <span className="text-xl font-extrabold font-sans text-[#0B1F3A]">
                      {requiredClicks.toLocaleString()} Clicks
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 block mt-1">
                      At {assumedCvrPercent.toFixed(1)}% CVR
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F4F7FB] border border-[#DCE5EF]">
                    <span className="text-xs font-semibold text-slate-600 block">Projected Gross Revenue</span>
                    <span className="text-xl font-extrabold font-sans text-emerald-700">
                      ${projectedGrossRevenue.toLocaleString()}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 block mt-1">
                      {projectedClosedDeals} Deals × ${assumedAvgTicketDollars}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#F4F7FB] border border-[#DCE5EF]">
                    <span className="text-xs font-semibold text-slate-600 block">Projected Total Monthly Leads</span>
                    <span className="text-2xl font-extrabold font-sans text-[#D99614]">
                      {forwardTotalLeads} Leads
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 block mt-1">
                      {forwardPaidLeads} Paid + {forwardOrganicLiftLeads} Local Pack Lift
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F4F7FB] border border-[#DCE5EF]">
                    <span className="text-xs font-semibold text-slate-600 block">Projected Paid Traffic</span>
                    <span className="text-2xl font-extrabold font-sans text-[#0B1F3A]">
                      {forwardClicks.toLocaleString()} Clicks
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 block mt-1">
                      ${monthlyAdBudget.toLocaleString()} / ${assumedCpcDollars.toFixed(2)} CPC
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#DCE5EF] flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-600">
                {isCertified
                  ? '✓ Baseline Certified — Ready for Strategy Approval'
                  : '🔒 Deployment Locked (Uncertified Client Baseline)'}
              </span>
              <button
                type="button"
                disabled={!isCertified}
                className="px-4 py-2 bg-[#D99614] hover:bg-[#B87D0E] disabled:opacity-40 disabled:cursor-not-allowed text-[#0B1F3A] font-bold text-xs rounded-lg transition-all"
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
    <Suspense fallback={<div className="p-6 text-xs text-slate-500">Loading Opportunity Lab...</div>}>
      <OpportunityLabContent />
    </Suspense>
  );
}
