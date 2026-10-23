'use client';

import React from 'react';

export interface KpiMetricCardProps {
  label: string;
  value: number | null | undefined;
  previousValue?: number | null | undefined;
  format?: 'number' | 'currency' | 'rank' | 'percent';
  invertDeltaPolarity?: boolean; // True for Rank or CPL where lower is better
  sourceBadge: string;
  provenanceNote?: string;
  isCertified: boolean;
  isLoading?: boolean;
  accentHighlight?: boolean;
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
}: KpiMetricCardProps) {
  const formatDisplayValue = (val: number | null | undefined): string => {
    if (isLoading) return '...';
    if (!isCertified || typeof val !== 'number' || Number.isNaN(val)) {
      return '—';
    }
    if (format === 'currency') {
      return `$${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }
    if (format === 'rank') {
      return `#${val.toFixed(1)}`;
    }
    if (format === 'percent') {
      return `${val.toFixed(1)}%`;
    }
    return val.toLocaleString('en-US');
  };

  /**
   * Strict Mathematical Guard (CR-P0-01):
   * Delta % is computed ONLY if isCertified === true, current is valid number,
   * and previousValue is a valid number strictly greater than 0.
   */
  const renderDelta = () => {
    if (isLoading) {
      return <span className="text-slate-500 font-mono text-xs">Loading comparison...</span>;
    }
    if (!isCertified || typeof value !== 'number') {
      return <span className="text-slate-500 font-mono text-xs">No verified baseline</span>;
    }
    if (typeof previousValue !== 'number' || previousValue <= 0) {
      return <span className="text-slate-400 font-mono text-xs">— (Prior period unavailable)</span>;
    }

    const rawDelta = ((value - previousValue) / previousValue) * 100;
    const isFavorable = invertDeltaPolarity ? rawDelta <= 0 : rawDelta >= 0;
    const sign = rawDelta > 0 ? '+' : '';

    return (
      <span
        className={`font-mono text-xs font-semibold ${
          isFavorable ? 'text-emerald-400' : 'text-rose-400'
        }`}
      >
        {sign}
        {rawDelta.toFixed(1)}% vs prior period
      </span>
    );
  };

  return (
    <div
      className={`bg-[#111622] rounded-xl p-5 border transition-all flex flex-col justify-between space-y-3 ${
        accentHighlight
          ? 'border-[#D99614]/40 shadow-lg shadow-[#D99614]/5'
          : 'border-[#A9C7E5]/12 hover:border-[#A9C7E5]/25'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-sans font-semibold text-slate-300 uppercase tracking-wider">
          {label}
        </span>
        <span
          className={`font-mono text-[10px] px-2 py-0.5 rounded border font-semibold ${
            isCertified && typeof value === 'number'
              ? 'bg-[#151D2A] text-slate-300 border-[#A9C7E5]/15'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}
        >
          {sourceBadge}
        </span>
      </div>

      <div
        className={`text-3xl font-bold font-mono tracking-tight ${
          accentHighlight ? 'text-[#D99614]' : 'text-white'
        }`}
      >
        {formatDisplayValue(value)}
      </div>

      <div className="pt-2 border-t border-[#A9C7E5]/10 flex items-center justify-between gap-2">
        <div>{renderDelta()}</div>
        {provenanceNote && (
          <span className="font-mono text-[10px] text-slate-500 truncate max-w-[140px]">
            {provenanceNote}
          </span>
        )}
      </div>
    </div>
  );
}
