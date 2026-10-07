'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useClient } from '../../lib/client-context';

export default function GlobalHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeClient, setActiveClient, clientRegistry } = useClient();

  const currentStartDate = searchParams.get('startDate') || '2026-09-01';
  const currentEndDate = searchParams.get('endDate') || '2026-09-30';
  const currentCompareMode = searchParams.get('compare') || 'PREVIOUS_PERIOD';
  const currentZip = searchParams.get('zip') || 'ALL';

  const [showAlertModal, setShowAlertModal] = useState(false);

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const client = clientRegistry.find((c) => c.id === selectedId);
    if (client) {
      setActiveClient(client);
      const params = new URLSearchParams(searchParams.toString());
      params.set('clientId', client.id);
      params.delete('zip'); // Clear stale service-area selections on client switch
      router.push(`?${params.toString()}`);
    }
  };

  const handleDatePresetChange = (preset: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const today = new Date('2026-10-06');

    let start = '2026-09-01';
    let end = '2026-09-30';

    if (preset === '7d') {
      const d = new Date(today);
      d.setDate(d.getDate() - 7);
      start = d.toISOString().split('T')[0];
      end = today.toISOString().split('T')[0];
    } else if (preset === '30d') {
      const d = new Date(today);
      d.setDate(d.getDate() - 30);
      start = d.toISOString().split('T')[0];
      end = today.toISOString().split('T')[0];
    } else if (preset === 'mtd') {
      start = '2026-10-01';
      end = '2026-10-06';
    } else if (preset === 'qtd') {
      start = '2026-07-01';
      end = '2026-10-06';
    } else if (preset === 'ytd') {
      start = '2026-01-01';
      end = '2026-10-06';
    }

    params.set('startDate', start);
    params.set('endDate', end);
    router.push(`?${params.toString()}`);
  };

  const handleCompareChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('compare', e.target.value);
    router.push(`?${params.toString()}`);
  };

  const handleServiceAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value === 'ALL') {
      params.delete('zip');
    } else {
      params.set('zip', e.target.value);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <header className="h-16 bg-[#111622] border-b border-[#A9C7E5]/10 px-6 flex items-center justify-between sticky top-0 z-50">
      {/* Brand & Client Roster Selector */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          {/* Logo Asset Slot */}
          <div className="w-7 h-7 bg-[#D99614]/20 border border-[#D99614] rounded flex items-center justify-center font-mono font-bold text-xs text-[#D99614]">
            PL
          </div>
          <span className="font-bold tracking-wider text-sm font-mono text-white">PORCHLIGHT</span>
        </div>

        {/* Global Client Registry Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase">CLIENT:</span>
          <select
            value={activeClient?.id || ''}
            onChange={handleClientChange}
            className="bg-[#151D2A] text-xs font-mono font-bold text-white border border-[#A9C7E5]/20 rounded px-2.5 py-1.5 focus:outline-none focus:border-[#D99614]"
          >
            {clientRegistry.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.is_certified ? '✓' : '(Uncertified)'}
              </option>
            ))}
          </select>
        </div>

        {/* Client-Aware Service Area Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase">AREA:</span>
          <select
            value={currentZip}
            onChange={handleServiceAreaChange}
            className="bg-[#151D2A] text-xs font-mono text-slate-300 border border-[#A9C7E5]/10 rounded px-2 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Service Areas</option>
            {activeClient?.service_areas?.map((zip) => (
              <option key={zip} value={zip}>
                ZIP {zip}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Date Presets, Compare Control & Alert Bell */}
      <div className="flex items-center space-x-3">
        {/* Date Presets */}
        <div className="flex items-center space-x-1 bg-[#151D2A] border border-[#A9C7E5]/10 rounded p-1 text-[11px] font-mono">
          <button onClick={() => handleDatePresetChange('7d')} className="px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300">7D</button>
          <button onClick={() => handleDatePresetChange('30d')} className="px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300">30D</button>
          <button onClick={() => handleDatePresetChange('mtd')} className="px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300">MTD</button>
          <button onClick={() => handleDatePresetChange('qtd')} className="px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300">QTD</button>
          <button onClick={() => handleDatePresetChange('ytd')} className="px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300">YTD</button>
        </div>

        {/* Date Range Display */}
        <div className="text-xs font-mono bg-[#151D2A] border border-[#A9C7E5]/10 rounded px-3 py-1.5 text-slate-300">
          📅 <span className="text-white font-bold">{currentStartDate}</span> to <span className="text-white font-bold">{currentEndDate}</span>
        </div>

        {/* Compare Control */}
        <div className="flex items-center space-x-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">VS:</span>
          <select
            value={currentCompareMode}
            onChange={handleCompareChange}
            className="bg-[#151D2A] text-xs font-mono text-slate-300 border border-[#A9C7E5]/10 rounded px-2 py-1.5 focus:outline-none"
          >
            <option value="PREVIOUS_PERIOD">Previous Period</option>
            <option value="PREVIOUS_MONTH">Previous Month</option>
            <option value="PREVIOUS_QUARTER">Previous Quarter</option>
            <option value="PREVIOUS_YEAR">Previous Year</option>
          </select>
        </div>

        {/* Top Header Alert Indicator Control */}
        <button
          onClick={() => setShowAlertModal(!showAlertModal)}
          className="relative p-2 bg-[#151D2A] hover:bg-[#1C273A] border border-[#A9C7E5]/10 rounded text-slate-300 transition-all"
          title="System Alerts & Telemetry Notifications"
        >
          🔔
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#D99614] rounded-full"></span>
        </button>

        {showAlertModal && (
          <div className="absolute right-6 top-16 w-80 bg-[#111622] border border-[#A9C7E5]/20 rounded-xl shadow-2xl p-4 z-50 text-xs font-mono space-y-3">
            <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-2">
              <span className="font-bold text-white uppercase">SYSTEM ALERTS</span>
              <button onClick={() => setShowAlertModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-2">
              <div className="p-2 bg-[#151D2A] rounded border border-emerald-500/20 text-emerald-400">
                ✓ Integration Sync: All 8 connectors operational.
              </div>
              <div className="p-2 bg-[#151D2A] rounded border border-amber-500/20 text-amber-400">
                ⚠ OtterWatch: 5x5 Grid scan scheduled in 4 hours.
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
