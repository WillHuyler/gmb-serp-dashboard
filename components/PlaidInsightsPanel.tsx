''use client';

import React from 'react';
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

interface PlaidInsightsPanelProps {
  recommendations?: AiRecommendation[];
  provenance?: {
    certificationState: string;
    isCertified: boolean;
    hasHistoricalData: boolean;
    latestMetricDate: string | null;
  };
  loading?: boolean;
}

export function PlaidInsightsPanel({
  recommendations = [],
  provenance,
  loading = false,
}: PlaidInsightsPanelProps) {
  const { activeClient } = useClient();

  if (!activeClient) {
    return (
      <div className="p-4 rounded-lg bg-[#111622] border border-[#A9C7E5]/10 text-slate-400 text-xs font-mono">
        NO CLIENT SELECTED — SELECT AN ACTIVE CLIENT TO VIEW SIGNALS
      </div>
    );
  }

  const isCertified = Boolean(provenance?.isCertified);
  const hasHistorical = Boolean(provenance?.hasHistoricalData && recommendations.length > 0);

  if (loading) {
    return (
      <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-6 text-xs font-mono text-slate-400 animate-pulse">
        Verifying client-scoped intelligence signals...
      </div>
    );
  }

  if (!isCertified && !hasHistorical) {
    return (
      <div className="bg-[#111622] border border-amber-500/20 rounded-xl p-6 text-center space-y-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
          AI SIGNAL ISOLATION • FAIL-CLOSED GATE
        </span>
        <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
          NO CERTIFIED SIGNALS RECORDED
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Active client (<strong className="text-white">{activeClient.name}</strong>) has no certified integration baseline.
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
            {activeClient.name}
          </h2>
        </div>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
            isCertified
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
          }`}
        >
          {isCertified ? 'CERTIFIED LIVE' : 'HISTORICAL ARCHIVE'}
        </span>
      </div>

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
              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {rec.priority} PRIORITY
              </span>
            </div>
            <h4 className="text-xs font-bold text-white">{rec.finding_title}</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{rec.prescribed_action}</p>
            <div className="pt-1 flex justify-between items-center text-[10px] font-mono text-slate-400">
              <span className="text-emerald-400">↗ {rec.expected_impact}</span>
              <span>Recorded: {rec.created_at?.slice(0, 10) || '—'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PlaidInsightsPanel;
