'use client';

import React from 'react';
import { useClient } from '../../lib/client-context';

interface ZipPerformance {
  zip: string;
  rank: number;
  change: number;
}

export default function TerritoryPerformance() {
  const { activeClient } = useClient();

  const zipData: ZipPerformance[] = [
    { zip: '53202', rank: 3, change: 2 },
    { zip: '53211', rank: 2, change: 1 },
    { zip: '53217', rank: 3, change: 3 },
    { zip: '53092', rank: 2, change: 1 },
    { zip: '53097', rank: 2, change: 1 },
  ];

  return (
    <div className="bg-white border border-[#DCE5EF] rounded-xl p-5 space-y-4 shadow-sm">
      {/* CARD HEADER */}
      <div className="flex justify-between items-center border-b border-[#DCE5EF] pb-3">
        <div>
          <h3 className="text-xs font-bold font-mono text-[#0B1F3A] uppercase tracking-wider">
            Service Territory Performance
          </h3>
          <p className="text-[11px] text-[#53657D] mt-0.5">
            Map pack rank positions across GMB profile service area ZIP codes.
          </p>
        </div>
        <select className="bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-[#0B1F3A] focus:outline-none">
          <option>All GBP ZIPs</option>
          <option>Primary ZIPs Only</option>
        </select>
      </div>

      {/* SPLIT LAYOUT: MAP / GRID CONTAINER + COMPACT RANKING TABLE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* LEFT: MAP / GEOGRAPHIC VISUALIZATION CONTAINER */}
        <div className="relative h-56 bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg overflow-hidden flex flex-col justify-between p-3">
          {/* MAP BACKGROUND DECORATION */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#1478F2_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* VISUAL RANK MARKERS OVERLAY */}
          <div className="relative z-10 flex flex-wrap gap-2 justify-center items-center h-full">
            {zipData.map((item) => (
              <div
                key={item.zip}
                className="flex items-center space-x-1.5 bg-white/90 backdrop-blur-sm border border-[#DCE5EF] px-2.5 py-1.5 rounded-full shadow-sm"
              >
                <span className="w-5 h-5 rounded-full bg-[#12A36D] text-white font-bold font-mono text-[10px] flex items-center justify-center">
                  #{item.rank}
                </span>
                <span className="text-[11px] font-mono font-bold text-[#0B1F3A]">
                  {item.zip}
                </span>
              </div>
            ))}
          </div>

          <div className="relative z-10 flex justify-between items-center text-[10px] font-mono text-slate-400 border-t border-[#DCE5EF]/60 pt-2 bg-white/60 px-2 rounded">
            <span>SERVICE AREA: METRO REGION</span>
            <span className="text-[#12A36D] font-bold">100% TOP-3 DOMINANCE</span>
          </div>
        </div>

        {/* RIGHT: COMPACT RANKING TABLE */}
        <div className="space-y-1.5 font-mono text-xs">
          <div className="grid grid-cols-3 text-[10px] text-slate-400 font-bold uppercase pb-1 border-b border-[#DCE5EF]">
            <span>ZIP CODE</span>
            <span className="text-center">MAP PACK RANK</span>
            <span className="text-right">CHANGE</span>
          </div>

          {zipData.map((item) => (
            <div
              key={item.zip}
              className="grid grid-cols-3 items-center py-2 px-2 rounded-lg hover:bg-[#F4F7FB] transition-all border-b border-[#DCE5EF]/40 last:border-none"
            >
              <span className="font-bold text-[#0B1F3A]">{item.zip}</span>
              <div className="flex justify-center">
                <span className="bg-[#12A36D]/15 text-[#12A36D] font-bold px-2 py-0.5 rounded text-xs border border-[#12A36D]/30">
                  #{item.rank}
                </span>
              </div>
              <span className="text-right font-bold text-[#12A36D]">
                ↑ +{item.change}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
