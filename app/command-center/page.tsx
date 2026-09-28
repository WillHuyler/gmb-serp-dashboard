'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useClient } from '../../lib/client-context';
import GlobalHeader from '../../components/navigation/GlobalHeader';

export default function CommandCenterPage() {
  const { activeClient, isLoading } = useClient();
  const [isBeaconOpen, setIsBeaconOpen] = useState(false);

  // Deriving Data Health State based on Client Context & Connection Mappings
  const getHealthStatus = () => {
    if (!activeClient) return { label: 'NO CLIENT SELECTED', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30' };
    if (!activeClient.is_certified) return { label: 'CONNECTION REQUIRED', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
    
    const mappings = activeClient.mappings || {};
    const connectedCount = Object.values(mappings).filter(Boolean).length;
    
    if (connectedCount >= 4) return { label: 'LIVE & SYNCHRONIZED', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
    if (connectedCount > 0) return { label: 'PARTIAL DATA CONNECTED', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' };
    return { label: 'DATA UNAVAILABLE', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' };
  };

  const health = getHealthStatus();

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col font-sans">
      {/* Top Header Shell */}
      <GlobalHeader onOpenBeacon={() => setIsBeaconOpen(true)} />

      {/* Main Command Center Workspace */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
        
        {/* Section A: Client Context & Data Health Summary Bar */}
        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold tracking-tight text-white">
                {activeClient ? activeClient.name : 'No Client Selected'}
              </h1>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${health.bg} ${health.color} ${health.border}`}>
                {health.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {activeClient?.is_certified
                ? `Tenant ID: ${activeClient.tenant_id} • All verified data feeds operational`
                : 'Uncertified client baseline. Connect provider accounts in Connection Center to activate intelligence.'}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href={`/connection-center?clientId=${activeClient?.id || ''}`}
              className="bg-[#151D2A] border border-[#A9C7E5]/20 text-xs font-mono font-bold text-slate-300 hover:text-white px-3 py-2 rounded transition-all"
            >
              Manage Integrations →
            </Link>
            <Link
              href={`/outcome-lab?clientId=${activeClient?.id || ''}`}
              className="bg-[#D99614]/10 border border-[#D99614]/30 text-[#D99614] hover:bg-[#D99614]/20 text-xs font-mono font-bold px-3 py-2 rounded transition-all"
            >
              Model Scenarios →
            </Link>
          </div>
        </div>

        {/* Section B: Operational Queue */}
        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <h2 className="text-xs font-mono uppercase text-slate-300 tracking-wider font-bold">
                NEEDS ATTENTION (OPERATIONAL QUEUE)
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              Filtered for Active Client
            </span>
          </div>

          {!activeClient || !activeClient.is_certified ? (
            <div className="p-6 text-center border border-dashed border-[#A9C7E5]/10 rounded-lg">
              <p className="text-xs font-mono text-amber-400 font-bold">
                CLIENT DATA UNCERTIFIED
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Operational exception monitoring requires certified account mappings.
              </p>
              <Link
                href={`/connection-center?clientId=${activeClient?.id || ''}`}
                className="inline-block mt-3 text-xs font-mono text-[#55A9E6] underline hover:text-white"
              >
                Resolve connection mappings in Connection Center →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-[#151D2A] border border-rose-500/30 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-mono px-1.5 py-0.5 rounded font-bold">
                      HIGH RISK
                    </span>
                    <span className="text-xs font-bold text-white">Local Visibility Drop Detected</span>
                    <span className="text-[10px] font-mono text-slate-500">• OtterWatch SERP Telemetry</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Average Geo-Grid rank fell from 2.4 to 4.8 in central service ZIP code over 72 hours.
                  </p>
                </div>
                <Link
                  href={`/otterwatch?clientId=${activeClient.id}`}
                  className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono font-bold px-3 py-1.5 rounded hover:bg-rose-500/20 transition-all whitespace-nowrap"
                >
                  Investigate in OtterWatch →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Section C: Business Pulse KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">Total CRM Leads</span>
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold text-white">
                {activeClient?.is_certified ? '184' : '—'}
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {activeClient?.is_certified ? '+12.4%' : 'UNAVAILABLE'}
              </span>
            </div>
          </div>

          <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">Ad Spend (Combined)</span>
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold text-white">
                {activeClient?.mappings?.google_ads_id ? '$4,120.00' : '—'}
              </span>
              <span className="text-xs font-mono text-slate-400">
                {activeClient?.mappings?.google_ads_id ? 'Google + Meta' : 'NOT CONNECTED'}
              </span>
            </div>
          </div>

          <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">Blended Cost / Lead</span>
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold text-white">
                {activeClient?.is_certified ? '$22.39' : '—'}
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {activeClient?.is_certified ? '-8.2%' : 'UNAVAILABLE'}
              </span>
            </div>
          </div>

          <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">Local Visibility Rank</span>
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold text-white">
                {activeClient?.mappings?.gmb_account_id ? '3.2 Avg' : '—'}
              </span>
              <span className="text-xs font-mono text-amber-400 font-bold">
                {activeClient?.mappings?.gmb_account_id ? '↓ 0.8' : 'NOT MAPPED'}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Ask Beacon Modal Drawer */}
      {isBeaconOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-[#0D131F] border-l border-[#A9C7E5]/20 h-full p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-4">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D99614] animate-ping"></span>
                  <h2 className="text-sm font-mono font-bold text-white uppercase">ASK BEACON INTELLIGENCE</h2>
                </div>
                <button
                  onClick={() => setIsBeaconOpen(false)}
                  className="text-slate-400 hover:text-white text-xs font-mono"
                >
                  [CLOSE ✕]
                </button>
              </div>

              <div className="bg-[#151D2A] border border-[#A9C7E5]/10 rounded-lg p-3 text-xs space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">Active Scope</span>
                <p className="font-bold text-white">{activeClient?.name || 'No Client Selected'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
