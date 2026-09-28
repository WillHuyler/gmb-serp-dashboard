'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useClient } from '@/lib/client-context';
import GlobalHeader from '@/components/navigation/GlobalHeader';

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

        {/* Section B: Needs Attention Queue (Operational Exceptions) */}
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
              {/* Incident Item 1 */}
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

              {/* Incident Item 2 */}
              <div className="bg-[#151D2A] border border-amber-500/30 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-mono px-1.5 py-0.5 rounded font-bold">
                      CONNECTOR NOTICE
                    </span>
                    <span className="text-xs font-bold text-white">Google Ads Campaign Budget Constraint</span>
                    <span className="text-[10px] font-mono text-slate-500">• Google Ads Connector</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Primary Search campaign exhausted daily cap by 1:30 PM. Estimated 34% impression share lost to budget.
                  </p>
                </div>
                <Link
                  href={`/paid-media?clientId=${activeClient.id}`}
                  className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold px-3 py-1.5 rounded hover:bg-amber-500/20 transition-all whitespace-nowrap"
                >
                  Review Paid Media →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Section C: Business Pulse KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Leads */}
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
            <p className="text-[10px] text-slate-500">
              {activeClient?.is_certified ? 'Certified CRM pipeline sync' : 'Requires CRM connector mapping'}
            </p>
          </div>

          {/* Card 2: Ad Spend */}
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
            <p className="text-[10px] text-slate-500">
              {activeClient?.mappings?.google_ads_id ? 'Verified platform billing' : 'Google Ads account unmapped'}
            </p>
          </div>

          {/* Card 3: Blended CPL */}
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
            <p className="text-[10px] text-slate-500">
              {activeClient?.is_certified ? 'Spend / Qualified Leads' : 'Requires certified baseline'}
            </p>
          </div>

          {/* Card 4: Local Visibility */}
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
            <p className="text-[10px] text-slate-500">
              {activeClient?.mappings?.gmb_account_id ? 'OtterWatch 5x5 Geo-Grid' : 'GMB account unmapped'}
            </p>
          </div>
        </div>

        {/* Section D: Recent Signals & Contextual Navigation Paths */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Signals Stream */}
          <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-mono uppercase text-slate-300 tracking-wider font-bold border-b border-[#A9C7E5]/10 pb-3">
              RECENT SIGNALS & TELEMETRY MOVEMENTS
            </h2>
            
            {!activeClient?.is_certified ? (
              <p className="text-xs font-mono text-slate-500 py-4 text-center">
                No verified signals recorded for uncertified client.
              </p>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-[#A9C7E5]/5">
                  <span className="text-slate-300">GBP Direction Requests</span>
                  <span className="font-mono font-bold text-emerald-400">+18% vs 14-day avg</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#A9C7E5]/5">
                  <span className="text-slate-300">Google Ads Conversion Rate</span>
                  <span className="font-mono font-bold text-emerald-400">4.2% (+0.6%)</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-300">Organic Review Velocity</span>
                  <span className="font-mono font-bold text-slate-400">3 new reviews (4.8 avg)</span>
                </div>
              </div>
            )}
          </div>

          {/* Contextual Modules Path */}
          <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-mono uppercase text-slate-300 tracking-wider font-bold border-b border-[#A9C7E5]/10 pb-3">
              INVESTIGATION PATHS & DEEP MODULES
            </h2>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <Link
                href={`/otterwatch?clientId=${activeClient?.id || ''}`}
                className="p-3 bg-[#151D2A] border border-[#A9C7E5]/10 rounded-lg hover:border-[#55A9E6]/50 transition-all space-y-1 block"
              >
                <div className="font-bold text-white flex items-center justify-between">
                  <span>OtterWatch</span>
                  <span className="text-slate-500">→</span>
                </div>
                <p className="text-[10px] text-slate-400">Local SERP & Geo-Grid Telemetry</p>
              </Link>

              <Link
                href={`/outcome-lab?clientId=${activeClient?.id || ''}`}
                className="p-3 bg-[#151D2A] border border-[#A9C7E5]/10 rounded-lg hover:border-[#D99614]/50 transition-all space-y-1 block"
              >
                <div className="font-bold text-[#D99614] flex items-center justify-between">
                  <span>Outcome Lab</span>
                  <span className="text-slate-500">→</span>
                </div>
                <p className="text-[10px] text-slate-400">Scenario & Budget Modeling</p>
              </Link>

              <Link
                href={`/connection-center?clientId=${activeClient?.id || ''}`}
                className="p-3 bg-[#151D2A] border border-[#A9C7E5]/10 rounded-lg hover:border-emerald-500/50 transition-all space-y-1 block"
              >
                <div className="font-bold text-emerald-400 flex items-center justify-between">
                  <span>Connection Center</span>
                  <span className="text-slate-500">→</span>
                </div>
                <p className="text-[10px] text-slate-400">Account Mapping & Data Health</p>
              </Link>

              <Link
                href={`/reports?clientId=${activeClient?.id || ''}`}
                className="p-3 bg-[#151D2A] border border-[#A9C7E5]/10 rounded-lg hover:border-blue-500/50 transition-all space-y-1 block"
              >
                <div className="font-bold text-blue-400 flex items-center justify-between">
                  <span>Executive Reports</span>
                  <span className="text-slate-500">→</span>
                </div>
                <p className="text-[10px] text-slate-400">Certified Metric Exports</p>
              </Link>
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

              <div className="space-y-3 text-xs">
                <p className="text-slate-300">
                  Beacon interrogates certified telemetry signals for {activeClient?.name}. Select a prompt below or type your investigation query:
                </p>
                
                <div className="space-y-2">
                  <button className="w-full text-left p-2.5 bg-[#151D2A] hover:bg-[#1C2738] border border-[#A9C7E5]/10 rounded text-slate-200 transition-all">
                    "Why did local search visibility drop this week?"
                  </button>
                  <button className="w-full text-left p-2.5 bg-[#151D2A] hover:bg-[#1C2738] border border-[#A9C7E5]/10 rounded text-slate-200 transition-all">
                    "Which campaigns have exhausted daily budget constraints?"
                  </button>
                  <button className="w-full text-left p-2.5 bg-[#151D2A] hover:bg-[#1C2738] border border-[#A9C7E5]/10 rounded text-slate-200 transition-all">
                    "What is the cost per qualified lead trend over 30 days?"
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                placeholder="Ask Beacon a question about active client data..."
                className="w-full bg-[#151D2A] border border-[#A9C7E5]/20 rounded px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D99614]"
              />
              <p className="text-[9px] font-mono text-slate-500 text-center">
                Beacon only queries certified client metrics. Unbacked claims are suppressed.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
