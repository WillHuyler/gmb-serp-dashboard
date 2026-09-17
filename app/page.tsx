'use client';

import React from 'react';
import { useClient } from '../lib/client-context';
import PlaidInsightsPanel from '../components/beacon/PlaidInsightsPanel';
import TerritoryPerformance from '../components/analytics/TerritoryPerformance';
import KeywordsTable from '../components/analytics/KeywordsTable';
import VisibilityChart from '../components/analytics/VisibilityChart';

export default function DashboardPage() {
  const { activeClient, setActiveClient } = useClient();

  // Aligned with lib/client-context.tsx default objects
  const availableClients = [
    {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      name: 'ABC Motors',
      tenant_id: '00000000-0000-0000-0000-000000000001',
      is_certified: false,
    },
    {
      id: 'bf93fef0-fc60-4119-8ea2-68a274984355',
      name: 'High Rise Chimney Sweep & Service',
      tenant_id: '00000000-0000-0000-0000-000000000001',
      is_certified: true,
    },
    {
      id: 'c2d3e4f5-a6b7-8901-bcde-f23456789012',
      name: 'Apex Dental Group',
      tenant_id: '00000000-0000-0000-0000-000000000001',
      is_certified: true,
    },
    {
      id: 'd3e4f5a6-b7c8-9012-cdef-345678901234',
      name: 'Kelly Hyundai',
      tenant_id: '00000000-0000-0000-0000-000000000001',
      is_certified: true,
    },
  ];

  const handleClientChange = (clientId: string) => {
    const selected = availableClients.find((c) => c.id === clientId);
    if (selected) {
      setActiveClient(selected);
    }
  };

  return (
    <div className="space-y-6 text-[#0B1F3A]">
      {/* 1. HEADER SECTION */}
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">
            CLIENT DASHBOARD
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-[#0B1F3A] mt-0.5">
            {activeClient?.name || 'ABC Motors'}
          </h1>
          <p className="text-xs text-[#53657D] mt-1">
            Local search intelligence, paid media performance, and growth opportunities — all in one place.
          </p>
        </div>

        {/* TOP ACTION HIERARCHY */}
        <div className="flex flex-col items-end space-y-3">
          <div className="text-xs font-serif italic text-[#0B1F3A]/70 flex items-center space-x-1">
            <span>Shine a Light on What Works.</span>
          </div>
          <div className="flex items-center space-x-3">
            <button className="bg-[#D99614] hover:bg-[#B97A08] text-white font-mono font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer">
              <span>⚡</span>
              <span>Analyze & Recommend</span>
            </button>
            <button className="bg-white border border-[#DCE5EF] hover:bg-[#F4F7FB] text-[#0B1F3A] font-mono text-xs px-3.5 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer">
              Export PDF
            </button>
            <button className="bg-white border border-[#DCE5EF] hover:bg-[#F4F7FB] text-[#0B1F3A] font-mono text-xs px-3.5 py-2.5 rounded-lg shadow-sm transition-all flex items-center space-x-1 cursor-pointer">
              <span>✨</span>
              <span>Ask Plaid</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. FILTER & CONTROL BAR */}
      <div className="bg-white border border-[#DCE5EF] rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-4 shadow-sm">
        <div>
          <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
            CLIENT
          </label>
          <select
            value={activeClient?.id || ''}
            onChange={(e) => handleClientChange(e.target.value)}
            className="w-full bg-white border border-[#DCE5EF] rounded-lg px-3 py-2 text-xs font-bold text-[#0B1F3A] focus:outline-none focus:border-[#D99614]"
          >
            {availableClients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} {client.is_certified ? '(Certified)' : '(Uncertified)'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
            PLATFORM
          </label>
          <select className="w-full bg-white border border-[#DCE5EF] rounded-lg px-3 py-2 text-xs font-bold text-[#0B1F3A] focus:outline-none">
            <option>Google My Business (GMB)</option>
            <option>Google Ads (PPC)</option>
            <option>Meta Ads</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
            COMPARE
          </label>
          <select className="w-full bg-white border border-[#DCE5EF] rounded-lg px-3 py-2 text-xs font-bold text-[#0B1F3A] focus:outline-none">
            <option>MTD vs. Last MTD</option>
            <option>QTD vs. Last QTD</option>
            <option>YoY Performance</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
            SERVICE AREA
          </label>
          <select className="w-full bg-white border border-[#DCE5EF] rounded-lg px-3 py-2 text-xs font-bold text-[#0B1F3A] focus:outline-none">
            <option>All Service Territory ZIPs (5)</option>
            <option>Primary ZIP (53202)</option>
          </select>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE GRID WITH PLAID AI PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#EBF3FF] border border-[#DCE5EF] rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center text-xs text-[#53657D] font-mono font-bold">
                <span>INTERACTIONS</span>
                <span className="w-6 h-6 rounded-full bg-blue-500/10 text-[#1478F2] flex items-center justify-center text-xs">💬</span>
              </div>
              <div className="text-3xl font-bold text-[#0B1F3A]">68</div>
              <div className="flex justify-between items-end">
                <div className="text-[11px] font-mono text-[#12A36D] font-bold">
                  ↑ +75% <div className="text-slate-400 font-normal text-[10px]">vs. Last MTD</div>
                </div>
              </div>
            </div>

            <div className="bg-[#EAF8F2] border border-[#DCE5EF] rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center text-xs text-[#53657D] font-mono font-bold">
                <span>PHONE CALLS</span>
                <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-[#12A36D] flex items-center justify-center text-xs">📞</span>
              </div>
              <div className="text-3xl font-bold text-[#0B1F3A]">14</div>
              <div className="flex justify-between items-end">
                <div className="text-[11px] font-mono text-[#12A36D] font-bold">
                  ↑ +45% <div className="text-slate-400 font-normal text-[10px]">vs. Last MTD</div>
                </div>
              </div>
            </div>

            <div className="bg-[#F1EEFF] border border-[#DCE5EF] rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center text-xs text-[#53657D] font-mono font-bold">
                <span>DIRECTIONS</span>
                <span className="w-6 h-6 rounded-full bg-purple-500/10 text-[#7257E8] flex items-center justify-center text-xs">📍</span>
              </div>
              <div className="text-3xl font-bold text-[#0B1F3A]">18</div>
              <div className="flex justify-between items-end">
                <div className="text-[11px] font-mono text-[#12A36D] font-bold">
                  ↑ +33% <div className="text-slate-400 font-normal text-[10px]">vs. Last MTD</div>
                </div>
              </div>
            </div>

            <div className="bg-[#FFF4EB] border border-[#DCE5EF] rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center text-xs text-[#53657D] font-mono font-bold">
                <span>WEBSITE CLICKS</span>
                <span className="w-6 h-6 rounded-full bg-orange-500/10 text-[#F58A24] flex items-center justify-center text-xs">🖱️</span>
              </div>
              <div className="text-3xl font-bold text-[#0B1F3A]">36</div>
              <div className="flex justify-between items-end">
                <div className="text-[11px] font-mono text-[#12A36D] font-bold">
                  ↑ +77% <div className="text-slate-400 font-normal text-[10px]">vs. Last MTD</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TerritoryPerformance />
            <VisibilityChart />
          </div>

          <KeywordsTable />
        </div>

        <div className="lg:col-span-1">
          <PlaidInsightsPanel />
        </div>
      </div>
    </div>
  );
}
