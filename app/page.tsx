'use client';

import React, { Suspense } from 'react';
import { useClient } from '../../lib/client-context';

export const dynamic = 'force-dynamic';

function SettingsContent() {
  const { activeClient } = useClient();

  return (
    <div className="p-8 space-y-6 bg-[#0B0F17] text-white min-h-screen font-sans">
      <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D99614] font-bold block">
            TENANT & CLIENT CONFIGURATION
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            {activeClient?.name || 'Active Client'}
          </h1>
        </div>
      </div>

      <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-6 space-y-4 max-w-2xl">
        <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider border-b border-[#A9C7E5]/10 pb-3">
          ACTIVE CLIENT PROVENANCE & MAPPING KEYS
        </h3>
        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-slate-400">Client ID:</span>
            <span className="text-white font-bold">{activeClient?.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Tenant ID:</span>
            <span className="text-white font-bold">{activeClient?.tenant_id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Google Ads ID:</span>
            <span className="text-white font-bold">{activeClient?.mappings?.google_ads_id || 'UNMAPPED'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">GA4 Property ID:</span>
            <span className="text-white font-bold">{activeClient?.mappings?.ga4_property_id || 'UNMAPPED'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">BrightLocal ID:</span>
            <span className="text-white font-bold">{activeClient?.mappings?.brightlocal_location_id || 'UNMAPPED'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs font-mono text-slate-400">Loading Settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
