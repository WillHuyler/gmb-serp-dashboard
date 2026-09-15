'use client';

import React from 'react';

export default function VisibilityChart() {
  return (
    <div className="bg-white border border-[#DCE5EF] rounded-xl p-5 space-y-4 shadow-sm">
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-[#DCE5EF] pb-3">
        <div>
          <h3 className="text-xs font-bold font-mono text-[#0B1F3A] uppercase tracking-wider">
            Local Visibility Trend
          </h3>
          <p className="text-[11px] text-[#53657D] mt-0.5">
            Map pack presence and ranking trajectory over time.
          </p>
        </div>
        <select className="bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-[#0B1F3A] focus:outline-none">
          <option>Last 90 Days</option>
          <option>Last 30 Days</option>
          <option>Year to Date</option>
        </select>
      </div>

      {/* CHART CONTAINER */}
      <div className="relative h-48 w-full font-mono text-[10px]">
        {/* Y-AXIS GRID LINES & LABELS */}
        <div className="absolute inset-0 flex flex-col justify-between text-slate-400 pointer-events-none">
          <div className="border-b border-[#DCE5EF]/60 pb-0.5">#1</div>
          <div className="border-b border-[#DCE5EF]/60 pb-0.5">#5</div>
          <div className="border-b border-[#DCE5EF]/60 pb-0.5">#10</div>
          <div className="border-b border-[#DCE5EF]/60 pb-0.5">#15</div>
          <div>#20</div>
        </div>

        {/* SVG TREND LINES */}
        <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 500 150">
          {/* ZIP 53202 (Blue Line) */}
          <path
            d="M 10 110 Q 120 80, 250 40 T 490 20"
            fill="none"
            stroke="#1478F2"
            strokeWidth="2.5"
          />
          {/* ZIP 53211 (Green Line) */}
          <path
            d="M 10 120 Q 130 90, 260 50 T 490 30"
            fill="none"
            stroke="#12A36D"
            strokeWidth="2.5"
          />
          {/* ZIP 53217 (Purple Line) */}
          <path
            d="M 10 130 Q 140 100, 270 70 T 490 45"
            fill="none"
            stroke="#7257E8"
            strokeWidth="2.5"
          />
        </svg>
      </div>

      {/* CHART LEGEND */}
      <div className="flex justify-center items-center space-x-6 pt-2 font-mono text-[11px] border-t border-[#DCE5EF]">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1478F2]" />
          <span className="font-bold text-[#0B1F3A]">ZIP 53202</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#12A36D]" />
          <span className="font-bold text-[#0B1F3A]">ZIP 53211</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#7257E8]" />
          <span className="font-bold text-[#0B1F3A]">ZIP 53217</span>
        </div>
      </div>
    </div>
  );
}
