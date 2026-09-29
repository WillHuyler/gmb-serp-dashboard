"use client";

import React from "react";
import { useClient } from "@/components/providers/client-provider";

export default function AutomationPage() {
  const { activeClient } = useClient();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Automation Engine</h1>
          <p className="text-xs text-slate-400 mt-1">
            Scoped Client: <span className="text-cyan-400 font-medium">{activeClient?.name || "No Client Selected"}</span>
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-md p-4">
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Active Workflow Rules</h3>
        <div className="text-xs text-slate-500 py-6 text-center border border-dashed border-slate-800 rounded">
          No automation rules configured for {activeClient?.name || "active client"}.
        </div>
      </div>
    </div>
  );
}
