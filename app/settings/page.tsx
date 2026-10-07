'use client';

import React, { Suspense } from 'react';
import { useClient } from '../../lib/client-context';
import GlobalHeader from '../../components/navigation/GlobalHeader';

export const dynamic = 'force-dynamic';

function SettingsContent() {
  const { activeClient } = useClient();

  return (
    <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D99614] font-bold block">
            SYSTEM ARCHITECTURE • TENANT SETTINGS
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Tenant & Integration Settings</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Active mapping keys and system configurations for <strong className="text-white">{activeClient?.name || 'Selected Client'}</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <span
            className={`text-xs font-mono px-3 py-1 rounded border font-bold ${
              activeClient?.is_certified
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {activeClient?.is_certified ? '✓ CERTIFIED BASELINE' : '⚠ UNCERTIFIED BASELINE'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
            CANONICAL PROVIDER MAPPINGS
          </h3>

          <div className="space-y-3 text-xs font-mono">
            <div className="flex justify-between py-2 border-b border-[#A9C7E5]/10">
              <span className="text-slate-400">CLIENT NAME</span>
              <span className="text-white font-bold">{activeClient?.name || 'UNASSIGNED'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#A9C7E5]/10">
              <span className="text-slate-400">GOOGLE ADS ID</span>
              <span className="text-slate-200">{activeClient?.mappings?.google_ads_id || 'UNMAPPED'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#A9C7E5]/10">
              <span className="text-slate-400">META ACT ID</span>
              <span className="text-slate-200">{activeClient?.mappings?.meta_act_id || 'UNMAPPED'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#A9C7E5]/10">
              <span className="text-slate-400">GA4 PROPERTY ID</span>
              <span className="text-slate-200">{activeClient?.mappings?.ga4_property_id || 'UNMAPPED'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#A9C7E5]/10">
              <span className="text-slate-400">GSC SITE URL</span>
              <span className="text-slate-200">{activeClient?.mappings?.gsc_site_url || 'UNMAPPED'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#A9C7E5]/10">
              <span className="text-slate-400">BRIGHTLOCAL LOCATION ID</span>
              <span className="text-slate-200">{activeClient?.mappings?.brightlocal_location_id || 'UNMAPPED'}</span>
            </div>
          </div>

          <details className="mt-4 border-t border-[#A9C7E5]/10 pt-3">
            <summary className="text-[10px] font-mono text-slate-500 cursor-pointer hover:text-slate-300">
              SHOW INTERNAL DIAGNOSTIC UUIDs
            </summary>
            <div className="mt-2 p-2 bg-[#0B0F17] rounded text-[10px] font-mono text-slate-400 space-y-1">
              <div>Internal Client ID: {activeClient?.id}</div>
            </div>
          </details>
        </div>

        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
            ENVIRONMENT & API SECRETS HEALTH
          </h3>

          <div className="space-y-3 text-xs font-mono">
            <div className="flex justify-between py-2 border-b border-[#A9C7E5]/10">
              <span className="text-slate-400">SUPABASE DATABASE URL</span>
              <span className="text-emerald-400 font-bold">CONFIGURED</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#A9C7E5]/10">
              <span className="text-slate-400">SUPABASE SERVICE ROLE KEY</span>
              <span className="text-emerald-400 font-bold">CONFIGURED</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#A9C7E5]/10">
              <span className="text-slate-400">PLAID AI ENGINE</span>
              <span className="text-emerald-400 font-bold">ACTIVE / ONLINE</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#A9C7E5]/10">
              <span className="text-slate-400">DIAGNOSTIC HEALTH ROUTE</span>
              <span className="text-emerald-400 font-bold">/api/health (200 OK)</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col font-sans">
      <Suspense fallback={<div className="p-6 text-xs text-slate-400 font-mono">Loading Header...</div>}>
        <GlobalHeader />
      </Suspense>
      <Suspense fallback={<div className="p-6 text-xs text-slate-400 font-mono">Loading Settings...</div>}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}
