"use client";
import React from 'react';
import { AlertTriangle, AlertCircle, ArrowUpRight } from 'lucide-react';
import { SignalsEngine } from '../../../lib/signals-engine';

export default function SignalsPage() {
  const signals = SignalsEngine.getActiveSignals();

  return (
    <div className="space-y-6 font-sans">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-extrabold text-[#102033] tracking-tight">Signals & Telemetry Engine</h1>
          <span className="bg-[#102033] text-white text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">
            PorchLight Standard
          </span>
        </div>
        <p className="text-xs text-[#5E7187] mt-1">
          Cross-channel anomalies, volatility warnings, and recommended decision interventions.
        </p>
      </div>

      <div className="space-y-4">
        {signals.map((sig) => (
          <div
            key={sig.id}
            className={`bg-[#FFFFFF] border rounded-xl p-5 shadow-sm transition-all ${
              sig.severity === 'critical' ? 'border-red-300 bg-red-50/10' : 'border-[#E2E8F0]'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  sig.severity === 'critical' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  {sig.severity === 'critical' ? <AlertTriangle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#5E7187] uppercase">{sig.channel}</span>
                    <span className="text-xs font-extrabold text-[#102033]">{sig.signalType}</span>
                  </div>
                  <p className="text-xs text-[#5E7187] mt-0.5">{sig.evidence}</p>
                </div>
              </div>

              <span className="text-[10px] font-mono text-[#5E7187]">{sig.timestamp}</span>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex justify-between items-center text-xs">
              <div className="bg-[#F4F6F8] px-3 py-1.5 rounded-lg border border-[#E2E8F0] font-mono text-[11px]">
                <span className="text-[#5E7187]">{sig.metricName}: </span>
                <span className="font-bold text-[#102033]">{sig.baselineValue}</span>
                <span className="text-[#5E7187]"> {"->"} </span>
                <span className={`font-bold ${sig.percentChange < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {sig.currentValue} ({sig.percentChange}%)
                </span>
              </div>

              <button className="bg-[#F5A000] hover:bg-[#FFC44D] text-[#08111F] font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all">
                <span>Execute Action</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
