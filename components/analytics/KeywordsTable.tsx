'use client';

import React from 'react';
import { useClient } from '../../lib/client-context';

export default function KeywordsTable() {
  const { activeClient } = useClient();

  const clientKeywords: Record<
    string,
    Array<{ keyword: string; volume: string; rank: string; competitor: string }>
  > = {
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890': [ // ABC Motors
      { keyword: 'used cars near me', volume: '12,400', rank: '#2', competitor: 'Metro Auto Mall' },
      { keyword: 'car dealership milwaukee', volume: '8,100', rank: '#3', competitor: 'Northside Ford' },
      { keyword: 'auto repair service zip 53202', volume: '3,200', rank: '#1', competitor: 'FastLane Auto' },
    ],
    'bf93fef0-fc60-4119-8ea2-68a274984355': [ // High Rise Chimney
      { keyword: 'chimney sweep near me', volume: '4,400', rank: '#1', competitor: 'Pocono Chimney Co' },
      { keyword: 'fireplace repair stroudsburg', volume: '1,800', rank: '#1', competitor: 'Keystone Hearth' },
    ],
  };

  const keywords = activeClient?.id ? clientKeywords[activeClient.id] || [] : [];

  return (
    <div className="bg-white border border-[#DCE5EF] rounded-xl p-5 space-y-4 shadow-sm">
      <div className="flex justify-between items-center border-b border-[#DCE5EF] pb-3">
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
            TOP HIGH-VOLUME KEYWORDS & ROW-LEVEL COMPETITORS
          </span>
          <h3 className="text-xs font-bold text-[#0B1F3A]">
            Rankings sorted by monthly search volume and localized competitive density for {activeClient?.name}
          </h3>
        </div>
      </div>

      {keywords.length === 0 ? (
        <div className="p-6 text-center text-xs font-mono text-[#53657D] bg-[#F4F7FB] rounded-lg border border-[#DCE5EF]">
          NO KEYWORD METRICS MAPPED FOR {activeClient?.name?.toUpperCase() || 'SELECTED CLIENT'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#DCE5EF] text-slate-400 text-[10px] uppercase">
                <th className="pb-2">KEYWORD</th>
                <th className="pb-2">SEARCH VOLUME</th>
                <th className="pb-2">RANK</th>
                <th className="pb-2">TOP COMPETITOR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE5EF]">
              {keywords.map((kw, idx) => (
                <tr key={idx} className="hover:bg-[#F4F7FB]">
                  <td className="py-2.5 font-bold text-[#0B1F3A]">{kw.keyword}</td>
                  <td className="py-2.5 text-[#53657D]">{kw.volume}</td>
                  <td className="py-2.5 text-[#12A36D] font-bold">{kw.rank}</td>
                  <td className="py-2.5 text-[#53657D]">{kw.competitor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
