'use client';

import React from 'react';

export default function PlaidInsightsPanel() {
  return (
    <div className="w-80 bg-white border border-[#DCE5EF] rounded-xl p-5 space-y-4 shadow-sm">
      <div className="flex items-center space-x-2 border-b border-[#DCE5EF] pb-3">
        <span className="text-[#D99614]">✨</span>
        <h3 className="text-xs font-bold font-mono text-[#0B1F3A] uppercase tracking-wider">
          AI INSIGHTS (PLAID)
        </h3>
      </div>

      <div className="space-y-3">
        <div className="p-3 bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg text-xs space-y-1">
          <div className="flex items-center space-x-2 text-[#12A36D] font-bold">
            <span>↗</span>
            <span>Strong Upward Momentum</span>
          </div>
          <p className="text-[#53657D] text-[11px]">
            Calls and website clicks are trending +45% higher vs. baseline MTD.
          </p>
        </div>

        <div className="p-3 bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg text-xs space-y-1">
          <div className="flex items-center space-x-2 text-[#1478F2] font-bold">
            <span>📍</span>
            <span>Territory Opportunity</span>
          </div>
          <p className="text-[#53657D] text-[11px]">
            ZIP 53202 map pack ranking is approaching top-3 threshold (#4 rank).
          </p>
        </div>
      </div>

      <button className="w-full bg-[#0B1F3A] hover:bg-[#142E52] text-white font-mono text-xs py-3 rounded-lg font-bold transition-all shadow-sm">
        ✨ Get AI Recommendations
      </button>
    </div>
  );
}
