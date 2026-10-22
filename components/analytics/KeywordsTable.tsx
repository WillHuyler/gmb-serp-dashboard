'use client';

import React from 'react';
import { useClient } from '../../lib/client-context';

interface KeywordRow {
  id: string;
  keyword: string;
  google_rank: number | null;
  maps_rank: number | null;
  search_volume: number | null;
  last_updated: string | null;
  competitor_1?: string | null;
  competitor_2?: string | null;
  competitor_3?: string | null;
}

interface KeywordsTableProps {
  keywords?: KeywordRow[];
  provenance?: {
    certificationState: string;
    isCertified: boolean;
    hasHistoricalData: boolean;
    latestMetricDate: string | null;
  };
  loading?: boolean;
}

export default function KeywordsTable({
  keywords = [],
  provenance,
  loading = false,
}: KeywordsTableProps) {
  const { activeClient } = useClient();
  const isCertified = Boolean(provenance?.isCertified);

  return (
    <div className="bg-white border border-[#DCE5EF] rounded-xl p-5 space-y-4 shadow-sm">
      <div className="flex justify-between items-center border-b border-[#DCE5EF] pb-3">
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
            SEARCH QUERIES & ROW-LEVEL COMPETITORS (
            {isCertified ? 'CERTIFIED LIVE' : `HISTORICALSNAPSHOT: ${provenance?.latestMetricDate || 'UNVERIFIED'}`})
          </span>
          <h3 className="text-xs font-bold text-[#0B1F3A]">
            {activeClient?.name || 'Selected Client'}
          </h3>
        </div>
        <span className="text-[10px] font-mono text-[#53657D]">
          {keywords.length} Tracked Queries
        </span>
      </div>

      {loading ? (
        <div className="p-6 text-center text-xs font-mono text-[#53657D] animate-pulse">
          Querying client-scoped keyword records...
        </div>
      ) : keywords.length === 0 ? (
        <div className="p-6 text-center text-xs font-mono text-[#53657D] bg-[#F4F7FB] rounded-lg border border-[#DCE5EF]">
          NO KEYWORD RANKING RECORDS FOR {activeClient?.name?.toUpperCase() || 'SELECTED CLIENT'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#DCE5EF] text-slate-400 text-[10px] uppercase">
                <th className="pb-2">KEYWORD</th>
                <th className="pb-2">VOLUME</th>
                <th className="pb-2">MAPS RANK</th>
                <th className="pb-2">ORGANIC RANK</th>
                <th className="pb-2">OBSERVED COMPETITORS</th>
                <th className="pb-2">SNAPSHOT DATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE5EF]">
              {keywords.map((kw) => {
                const competitors = [kw.competitor_1, kw.competitor_2, kw.competitor_3].filter(
                  Boolean
                );
                return (
                  <tr key={kw.id} className="hover:bg-[#F4F7FB]">
                    <td className="py-2.5 font-bold text-[#0B1F3A]">{kw.keyword}</td>
                    <td className="py-2.5 text-[#53657D]">
                      {kw.search_volume !== null && kw.search_volume !== undefined
                        ? `${Number(kw.search_volume).toLocaleString()}/mo`
                        : '—'}
                    </td>
                    <td className="py-2.5 text-[#12A36D] font-bold">
                      {kw.maps_rank !== null && kw.maps_rank !== undefined
                        ? `#${kw.maps_rank}`
                        : '—'}
                    </td>
                    <td className="py-2.5 text-[#0B1F3A] font-bold">
                      {kw.google_rank !== null && kw.google_rank !== undefined
                        ? `#${kw.google_rank}`
                        : '—'}
                    </td>
                    <td className="py-2.5 text-[#53657D]">
                      <div className="flex flex-wrap gap-1">
                        {competitors.map((comp, i) => (
                          <span
                            key={i}
                            className="bg-[#F4F7FB] border border-[#DCE5EF] px-2 py-0.5 rounded text-[10px] text-[#0B1F3A]"
                          >
                            {comp}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 text-slate-400">{kw.last_updated || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
