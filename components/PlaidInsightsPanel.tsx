'use client';

import React, { useEffect, useState } from 'react';
import { useClient } from '../lib/client-context';

interface Signal {
  id: string;
  type: string;
  title: string;
  description: string;
  created_at: string;
}

export function PlaidInsightsPanel() {
  const { activeClient } = useClient();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!activeClient || !activeClient.is_certified) {
      setSignals([]);
      return;
    }

    async function fetchClientSignals() {
      try {
        setLoading(true);
        const res = await fetch(`/api/ai/recommendations?clientId=${activeClient.id}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.recommendations)) {
          setSignals(data.recommendations);
        } else {
          setSignals([]);
        }
      } catch (err) {
        console.error('Failed to fetch client signals:', err);
        setSignals([]);
      } finally {
        setLoading(false);
      }
    }

    fetchClientSignals();
  }, [activeClient]);

  if (!activeClient) {
    return (
      <div className="p-4 rounded-xl bg-[#111622] border border-[#A9C7E5]/10 text-slate-400 text-xs font-mono">
        NO CLIENT SELECTED — SELECT AN ACTIVE CLIENT TO VIEW SIGNALS
      </div>
    );
  }

  // Fail-Closed Gate: Do not render fallback/synthetic signals for uncertified clients
  if (!activeClient.is_certified) {
    return (
      <div className="p-8 rounded-xl bg-[#111622] border border-[#A9C7E5]/10 text-center space-y-2">
        <span className="text-amber-400 text-[10px] font-mono tracking-widest uppercase block font-bold">
          Data Integrity Gate
        </span>
        <h4 className="text-white font-bold text-sm">NO CERTIFIED SIGNALS RECORDED</h4>
        <p className="text-slate-400 text-xs max-w-md mx-auto">
          <strong className="text-white">{activeClient.name}</strong> is operating on an uncertified baseline. Connect provider accounts in Connection Center to generate certified AI intelligence.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl bg-[#111622] border border-[#A9C7E5]/10 space-y-4">
      <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-3">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D99614] font-bold block">
            AI INTELLIGENCE LEDGER
          </span>
          <h3 className="text-sm font-bold text-white mt-0.5">{activeClient.name}</h3>
        </div>
        <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
          CERTIFIED
        </span>
      </div>

      {loading ? (
        <div className="text-xs text-slate-400 font-mono py-4 text-center">Querying signal ledger...</div>
      ) : signals.length > 0 ? (
        <div className="space-y-3">
          {signals.map((signal) => (
            <div key={signal.id} className="p-3 bg-[#151D2A] border border-[#A9C7E5]/10 rounded-lg space-y-1">
              <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                {signal.type}
              </span>
              <h4 className="text-xs font-bold text-white">{signal.title}</h4>
              <p className="text-xs text-slate-300">{signal.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-slate-400 font-mono py-4 text-center">
          No active signals or optimization opportunities recorded for this period.
        </div>
      )}
    </div>
  );
}
