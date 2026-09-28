'use client';

import React from 'react';
import { useClient } from '../../lib/client-context';

export default function GlobalHeader() {
  const { activeClient, clients, setActiveClientId } = useClient();

  return (
    <header className="h-16 bg-white border-b border-[#DCE5EF] px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Search / Client Context Bar */}
      <div className="flex items-center space-x-4 flex-1 max-w-xl">
        <div className="relative w-full">
          <label className="text-[9px] font-mono text-slate-400 uppercase font-bold block mb-0.5">
            ACTIVE CLIENT CONTEXT
          </label>
          <select
            value={activeClient?.id || ''}
            onChange={(e) => setActiveClientId(e.target.value)}
            className="w-full bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg px-3 py-1.5 text-xs font-bold text-[#0B1F3A] focus:outline-none focus:border-[#D99614] cursor-pointer"
          >
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} {client.is_certified ? '(Certified)' : '(Uncertified)'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right User & Date Controls */}
      <div className="flex items-center space-x-4">
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
