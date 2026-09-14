'use client';

import React from 'react';
import { useClient } from '@/lib/client-context';

export function GlobalHeader() {
  const { activeClient, clients, setActiveClient, isLoading } = useClient();

  return (
    <header className="bg-[#0B0F17] border-b border-[#A9C7E5]/10 px-6 py-3 flex justify-between items-center text-white">
      <div className="flex items-center space-x-6">
        <span className="font-bold tracking-wider text-sm text-[#55A9E6]">PORCHLIGHT</span>
        <span className="text-xs text-slate-400 font-mono">
          {activeClient?.is_certified ? '✓ CERTIFIED DATA' : '⚠ DATA REVIEW REQUIRED'}
        </span>
      </div>

      <div className="flex items-center space-x-4">
        {/* DYNAMIC MULTI-TENANT CLIENT SELECTOR */}
        <div className="flex items-center space-x-2 bg-[#111622] border border-[#A9C7E5]/20 rounded-md px-3 py-1.5">
          <span className="text-xs text-slate-400 font-mono">Select Pitch Prospect:</span>
          {isLoading ? (
            <span className="text-xs text-slate-500 animate-pulse">Loading clients...</span>
          ) : (
            <select
              value={activeClient?.id || ''}
              onChange={(e) => {
                const target = clients.find((c) => c.id === e.target.value);
                if (target) setActiveClient(target);
              }}
              className="bg-transparent text-xs font-mono text-amber-400 focus:outline-none cursor-pointer"
            >
              {clients.map((client) => (
                <option key={client.id} value={client.id} className="bg-[#111622] text-white">
                  {client.name} {client.is_certified ? '(Certified)' : '(Uncertified)'}
                </option>
              ))}
            </select>
          )}
        </div>

        <button className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold px-3 py-1.5 rounded hover:bg-amber-500/20 transition-all">
          ✨ ASK BEACON
        </button>
      </div>
    </header>
  );
}
