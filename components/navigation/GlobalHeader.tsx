'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useClient, CANONICAL_CLIENTS } from '../../lib/client-context';

export default function GlobalHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeClient, setActiveClient } = useClient();

  const currentStartDate = searchParams.get('startDate') || '2026-09-01';
  const currentEndDate = searchParams.get('endDate') || '2026-09-30';

  // Handle Client Switch
  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const client = CANONICAL_CLIENTS.find((c) => c.id === selectedId);
    if (client) {
      setActiveClient(client);

      const params = new URLSearchParams(searchParams.toString());
      params.set('clientId', client.id);
      router.push(`?${params.toString()}`);
    }
  };

  // Handle Date Preset Switch
  const handleDatePresetChange = (preset: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const today = new Date('2026-10-06'); // System baseline reference

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
    }

    params.set('startDate', start);
    params.set('endDate', end);
    router.push(`?${params.toString()}`);
  };

  return (
    <header className="h-16 bg-[#111622] border-b border-[#A9C7E5]/10 px-6 flex items-center justify-between sticky top-0 z-50">
      {/* Brand & App Title */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🦉</span>
          <span className="font-bold tracking-wider text-sm font-mono text-white">PORCHLIGHT</span>
        </div>

        {/* Client Selector Dropdown */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase">CLIENT:</span>
          <select
            value={activeClient?.id || ''}
            onChange={handleClientChange}
            className="bg-[#151D2A] text-xs font-mono font-bold text-white border border-[#A9C7E5]/20 rounded px-2.5 py-1.5 focus:outline-none focus:border-[#D99614]"
          >
            {CANONICAL_CLIENTS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.is_certified ? '✓' : '(Uncertified)'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Date Range Selector & Presets */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1 bg-[#151D2A] border border-[#A9C7E5]/10 rounded p-1 text-[11px] font-mono">
          <button
            onClick={() => handleDatePresetChange('7d')}
            className="px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-all"
          >
            7D
          </button>
          <button
            onClick={() => handleDatePresetChange('30d')}
            className="px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-all"
          >
            30D
          </button>
          <button
            onClick={() => handleDatePresetChange('mtd')}
            className="px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-all"
          >
            MTD
          </button>
          <button
            onClick={() => handleDatePresetChange('qtd')}
            className="px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-all"
          >
            QTD
          </button>
        </div>

        <div className="text-xs font-mono bg-[#151D2A] border border-[#A9C7E5]/10 rounded px-3 py-1.5 text-slate-300">
          📅 <span className="text-white font-bold">{currentStartDate}</span> to{' '}
          <span className="text-white font-bold">{currentEndDate}</span>
        </div>
      </div>
    </header>
  );
}
