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
    HIGH: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    INSUFFICIENT_DATA: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  };

  return (
    <div className="bg-[#111622] border border-[#A9C7E5]/15 rounded-xl p-5 space-y-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#A9C7E5]/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-[#D99614]/15 text-[#D99614] border border-[#D99614]/30 font-semibold">
            {category}
          </span>
          <h3 className="text-sm font-bold text-white font-sans">{title}</h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-slate-400">
            SOURCES: {sources.join(' + ') || 'NONE'}
          </span>
          <span
            className={`font-mono text-[10px] px-2 py-0.5 rounded border font-semibold ${confidenceColors[confidence]}`}
          >
            CONFIDENCE: {confidence}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
        <div className="bg-[#151D2A] border border-[#A9C7E5]/10 rounded-lg p-3.5 space-y-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-sky-400 font-bold block">
            1. WHAT IS HAPPENING
          </span>
          <p className="text-slate-200 leading-relaxed">{whatIsHappening}</p>
        </div>

        <div className="bg-[#151D2A] border border-[#A9C7E5]/10 rounded-lg p-3.5 space-y-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-amber-400 font-bold block">
            2. WHY IT IS HAPPENING
          </span>
          <p className="text-slate-200 leading-relaxed">{whyItIsHappening}</p>
        </div>

        <div className="bg-[#151D2A] border border-[#D99614]/25 rounded-lg p-3.5 space-y-2 flex flex-col justify-between">
          <div className="space-y-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#D99614] font-bold block">
              3. WHAT TO DO NEXT
            </span>
            <p className="text-slate-200 leading-relaxed">{whatToDoNext}</p>
          </div>

          {actionLabel && actionHref && (
            <Link
              href={actionHref}
              className="inline-block mt-2 text-center py-1.5 px-3 bg-[#D99614] hover:bg-[#B97A08] text-[#0B0F17] font-semibold rounded text-xs transition-all"
            >
              {actionLabel} →
            </Link>
          )}
          {actionLabel && onActionClick && !actionHref && (
            <button
              onClick={onActionClick}
              className="w-full mt-2 py-1.5 px-3 bg-[#D99614] hover:bg-[#B97A08] text-[#0B0F17] font-semibold rounded text-xs transition-all"
            >
              {actionLabel} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
