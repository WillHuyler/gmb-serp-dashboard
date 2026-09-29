"use client";

import React from "react";
import { useClient } from "@/components/providers/client-provider";

export default function ReportsPage() {
  const { activeClient } = useClient();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Reports & Performance Export</h1>
          <p className="text-xs text-slate-400 mt-1">
            Active Client: <span className="text-cyan-400 font-medium">{activeClient?.name || "No Client Selected"}</span>
          </p>
        </div>
        <button
          disabled
          className="bg-slate-800 border border-slate-700 text-slate-500 px-3 py-1.5 rounded text-xs cursor-not-allowed"
          title="PDF generation worker unavailable. Connect active provider sources first."
        >
          Export PDF (Disabled)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-md space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Executive Performance Summary</h3>
              <p className="text-xs text-slate-400 mt-0.5">Multi-channel aggregated report</p>
            </div>
            <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded font-mono">30-DAY</span>
          </div>
          <p className="text-xs text-slate-500">Includes Paid Media spend, Local SERP rank movement, and review sentiment metrics.</p>
          <button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 rounded border border-slate-700 transition-colors">
            Preview Report Data
          </button>
        </div>
      </div>
    </div>
  );
}
