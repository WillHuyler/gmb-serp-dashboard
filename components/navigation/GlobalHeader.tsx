'use client';

import React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useClient } from '../../lib/client-context';

export default function GlobalHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { activeClient, clients, setActiveClientId } = useClient();

  const handleDatePresetChange = (preset: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    const today = new Date();
    let startDate = '';
    let endDate = today.toISOString().split('T')[0];

    if (preset === '7D') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      startDate = d.toISOString().split('T')[0];
    } else if (preset === '30D') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      startDate = d.toISOString().split('T')[0];
    } else if (preset === 'MTD') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    } else if (preset === 'QTD') {
      const quarterMonth = Math.floor(today.getMonth() / 3) * 3;
      startDate = new Date(today.getFullYear(), quarterMonth, 1).toISOString().split('T')[0];
    }

    params.set('startDate', startDate);
    params.set('endDate', endDate);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleClientChange = (clientId: string) => {
    setActiveClientId(clientId);
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('clientId', clientId);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <header className="h-16 bg-white border-b border-[#DCE5EF] px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center space-x-4 flex-1 max-w-2xl">
        <div className="relative w-64">
          <select
            value={activeClient?.id || ''}
            onChange={(e) => handleClientChange(e.target.value)}
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
            placeholder="Search locations or keywords... (Ctrl K)"
            className="w-full bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg pl-9 pr-4 py-2 text-xs text-[#0B1F3A] focus:outline-none focus:border-[#D99614]"
          />
          <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1 bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg p-1">
          {['7D', '30D', 'MTD', 'QTD'].map((preset) => (
            <button
              key={preset}
              onClick={() => handleDatePresetChange(preset)}
              className="px-2.5 py-1 text-[10px] font-mono font-bold text-[#0B1F3A] hover:bg-white rounded transition-all"
            >
              {preset}
            </button>
          ))}
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
