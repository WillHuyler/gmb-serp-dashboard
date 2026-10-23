'use client';

import React from 'react';
import Link from 'next/link';

export interface TriPartInsightProps {
  title: string;
  category: string;
  confidence: 'HIGH' | 'MEDIUM' | 'INSUFFICIENT_DATA';
  sources: string[];
  whatIsHappening: string;
  whyItIsHappening: string;
  whatToDoNext: string;
  actionLabel?: string;
  actionHref?: string;
  onActionClick?: () => void;
}

export default function TriPartInsightCard({
  title,
  category,
  confidence,
  sources,
  whatIsHappening,
  whyItIsHappening,
  whatToDoNext,
  actionLabel,
  actionHref,
  onActionClick,
}: TriPartInsightProps) {
  const confidenceColors = {
    HIGH: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    MEDIUM: 'bg-amber-50 text-amber-800 border-amber-200',
    INSUFFICIENT_DATA: 'bg-slate-100 text-slate-600 border-[#DCE5EF]',
  };

  return (
    <div className="bg-white border border-[#DCE5EF] rounded-xl p-6 space-y-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DCE5EF] pb-3.5">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] uppercase px-2.5 py-0.5 rounded-md bg-[#0B1F3A] text-[#D99614] font-bold tracking-wider">
            {category}
          </span>
          <h3 className="text-base font-bold text-[#0B1F3A] font-sans">{title}</h3>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-slate-500">
            Sources: <strong className="text-[#0B1F3A]">{sources.join(' + ') || 'Awaiting Sync'}</strong>
          </span>
          <span
            className={`font-mono text-[10px] px-2.5 py-0.5 rounded border font-bold ${confidenceColors[confidence]}`}
          >
            CONFIDENCE: {confidence}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-sans">
        <div className="bg-[#F4F7FB] border border-[#DCE5EF] rounded-xl p-4 space-y-1.5">
          <span className="text-xs uppercase tracking-wider text-sky-700 font-bold block">
            1. What Is Happening
          </span>
          <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">{whatIsHappening}</p>
        </div>

        <div className="bg-[#F4F7FB] border border-[#DCE5EF] rounded-xl p-4 space-y-1.5">
          <span className="text-xs uppercase tracking-wider text-amber-700 font-bold block">
            2. Why It Is Happening
          </span>
          <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">{whyItIsHappening}</p>
        </div>

        <div className="bg-amber-50/60 border border-[#D99614]/40 rounded-xl p-4 space-y-2.5 flex flex-col justify-between">
          <div className="space-y-1.5">
            <span className="text-xs uppercase tracking-wider text-[#B87D0E] font-bold block">
              3. Recommended Next Action
            </span>
            <p className="text-[#0B1F3A] font-medium leading-relaxed text-xs sm:text-sm">
              {whatToDoNext}
            </p>
          </div>

          {actionLabel && actionHref && (
            <Link
              href={actionHref}
              className="inline-block mt-2 text-center py-2 px-4 bg-[#D99614] hover:bg-[#B87D0E] text-[#0B1F3A] font-bold rounded-lg text-xs transition-all shadow-sm"
            >
              {actionLabel} →
            </Link>
          )}
          {actionLabel && onActionClick && !actionHref && (
            <button
              type="button"
              onClick={onActionClick}
              className="w-full mt-2 py-2 px-4 bg-[#D99614] hover:bg-[#B87D0E] text-[#0B1F3A] font-bold rounded-lg text-xs transition-all shadow-sm"
            >
              {actionLabel} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
