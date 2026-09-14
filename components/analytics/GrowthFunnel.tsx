"use client";

import React from 'react';
import { AlertCircle } from 'lucide-react';

export interface FunnelStageData {
  stageName: string;
  count: number;
  conversionRate: number;
  benchmarkRate: number;
}

interface GrowthFunnelProps {
  stages: FunnelStageData[];
  clientName: string;
}

export function GrowthFunnel({ stages, clientName }: GrowthFunnelProps) {
  if (!stages || stages.length === 0) {
    return (
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-sm font-sans">
        <h3 className="text-sm font-extrabold text-[#102033]">Growth Funnel & Constraint Engine</h3>
        <p className="text-xs text-[#5E7187] mt-1 font-mono">FUNNEL DATA UNAVAILABLE FOR {clientName.toUpperCase()}</p>
      </div>
    );
  }

  let primaryBottleneck: FunnelStageData | null = null;
  let maxDropDelta = 0;

  stages.forEach((stage, idx) => {
    if (idx > 0) {
      const delta = stage.benchmarkRate - stage.conversionRate;
      if (delta > maxDropDelta) {
        maxDropDelta = delta;
        primaryBottleneck = stage;
      }
    }
  });

  return (
    <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-6 font-sans">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
        <div>
          <h3 className="text-sm font-extrabold text-[#102033]">Growth Funnel & Bottleneck Diagnostics</h3>
          <p className="text-xs text-[#5E7187] mt-0.5">Stage-by-stage conversion analysis against cohort benchmarks.</p>
        </div>

        {primaryBottleneck && (
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg text-rose-700 text-xs font-mono font-bold">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>BOTTLENECK DETECTED: {(primaryBottleneck as FunnelStageData).stageName} (-{maxDropDelta.toFixed(1)}% vs benchmark)</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {stages.map((stage, idx) => (
          <div key={stage.stageName} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase text-[#5E7187] block">
              Stage 0{idx + 1}: {stage.stageName}
            </span>
            <div className="text-lg font-extrabold text-[#102033]">
              {stage.count.toLocaleString()}
            </div>

            {idx > 0 && (
              <div className="pt-2 border-t border-[#E2E8F0] flex justify-between items-center text-[11px] font-mono">
                <span className="text-[#5E7187]">Conv Rate:</span>
                <span className={`font-bold ${stage.conversionRate < stage.benchmarkRate ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {stage.conversionRate}%
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
