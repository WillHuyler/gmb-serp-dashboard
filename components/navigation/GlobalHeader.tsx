'use client';

import React, { useState } from 'react';
import { useClient } from '../../lib/client-context';

export default function GlobalHeader() {
  const { activeClient, clients, setActiveClientId } = useClient();
  const [dateRange, setDateRange] = useState('Jun 1, 2026 – Aug 27, 2026');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const presets = [
    'Last 7 Days',
    'Last 30 Days',
    'MTD (Month to Date)',
    'QTD (Quarter to Date)',
    'Jun 1, 2026 – Aug 27, 2026',
  ];

  return (
    <header className="h-16 bg-white border-b border-[#DCE5EF] px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Search & Active Client Selector */}
      <div className="flex items-center space-x-4 flex-1 max-w-2xl">
        <div className="relative w-64">
          <select
            value={activeClient?.id || ''}
            onChange={(e) => setActiveClientId(e.target.value)}
            className="w-full bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg px-3 py-2 text-xs font-bold text-[#0B1F3A] focus:outline-none focus:border-[#D99614] cursor-pointer"
          >
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} {client.is_certified ? '(Certified)' : '(Uncertified)'}
              </option>
            ))}
          </select>
        </div>

        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search clients, locations, or keywords... (Ctrl K)"
            className="w-full bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg pl-9 pr-4 py-2 text-xs text-[#0B1F3A] focus:outline-none focus:border-[#D99614]"
          />
          <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>
      </div>

      {/* Interactive Date Range & User Identity */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-[#0B1F3A] flex items-center space-x-2 hover:bg-[#EBF3FF] transition-all cursor-pointer"
          >
            <span>📅 {dateRange}</span>
            <span className="text-[10px] text-slate-400">▼</span>
          </button>

          {showDatePicker && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-[#DCE5EF] rounded-xl shadow-lg p-2 z-50 text-xs font-mono">
              <span className="text-[10px] text-slate-400 uppercase font-bold px-2 py-1 block border-b border-[#DCE5EF] mb-1">
                SELECT TIME PERIOD
              </span>
              {presets.map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setDateRange(preset);
                    setShowDatePicker(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-[#F4F7FB] text-[#0B1F3A] block cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="text-right">
          <span className="text-xs font-bold text-[#0B1F3A] block">Will Huyler</span>
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Agency Admin</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#0B1F3A] text-white flex items-center justify-center font-bold text-xs">
          WH
        </div>
      </div>
    </header>
  );
}
