'use client';

import React from 'react';
import { useClient } from '../../lib/client-context';

export default function GlobalHeader() {
  const { activeClient, clients, setActiveClientId } = useClient();

  return (
    <header className="h-16 bg-white border-b border-[#DCE5EF] px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Search & Client Switcher */}
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

      {/* Date Range & User Context */}
      <div className="flex items-center space-x-4">
        <div className="bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-[#0B1F3A] flex items-center space-x-2">
          <span>📅 Jun 1, 2026 – Aug 27, 2026</span>
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
