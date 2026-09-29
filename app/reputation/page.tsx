"use client";

import React from "react";
import { useClient } from "@/components/providers/client-provider";
import Link from "next/link";

export default function ReputationPage() {
  const { activeClient, isLoading } = useClient();

  // Mock check for connection state (will consume Connection Center state machine)
  const isGbpConnected = false; 

  if (isLoading) {
    return (
      <div className="p-8 text-slate-400 text-xs flex items-center space-x-2">
        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
        <span>Loading Reputation Module...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Reputation & Review Intelligence</h1>
          <p className="text-xs text-slate-400 mt-1">
            Client: <span className="text-cyan-400 font-medium">{activeClient?.name || "No Client Selected"}</span>
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-500">Provenance:</span>
          <span className="font-mono bg-slate-900 border border-slate-800 text-slate-300 px-2 py-1 rounded">
            {isGbpConnected ? "GBP_LIVE_SYNC" : "NO_SOURCE_MAPPED"}
          </span>
        </div>
      </div>

      {!isGbpConnected ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-8 text-center max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Google Business Profile Not Mapped</h3>
            <p className="text-xs text-slate-400 mt-1">
              Reputation metrics require an active GBP connection mapped to {activeClient?.name || "this client"}.
            </p>
          </div>
          <Link
            href={`/connection-center?client_id=${activeClient?.id}`}
            className="inline-block bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs px-4 py-2 rounded transition-colors"
          >
            Connect GBP in Connection Center
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-md">
            <span className="text-xs text-slate-400">Average Rating</span>
            <div className="text-2xl font-bold text-slate-100 mt-1">4.8 / 5.0</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-md">
            <span className="text-xs text-slate-400">Total Reviews</span>
            <div className="text-2xl font-bold text-slate-100 mt-1">142</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-md">
            <span className="text-xs text-slate-400">Unanswered Reviews</span>
            <div className="text-2xl font-bold text-amber-400 mt-1">3</div>
          </div>
        </div>
      )}
    </div>
  );
}
