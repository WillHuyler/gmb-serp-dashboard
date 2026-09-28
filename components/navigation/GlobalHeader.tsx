'use client';

import React from 'react';
import { useClient } from '@/lib/client-context';

interface GlobalHeaderProps {
  onOpenBeacon?: () => void;
}

export default function GlobalHeader({ onOpenBeacon }: GlobalHeaderProps) {
  const { activeClient, clients, setActiveClientId, isLoading } = useClient();

  return (
    <header className="h-16 bg-[#0D131F] border-b border-[#A9C7E5]/10 px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Client Selector & Context */}
      <div className="flex items-center space-x-4 flex-1 max-w-xl">
        <div className="w-full">
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
                {activeClient.is_certified ? '✓ CERTIFIED' : 'UNCERTIFIED BASELINE'}
              </span>
            )}
          </div>

          <div className="relative">
            <select
              value={activeClient?.id || ''}
              onChange={(e) => setActiveClientId(e.target.value)}
              disabled={isLoading}
              className="w-full bg-[#151D2A] border border-[#A9C7E5]/20 rounded px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-[#D99614] cursor-pointer appearance-none"
            >
              {clients.length === 0 ? (
                <option value="">No clients available</option>
              ) : (
                clients.map((client) => (
                  <option key={client.id} value={client.id} className="bg-[#151D2A] text-white">
                    {client.name} {client.is_certified ? '— Certified' : '— Setup Required'}
                  </option>
                ))
              )}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Action Controls & Beacon Launch */}
      <div className="flex items-center space-x-3">
        {onOpenBeacon && (
          <button
            onClick={onOpenBeacon}
            className="flex items-center space-x-2 bg-[#D99614]/10 border border-[#D99614]/40 text-[#D99614] hover:bg-[#D99614]/20 text-xs font-mono font-bold px-3 py-1.5 rounded transition-all"
          >
            <span className="w-2 h-2 rounded-full bg-[#D99614] animate-pulse"></span>
            <span>ASK BEACON</span>
          </button>
        )}

        <div className="h-6 w-px bg-[#A9C7E5]/10"></div>

        <div className="text-right">
          <span className="text-xs font-bold text-white block">Will Huyler</span>
          <span className="text-[10px] font-mono text-slate-400 block">Agency Principal</span>
        </div>
        <div className="w-8 h-8 rounded bg-[#151D2A] border border-[#A9C7E5]/20 text-[#55A9E6] flex items-center justify-center font-bold text-xs font-mono">
          WH
        </div>
      </div>
    </header>
  );
}
