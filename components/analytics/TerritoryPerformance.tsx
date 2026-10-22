'use client';

import React, { useEffect, useState } from 'react';
import { useClient } from '../../lib/client-context';

interface ZipRankingRow {
  id: string;
  zip_code: string;
  keyword: string;
  maps_rank: number;
  city_name?: string | null;
}

export default function TerritoryPerformance() {
  const { activeClient } = useClient();
  const [zips, setZips] = useState<ZipRankingRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!activeClient?.id || !activeClient.is_certified) {
      setZips([]);
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
          setZips(Array.isArray(data.zips) ? data.zips : []);
        }
      })
      .catch(() => {
        if (!cancelled) setZips([]);
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
            📍 SERVICE TERRITORY ZIP RANKINGS
          </span>
          <h3 className="text-xs font-bold text-[#0B1F3A]">
            Verified Postal Code Map Pack Positions • {activeClient?.name || 'Active Client'}
          </h3>
        </div>
        <span className="text-[10px] font-mono text-[#53657D]">
          {zips.length} Active ZIP Nodes
        </span>
      </div>

      {loading ? (
        <div className="p-6 text-center text-xs font-mono text-[#53657D] animate-pulse">
          Loading territory ZIP telemetry...
        </div>
      ) : !activeClient?.is_certified || zips.length === 0 ? (
        <div className="p-6 text-center text-xs font-mono text-[#53657D] bg-[#F4F7FB] rounded-lg border border-[#DCE5EF]">
          NO CERTIFIED TERRITORY ZIP TELEMETRY FOR {activeClient?.name?.toUpperCase() || 'SELECTED CLIENT'}
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
                <span
                  className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                    z.maps_rank <= 3
                      ? 'bg-emerald-500/10 text-[#12A36D] border border-emerald-500/20'
                      : 'bg-amber-500/10 text-[#D99614] border border-amber-500/20'
                  }`}
                >
                  Rank #{z.maps_rank}
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#53657D] mt-2 truncate">
                {z.keyword || 'Primary Service Area'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
