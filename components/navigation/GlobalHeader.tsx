'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useClient } from '../../lib/client-context';

export default function GlobalHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeClient, setActiveClient, clientRegistry } = useClient();

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const client = clientRegistry.find((c) => c.id === selectedId);
    if (client) {
      // Clear localStorage/sessionStorage cache entries to eliminate residue
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`pl_insights_${activeClient?.id}`);
        sessionStorage.removeItem(`pl_telemetry_${activeClient?.id}`);
      }

      setActiveClient(client);

      // Atomic URL update with new client context
      const params = new URLSearchParams();
      params.set('clientId', client.id);
      params.set('startDate', searchParams.get('startDate') || '2026-09-01');
      params.set('endDate', searchParams.get('endDate') || '2026-09-30');
      
      router.push(`?${params.toString()}`);
    }
  };

  return (
    <header className="h-16 bg-[#111622] border-b border-[#A9C7E5]/10 px-6 flex items-center justify-between sticky top-0 z-50 font-mono text-xs text-white">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 bg-[#D99614]/20 border border-[#D99614] rounded flex items-center justify-center font-bold text-[#D99614]">
            PL
          </div>
          <span className="font-bold tracking-wider text-sm">PORCHLIGHT</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-400 uppercase text-[10px]">CLIENT:</span>
          <select
            value={activeClient?.id || ''}
            onChange={handleClientChange}
            className="bg-[#151D2A] text-white font-bold border border-[#A9C7E5]/20 rounded px-3 py-1.5 focus:outline-none focus:border-[#D99614]"
          >
            {clientRegistry.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.is_certified ? '✓' : '(Uncertified)'}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center space-x-3 text-slate-300">
        <span>📍 Service Area: <strong className="text-white">{activeClient?.service_areas.join(', ') || 'None'}</strong></span>
      </div>
    </header>
  );
}
