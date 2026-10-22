'use client';

import React, { useEffect, useState } from 'react';
import { useClient } from '../../lib/client-context';

interface KeywordRow {
  id: string;
  keyword: string;
  google_rank: number;
  maps_rank: number;
  search_volume: number;
  last_updated: string;
  competitor_1?: string | null;
  competitor_2?: string | null;
  competitor_3?: string | null;
}

export default function KeywordsTable() {
  const { activeClient } = useClient();
  const [keywords, setKeywords] = useState<KeywordRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!activeClient?.id || !activeClient.is_certified) {
      setKeywords([]);
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
          setKeywords(Array.isArray(data.keywords) ? data.keywords : []);
        }
      })
      .catch(() => {
        if (!cancelled) setKeywords([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeClient?.id, activeClient?.is_certified]);

  return (
    <div className="bg-white border border-[#DCE5EF] rounded-xl p-5 space-y-4 shadow-sm">
      <div className="flex justify-between items-center border-b border-[#DCE5EF] pb-3">
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
            TOP HIGH-VOLUME KEYWORDS & ROW-LEVEL COMPETITORS
          </span>
          <h3 className="text-xs font-bold text-[#0B1F3A]">
            Live rankings sorted by monthly search volume for {activeClient?.name || 'Selected Client'}
          </h3>
        </div>
        <span className="text-[10px] font-mono text-[#53657D]">
          {keywords.length} Tracked Queries
        </span>
      </div>

      {loading ? (
        <div className="p-6 text-center text-xs font-mono text-[#53657D] animate-pulse">
          Querying certified keyword rankings...
        </div>
      ) : !activeClient?.is_certified || keywords.length === 0 ? (
        <div className="p-6 text-center text-xs font-mono text-[#53657D] bg-[#F4F7FB] rounded-lg border border-[#DCE5EF]">
          NO CERTIFIED KEYWORD METRICS MAPPED FOR {activeClient?.name?.toUpperCase() || 'SELECTED CLIENT'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#DCE5EF] text-slate-400 text-[10px] uppercase">
                <th className="pb-2">KEYWORD</th>
                <th className="pb-2">SEARCH VOLUME</th>
                <th className="pb-2">MAPS RANK</th>
                <th className="pb-2">ORGANIC RANK</th>
                <th className="pb-2">TOP COMPETITORS</th>
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
                      {Number(kw.search_volume || 0).toLocaleString()}/mo
                    </td>
                    <td className="py-2.5 text-[#12A36D] font-bold">#{kw.maps_rank}</td>
                    <td className="py-2.5 text-[#0B1F3A] font-bold">#{kw.google_rank}</td>
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
