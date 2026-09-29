"use client";

import React from "react";
import { useClient } from "@/components/providers/client-provider";

export default function SettingsPage() {
  const { activeClient } = useClient();

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold text-slate-100 tracking-tight">Client Settings & Governance</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configuring profile for: <span className="text-cyan-400 font-medium">{activeClient?.name || "No Client Selected"}</span>
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-md p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200">Client Profile Configuration</h3>
        
        <div className="grid grid-cols-1 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Client Name</label>
            <input
              type="text"
              readOnly
              value={activeClient?.name || ""}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-300 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Market / Primary Location</label>
            <input
              type="text"
              readOnly
              value={activeClient?.market_location || ""}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-300 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
