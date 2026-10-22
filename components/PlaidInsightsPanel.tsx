'use client';

import React, { useEffect, useState } from 'react';
import { useClient } from '../lib/client-context';

interface AiRecommendation {
  id: string;
  client_id: string;
  platform: string;
  priority: string;
  finding_title: string;
  prescribed_action: string;
  expected_impact: string;
  created_at: string;
}

export function PlaidInsightsPanel() {
  const { activeClient } = useClient();
  const [recommendations, setRecommendations] = useState<AiRecommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!activeClient?.id || !activeClient.is_certified) {
      setRecommendations([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch(`/api/telemetry/client-data?clientId=${encodeURIComponent(activeClient.id)}`, {
      cache: 'no-store',
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setRecommendations(Array.isArray(data.aiRecommendations) ? data.aiRecommendations : []);
        }
      })
      .catch(() => {
        if (!cancelled) setRecommendations([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeClient?.id, activeClient?.is_certified]);

  if (!activeClient) {
    return (
      <div className="p-4 rounded-lg bg-[#111622] border border-[#A9C7E5]/10 text-slate-400 text-xs font-mono">
        NO CLIENT SELECTED — SELECT AN ACTIVE CLIENT TO VIEW SIGNALS
      </div>
    );
  }

  // Fail-Closed Security Gate: Never render recommendations for uncertified clients
  if (!activeClient.is_certified) {
    return (
      <div className="bg-[#111622] border border-amber-500/20 rounded-xl p-6 text-center space-y-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
          AI SIGNAL ISOLATION • FAIL-CLOSED GATE
        </span>
        <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
          NO CERTIFIED SIGNALS RECORDED
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto font-mono">
          Active client (<strong className="text-white">{activeClient.name}</strong>) has no certified integration baseline. AI signal synthesis is suspended to prevent cross-tenant telemetry contamination.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-4">
      <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-3">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D99614] font-bold block">
            ✨ PLAID AI INTELLIGENCE LEDGER
          </span>
          <h2 className="text-sm font-bold text-white uppercase font-mono">
            CERTIFIED INSIGHT VECTORS • {activeClient.name}
          </h2>
        </div>
        <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
          SUPABASE VERIFIED
        </span>
      </div>

      {loading ? (
        <div className="p-4 text-xs font-mono text-slate-400 animate-pulse">
          Loading client-scoped AI recommendations...
        </div>
      ) : recommendations.length === 0 ? (
        <div className="p-4 text-xs font-mono text-slate-400 bg-[#0B0F17] rounded-lg border border-[#A9C7E5]/10">
          No active AI recommendations recorded for {activeClient.name}.
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-3.5 bg-[#151D2A] border border-[#A9C7E5]/10 rounded-lg space-y-1.5"
            >
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-[#55A9E6] font-bold uppercase text-[10px]">
                  {rec.platform}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    rec.priority === 'HIGH'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}
                >
                  {rec.priority} PRIORITY
                </span>
              </div>
              <h4 className="text-xs font-bold text-white">{rec.finding_title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{rec.prescribed_action}</p>
              <div className="pt-1 text-[11px] font-mono text-emerald-400">
                ↗ Expected Impact: {rec.expected_impact}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PlaidInsightsPanel;
