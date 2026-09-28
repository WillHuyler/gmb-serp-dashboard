'use client';

import React, { useState } from 'react';
import { useClient } from '../../lib/client-context';

export interface GlobalHeaderProps {
  onOpenBeacon?: () => void;
}

export function GlobalHeader({ onOpenBeacon }: GlobalHeaderProps) {
  const { activeClient, clients, setActiveClientId, isLoading } = useClient();
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
    <header className="h-16 bg-[#0D131F] border-b border-[#A9C7E5]/10 px-6 flex items-center justify-between sticky top-0 z-40 text-white">
      {/* Search & Active Client Selector */}
      <div className="flex items-center space-x-4 flex-1 max-w-2xl">
        <div className="relative w-72">
          <div className="flex items-center space-x-2 mb-0.5">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">
              Active Client Context
            </span>
            {activeClient && (
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                  activeClient.is_certified
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                {activeClient.is_certified ? '✓ CERTIFIED' : 'UNCERTIFIED'}
              </span>
            )}
          </div>
          <select
            value={activeClient?.id || ''}
            onChange={(e) => setActiveClientId(e.target.value)}
            disabled={isLoading}
            className="w-full bg-[#151D2A] border border-[#A9C7E5]/20 rounded px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-[#D99614] cursor-pointer"
          >
            {clients.map((client) => (
              <option key={client.id} value={client.id} className="bg-[#151D2A] text-white">
                {client.name} {client.is_certified ? '(Certified)' : '(Uncertified Baseline)'}
              </option>
            ))}
          </select>
        </div>

        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search clients, locations, or keywords... (Ctrl K)"
            className="w-full bg-[#151D2A] border border-[#A9C7E5]/20 rounded px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D99614]"
          />
        </div>
      </div>

      {/* Action Controls, Date Picker & User Identity */}
      <div className="flex items-center space-x-3">
        {onOpenBeacon && (
          <button
            onClick={onOpenBeacon}
            className="flex items-center space-x-2 bg-[#D99614]/10 border border-[#D99614]/40 text-[#D99614] hover:bg-[#D99614]/20 text-xs font-mono font-bold px-3 py-1.5 rounded transition-all cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-[#D99614] animate-pulse"></span>
            <span>ASK BEACON</span>
          </button>
        )}

        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="bg-[#151D2A] border border-[#A9C7E5]/20 rounded px-3 py-1.5 text-xs font-mono font-bold text-slate-200 flex items-center space-x-2 hover:bg-[#1C2738] transition-all cursor-pointer"
          >
            <span>📅 {dateRange}</span>
            <span className="text-[10px] text-slate-400">▼</span>
          </button>

          {showDatePicker && (
            <div className="absolute right-0 mt-2 w-56 bg-[#151D2A] border border-[#A9C7E5]/20 rounded-xl shadow-lg p-2 z-50 text-xs font-mono text-white">
              <span className="text-[10px] text-slate-400 uppercase font-bold px-2 py-1 block border-b border-[#A9C7E5]/10 mb-1">
                SELECT TIME PERIOD
              </span>
              {presets.map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setDateRange(preset);
                    setShowDatePicker(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-[#1C2738] text-slate-200 block cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-[#A9C7E5]/10"></div>

        <div className="text-right">
          <span className="text-xs font-bold text-white block">Will Huyler</span>
          <span className="text-[10px] font-mono text-slate-400 block">Agency Admin</span>
        </div>
        <div className="w-8 h-8 rounded bg-[#151D2A] border border-[#A9C7E5]/20 text-[#55A9E6] flex items-center justify-center font-bold text-xs font-mono">
          WH
        </div>
      </div>
    </header>
  );
}

export default GlobalHeader;
