'use client';

import React from 'react';
import { useClient } from '../../lib/client-context';

export default function SettingsPage() {
  const { activeClient } = useClient();

  return (
    <div className="space-y-6 text-[#0B1F3A]">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">
            PLATFORM SETTINGS
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-[#0B1F3A] mt-0.5">
            {activeClient?.name || 'Active Client'}
          </h1>
          <p className="text-xs text-[#53657D] mt-1">
            Organization details, client assignments, entitlements, and security controls.
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#DCE5EF] rounded-xl p-8 space-y-6 shadow-sm max-w-3xl">
        <div className="border-b border-[#DCE5EF] pb-4">
          <h3 className="text-sm font-bold text-[#0B1F3A]">Client Context Settings</h3>
          <p className="text-xs text-[#53657D] mt-0.5">
            Current active context and database tenant configuration.
          </p>
        </div>

        <div className="space-y-4 font-mono text-xs">
          <div className="flex justify-between items-center py-2 border-b border-[#DCE5EF]">
            <span className="text-slate-400">ACTIVE CLIENT:</span>
            <span className="font-bold text-[#0B1F3A]">{activeClient?.name || 'None Selected'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-[#DCE5EF]">
            <span className="text-slate-400">CLIENT ID:</span>
            <span className="text-[#53657D]">{activeClient?.id || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-[#DCE5EF]">
            <span className="text-slate-400">TENANT ID:</span>
            <span className="text-[#53657D]">{activeClient?.tenant_id || '00000000-0000-0000-0000-000000000001'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-[#DCE5EF]">
            <span className="text-slate-400">CERTIFICATION STATUS:</span>
            <span className={`font-bold ${activeClient?.is_certified ? 'text-[#12A36D]' : 'text-amber-600'}`}>
              {activeClient?.is_certified ? '✓ CERTIFIED' : '⚠ UNCERTIFIED'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
