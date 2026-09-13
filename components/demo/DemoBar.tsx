"use client";
import React from 'react';
import { Play } from 'lucide-react';
import { DEMO_TENANTS, DemoTenantProfile } from '../../lib/demo-engine';

interface DemoBarProps {
  activeTenant: DemoTenantProfile;
  onSelectTenant: (tenant: DemoTenantProfile) => void;
}

export function DemoBar({ activeTenant, onSelectTenant }: DemoBarProps) {
  return (
    <div className="bg-[#111F34] border-b border-[#F5A000]/30 px-8 py-2 flex items-center justify-between text-xs font-mono text-[#A9C7E5]">
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-[#F5A000] animate-ping" />
        <span className="text-[#FFC44D] font-bold uppercase tracking-wider flex items-center gap-1">
          <Play className="w-3 h-3 fill-current" /> DEMO SANDBOX ACTIVE
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-[#70839D]">Select Pitch Prospect:</span>
        <select
          value={activeTenant.id}
          onChange={(e) => {
            const selected = DEMO_TENANTS.find(t => t.id === e.target.value);
            if (selected) onSelectTenant(selected);
          }}
          className="bg-[#08111F] border border-[#A9C7E5]/20 text-white rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[#F5A000]"
        >
          {DEMO_TENANTS.map((t) => (
            <option key={t.id} value={t.id}>{t.name} ({t.industry})</option>
          ))}
        </select>
      </div>
    </div>
  );
}
