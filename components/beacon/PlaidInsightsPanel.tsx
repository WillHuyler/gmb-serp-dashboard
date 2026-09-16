'use client';

import React from 'react';

export default function PlaidInsightsPanel() {
  return (
    <div className="space-y-4">
      {/* BRAND HERO PROMO CARD FROM REFERENCE */}
      <div className="bg-gradient-to-br from-[#0B1F3A] to-[#142E52] rounded-xl p-5 text-white space-y-3 shadow-sm border border-[#142E52]">
        <h4 className="text-base font-bold leading-tight">
          More Visibility. <br />
          More Calls. <br />
          More Business.
        </h4>
        <p className="text-[10px] font-mono text-amber-400 uppercase tracking-widest">
          LOCAL INTELLIGENCE. REAL RESULTS.
        </p>
      </div>

      {/* PLAID AI INSIGHTS MODULE */}
      <div className="bg-white border border-[#DCE5EF] rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center space-x-2 border-b border-[#DCE5EF] pb-3">
          <span className="text-[#D99614] text-base">✨</span>
          <h3 className="text-xs font-bold font-mono text-[#0B1F3A] uppercase tracking-wider">
            AI INSIGHTS (PLAID)
          </h3>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg text-xs space-y-1">
            <div className="flex items-center space-x-2 text-[#12A36D] font-bold">
              <span>↗</span>
              <span>Strong upward momentum</span>
            </div>
            <p className="text-[#53657D] text-[11px]">
              in calls and website clicks
            </p>
          </div>

          <div className="p-3 bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg text-xs space-y-1">
            <div className="flex items-center space-x-2 text-[#1478F2] font-bold">
              <span>📍</span>
              <span>Opportunity to improve</span>
            </div>
            <p className="text-[#53657D] text-[11px]">
              rankings in ZIP 53202 and 53217
            </p>
          </div>

          <div className="p-3 bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg text-xs space-y-1">
            <div className="flex items-center space-x-2 text-[#D99614] font-bold">
              <span>💡</span>
              <span>High-volume keyword</span>
            </div>
            <p className="text-[#53657D] text-[11px]">
              "chimney sweep near me" within striking distance of top 3
            </p>
          </div>

          <div className="p-3 bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg text-xs space-y-1">
            <div className="flex items-center space-x-2 text-[#7257E8] font-bold">
              <span>📊</span>
              <span>Consider launching</span>
            </div>
            <p className="text-[#53657D] text-[11px]">
              a seasonal inspection campaign (Sept–Nov)
            </p>
          </div>
        </div>

        <button className="w-full bg-[#0B1F3A] hover:bg-[#142E52] text-white font-mono text-xs py-3 rounded-lg font-bold transition-all shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer">
          <span>✨</span>
          <span>Get AI Recommendations</span>
        </button>
      </div>
    </div>
  );
}
