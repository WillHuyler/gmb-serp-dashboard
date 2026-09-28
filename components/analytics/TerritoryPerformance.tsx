'use client';

import React from 'react';
import { useClient } from '../../lib/client-context';

export default function TerritoryPerformance() {
  const { activeClient } = useClient();

  const clientTerritories: Record<string, Array<{ zip: string; rank: string; change: string }>> = {
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890': [ // ABC Motors
      { zip: '53202', rank: '#3', change: '+2' },
      { zip: '53211', rank: '#2', change: '+1' },
      { zip: '53217', rank: '#3', change: '+3' },
      { zip: '53092', rank: '#2', change: '-1' },
      { zip: '53097', rank: '#2', change: '+1' },
    ],
    'bf93fef0-fc60-4119-8ea2-68a274984355': [ // High Rise Chimney Sweep
      { zip: '18301', rank: '#1', change: '+1' },
      { zip: '18302', rank: '#1', change: '0' },
      { zip: '18360', rank: '#2', change: '+2' },
    ],
  };

  const territoryData = activeClient?.id ? clientTerritories[activeClient.id] || [] : [];

  return (
    <div className="bg-white border border-[#DCE5EF] rounded-xl p-5 space-y-4 shadow-sm">
      <div className="flex justify-between items-center border-b border-[#DCE5EF] pb-3">
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
            SERVICE TERRITORY PERFORMANCE
          </span>
          <h3 className="text-xs font-bold text-[#0B1F3A]">
            Map pack rank positions across GMB profile service area ZIP codes
          </h3>
        </div>
        <span className="text-xs font-mono font-bold text-[#0B1F3A] bg-[#F4F7FB] px-2.5 py-1 rounded border border-[#DCE5EF]">
          {territoryData.length > 0 ? `All ${territoryData.length} ZIPs` : 'NO DATA'}
        </span>
      </div>

      {territoryData.length === 0 ? (
        <div className="p-6 text-center text-xs font-mono text-[#53657D] bg-[#F4F7FB] rounded-lg border border-[#DCE5EF]">
          NO TERRITORY DATA MAPPED FOR {activeClient?.name?.toUpperCase() || 'SELECTED CLIENT'}
        </div>
      ) : (
        <div className="space-y-2">
          {territoryData.map((item) => (
            <div
              key={item.zip}
              className="flex justify-between items-center p-2.5 bg-[#F4F7FB] rounded-lg border border-[#DCE5EF] text-xs font-mono"
            >
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#12A36D]" />
                <span className="font-bold text-[#0B1F3A]">{item.zip}</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="font-bold text-[#12A36D] bg-[#12A36D]/10 px-2 py-0.5 rounded border border-[#12A36D]/30">
                  {item.rank}
                </span>
                <span className={item.change.startsWith('+') ? 'text-[#12A36D]' : 'text-[#E64B4B]'}>
                  {item.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
