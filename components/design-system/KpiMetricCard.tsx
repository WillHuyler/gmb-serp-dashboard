'use client';

import React from 'react';

export interface KpiMetricCardProps {
  label: string;
  value: number | null | undefined;
  previousValue?: number | null | undefined;
  format?: 'number' | 'currency' | 'rank' | 'percent';
  invertDeltaPolarity?: boolean;
  sourceBadge: string;
  provenanceNote?: string;
  isCertified: boolean;
  isLoading?: boolean;
  accentHighlight?: boolean;
  accentColor?: 'gold' | 'blue' | 'teal' | 'violet' | 'orange';
}

export default function KpiMetricCard({
  label,
  value,
  previousValue,
  format = 'number',
  invertDeltaPolarity = false,
  sourceBadge,
  provenanceNote,
  isCertified,
  isLoading = false,
  accentHighlight = false,
  accentColor,
}: KpiMetricCardProps) {
  const resolvedAccent = accentColor || (accentHighlight ? 'gold' : 'blue');

  const topBorderClasses: Record<string, string> = {
    gold: 'border-t-4 border-t-[#D99614]',
    blue: 'border-t-4 border-t-sky-600',
    teal: 'border-t-4 border-t-teal-600',
    violet: 'border-t-4 border-t-violet-600',
    orange: 'border-t-4 border-t-amber-600',
  };

  const formatDisplayValue = (val: number | null | undefined): string => {
    if (isLoading) return '...';
    if (!isCertified || typeof val !== 'number' || Number.isNaN(val)) {
      return '—';
    }
    if (format === 'currency') {
      return `$${val.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })}`;
    }
    if (format === 'rank') {
      return `#${val.toFixed(1)}`;
    }
    if (format === 'percent') {
      return `${val.toFixed(1)}%`;
    }
    return val.toLocaleString('en-US');
  };

  const renderDelta = () => {
    if (isLoading) {
      return <span className="text-slate-400 text-xs">Loading comparison...</span>;
    }
    if (!isCertified || typeof value !== 'number') {
      return <span className="text-slate-400 text-xs">No verified baseline</span>;
    }
    if (typeof previousValue !== 'number' || previousValue <= 0) {
      return <span className="text-slate-500 text-xs">Prior period unavailable</span>;
    }

    const rawDelta = ((value - previousValue) / previousValue) * 100;
    const isFavorable = invertDeltaPolarity ? rawDelta <= 0 : rawDelta >= 0;
    const sign = rawDelta > 0 ? '+' : '';

    return (
      <span
        className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
          isFavorable
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}
      >
        {sign}
        {rawDelta.toFixed(1)}% vs prior
      </span>
    );
  };

  return (
    <div
      className={`bg-white rounded-xl p-5 border border-[#DCE5EF] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3 ${topBorderClasses[resolvedAccent]}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-sans font-bold text-slate-600 uppercase tracking-wider">
          {label}
        </span>
        <span
          className={`font-mono text-[10px] px-2 py-0.5 rounded border font-bold ${
            isCertified && typeof value === 'number'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-slate-100 text-slate-600 border-[#DCE5EF]'
          }`}
        >
          {sourceBadge}
        </span>
      </div>

      <div
        className={`text-3xl font-extrabold tracking-tight font-sans ${
          accentHighlight ? 'text-[#D99614]' : 'text-[#0B1F3A]'
        }`}
      >
        {formatDisplayValue(value)}
      </div>

      <div className="pt-2.5 border-t border-[#DCE5EF] flex items-center justify-between gap-2">
        <div>{renderDelta()}</div>
        {provenanceNote && (
          <span className="text-[11px] font-medium text-slate-500 truncate max-w-[150px]">
            {provenanceNote}
          </span>
        )}
      </div>
    </div>
  );
}
