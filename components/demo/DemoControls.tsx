"use client";
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface DemoControlsProps {
  onTriggerScenario: (scenario: string) => void;
}

export function DemoControls({ onTriggerScenario }: DemoControlsProps) {
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between font-mono text-xs text-amber-600">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <span className="font-bold uppercase tracking-wider">DEMO SCENARIO SIMULATOR</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onTriggerScenario('baseline')}
          className="bg-white border border-amber-300 hover:bg-amber-50 text-amber-800 px-2.5 py-1 rounded font-semibold text-[11px] transition-all"
        >
          Baseline
        </button>
        <button
          onClick={() => onTriggerScenario('rank_drop')}
          className="bg-amber-600 text-white hover:bg-amber-700 px-2.5 py-1 rounded font-semibold text-[11px] transition-all"
        >
          Simulate Rank Drop (-28%)
        </button>
      </div>
    </div>
  );
}
