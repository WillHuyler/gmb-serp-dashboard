"use client";

import React from "react";
import { useClient } from "@/components/providers/client-provider";

export default function CompetitorsPage() {
  const { activeClient, isLoading } = useClient();

  if (isLoading) {
    return (
      <div className="p-8 text-slate-400 text-xs flex items-center space-x-2">
        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
        <span>Loading Competitor Matrix...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Competitor Intelligence</h1>
          <p className="text-xs text-slate-400 mt-1">
            Active Target: <span className="text-cyan-400 font-medium">{activeClient?.name || "No Client Selected"}</span>
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-500">Source:</span>
          <span className="font-mono bg-slate-900 border border-slate-800 text-slate-300 px-2 py-1 rounded">
            OTTERWATCH_TELEMETRY
          </span>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-8 text-center max-w-xl mx-auto space-y-3">
        <h3 className="text-sm font-semibold text-slate-200">No Competitor Benchmarks Configured</h3>
        <p className="text-xs text-slate-400">
          OtterWatch has not detected configured competitor tracking profiles for {activeClient?.name || "the active client"}.
        </p>
        <button
          disabled
          className="bg-slate-800 text-slate-500 text-xs px-4 py-2 rounded cursor-not-allowed border border-slate-700"
          title="Requires active local SERP grid configuration in OtterWatch"
        >
          Configure Competitors in OtterWatch (Disabled)
        </button>
      </div>
    </div>
  );
}
