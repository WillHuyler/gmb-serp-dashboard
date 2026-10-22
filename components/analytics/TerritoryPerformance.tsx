'use client';

import React from 'react';
import { useClient } from '../../lib/client-context';

interface ZipRankingRow {
  id: string;
  zip_code: string;
  keyword: string;
  maps_rank: number | null;
  created_at?: string | null;
}

interface TerritoryPerformanceProps {
  zips?: ZipRankingRow[];
  provenance?: {
    certificationState: string;
    isCertified: boolean;
    hasHistoricalData: boolean;
    latestMetricDate: string | null;
  };
  loading?: boolean;
}

export default function TerritoryPerformance({
  zips = [],
  provenance,
  loading = false,
}: TerritoryPerformanceProps) {
  const { activeClient } = useClient();
  const isCertified = Boolean(provenance?.isCertified);

  return (
    <div className="bg-white border border-[#DCE5EF] rounded-xl p-5 space-y-4 shadow-sm">
      <div className="flex justify-between items-center border-b border-[#DCE5EF] pb-3">
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
            📍 SERVICE TERRITORY ZIP RANKINGS (
            {isCertified ? 'CERTIFIED LIVE' : 'HISTORICAL SNAPSHOT'})
          </span>
          <h3 className="text-xs font-bold text-[#0B1F3A]">
            Postal Code Map Pack Positions • {activeClient?.name || 'Active Client'}
          </h3>
        </div>
        <span className="text-[10px] font-mono text-[#53657D]">
          {zips.length} Postal Code Nodes
        </span>
      </div>

      {loading ? (
        <div className="p-6 text-center text-xs font-mono text-[#53657D] animate-pulse">
          Loading territory ZIP records...
        </div>
      ) : zips.length === 0 ? (
        <div className="p-6 text-center text-xs font-mono text-[#53657D] bg-[#F4F7FB] rounded-lg border border-[#DCE5EF]">
          NO TERRITORY ZIP RECORDS FOR {activeClient?.name?.toUpperCase() || 'SELECTED CLIENT'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {zips.map((z) => (
            <div
              key={z.id}
              className="p-3.5 rounded-lg bg-[#F4F7FB] border border-[#DCE5EF] flex flex-col justify-between"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-[#0B1F3A]">
                  ZIP {z.zip_code}
                </span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-[#D99614] border border-amber-500/20">
                  {z.maps_rank !== null && z.maps_rank !== undefined
                    ? `Rank #${z.maps_rank}`
                    : '—'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#53657D] mt-2 truncate">
                {z.keyword || 'Service Area'} ({z.created_at?.slice(0, 10) || 'Historical'})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
