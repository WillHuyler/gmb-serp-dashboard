'use client';

import React from 'react';
import { useClient } from '../../lib/client-context';

interface KeywordRow {
  phrase: string;
  monthlyVolume: string;
  organicRank: number;
  mapPackRank: number;
  competitors: [string, string, string];
}

export default function KeywordsTable() {
  const { activeClient } = useClient();

  const keywordData: KeywordRow[] = [
    {
      phrase: 'chimney sweep near me',
      monthlyVolume: '4,400/mo',
      organicRank: 8,
      mapPackRank: 4,
      competitors: ['1. Apex Chimney Care', '2. Midwest Fireplace Co', '3. TopHat Sweeps'],
    },
    {
      phrase: 'chimney cleaning',
      monthlyVolume: '2,900/mo',
      organicRank: 4,
      mapPackRank: 1,
      competitors: ['1. Chimney Care Co', '2. Fireplace Pros', '3. Midwest Sweeps'],
    },
    {
      phrase: 'chimney inspection',
      monthlyVolume: '1,900/mo',
      organicRank: 6,
      mapPackRank: 3,
      competitors: [
        `1. ${activeClient?.name || 'High Rise (You)'}`,
        '2. Clean Sweep',
        '3. Austin Chimney Pros',
      ],
    },
  ];

  return (
    <div className="bg-white border border-[#DCE5EF] rounded-xl p-5 space-y-4 shadow-sm">
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-[#DCE5EF] pb-3">
        <div>
          <h3 className="text-xs font-bold font-mono text-[#0B1F3A] uppercase tracking-wider">
            Top High-Volume Keywords & Row-Level Competitors
          </h3>
          <p className="text-[11px] text-[#53657D] mt-0.5">
            Rankings sorted by monthly search volume and localized competitive density.
          </p>
        </div>
        <select className="bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-[#0B1F3A] focus:outline-none">
          <option>Google My Business (GMB)</option>
          <option>Google Organic Search</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#DCE5EF] text-[10px] text-slate-400 font-bold uppercase">
              <th className="py-2 px-3">KEYWORD PHRASE</th>
              <th className="py-2 px-3">MONTHLY VOL</th>
              <th className="py-2 px-3 text-center">ORGANIC RANK</th>
              <th className="py-2 px-3 text-center">MAP PACK</th>
              <th className="py-2 px-3">ROW-LEVEL COMPETITORS (#1, #2, #3)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DCE5EF]/60">
            {keywordData.map((row, idx) => (
              <tr key={idx} className="hover:bg-[#F4F7FB] transition-all">
                <td className="py-3 px-3 font-bold text-[#0B1F3A]">{row.phrase}</td>
                <td className="py-3 px-3 text-slate-500">{row.monthlyVolume}</td>
                <td className="py-3 px-3 text-center font-bold text-[#12A36D]">
                  #{row.organicRank}
                </td>
                <td className="py-3 px-3 text-center">
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-xs border ${
                      row.mapPackRank === 1
                        ? 'bg-[#D99614]/15 text-[#D99614] border-[#D99614]/40'
                        : row.mapPackRank <= 3
                        ? 'bg-[#12A36D]/15 text-[#12A36D] border-[#12A36D]/40'
                        : 'bg-slate-100 text-slate-600 border-slate-300'
                    }`}
                  >
                    #{row.mapPackRank}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <div className="flex flex-wrap gap-1.5">
                    {row.competitors.map((comp, cIdx) => (
                      <span
                        key={cIdx}
                        className={`text-[10px] px-2 py-0.5 rounded border ${
                          comp.includes('(You)') || comp.includes(activeClient?.name || '')
                            ? 'bg-[#1478F2]/10 text-[#1478F2] border-[#1478F2]/30 font-bold'
                            : 'bg-[#F4F7FB] text-[#53657D] border-[#DCE5EF]'
                        }`}
                      >
                        {comp}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
