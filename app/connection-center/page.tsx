'use client';

import React, { useEffect, useState } from 'react';
import { useClient } from '../../lib/client-context';

interface ExternalAccount {
  id: string;
  provider: string;
  external_account_id: string;
  descriptive_name: string;
  account_type: string;
  status: string;
  currency: string;
  timezone: string;
  discovered_at: string;
}

export default function ConnectionCenterPage() {
  const { activeClient } = useClient();
  const [accounts, setAccounts] = useState<ExternalAccount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mappingId, setMappingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInventory() {
      try {
        const res = await fetch('/api/data/inventory');
        const data = await res.json();
        if (data.success) {
          setAccounts(data.accounts);
        }
      } catch (err) {
        console.error('Failed to load inventory:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchInventory();
  }, []);

  const handleMapAccount = async (account: ExternalAccount) => {
    if (!activeClient) {
      alert('Please select an active client from the top header first.');
      return;
    }

    setMappingId(account.id);
    try {
      const res = await fetch('/api/data/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: activeClient.id,
          external_account_id: account.external_account_id,
          provider: account.provider,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`Successfully mapped ${account.descriptive_name} to ${activeClient.name}! Client status updated to Certified.`);
        window.location.reload();
      } else {
        alert(`Mapping failed: ${data.error}`);
      }
    } catch (err) {
      console.error('Error mapping account:', err);
      alert('An error occurred while linking the account.');
    } finally {
      setMappingId(null);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-[#0B0F17] text-white min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold tracking-tight">CONNECTION CENTER</h1>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
              PHASE 2 / 3 INVENTORY
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Provider Resource Ingestion & Multi-Tenant Account Mapping Matrix
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button className="bg-[#55A9E6]/10 border border-[#55A9E6]/30 text-[#55A9E6] text-xs font-mono font-bold px-4 py-2 rounded hover:bg-[#55A9E6]/20 transition-all">
            + CONNECT GOOGLE ADS
          </button>
          <button className="bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-mono font-bold px-4 py-2 rounded hover:bg-blue-600/30 transition-all">
            + CONNECT META ADS
          </button>
        </div>
      </div>

      <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-mono uppercase text-slate-400 tracking-wider">
            DISCOVERED EXTERNAL ACCOUNTS INVENTORY
          </h2>
          <span className="text-xs font-mono text-slate-400">
            TARGET CLIENT: <strong className="text-amber-400">{activeClient?.name || 'SELECT A CLIENT ABOVE'}</strong>
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs font-mono text-slate-500 animate-pulse">
            Querying provider API tokens and scanning active accounts...
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-[#A9C7E5]/20 rounded-lg text-xs font-mono text-slate-500">
            No external provider accounts discovered. Execute the SQL seed script in Supabase or connect a provider above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#A9C7E5]/10 text-[11px] font-mono text-slate-400 uppercase">
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Account Name</th>
                  <th className="py-3 px-4">External ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#A9C7E5]/10 text-xs">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-[#0B0F17]/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#55A9E6]">
                      {acc.provider}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-white">
                      {acc.descriptive_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {acc.external_account_id}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 uppercase">
                      {acc.account_type}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {acc.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleMapAccount(acc)}
                        disabled={mappingId === acc.id}
                        className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-mono font-bold px-3 py-1 rounded hover:bg-amber-500/20 transition-all disabled:opacity-50"
                      >
                        {mappingId === acc.id ? 'MAPPING...' : `MAP TO ${activeClient?.name ? activeClient.name.toUpperCase() : 'CLIENT'}`}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
