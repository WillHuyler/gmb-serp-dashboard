'use client';

import React, { useState, Suspense } from 'react';
import { useClient } from '../../lib/client-context';
import GlobalHeader from '../../components/navigation/GlobalHeader';

export const dynamic = 'force-dynamic';

interface GBPLocation {
  locationId: string;
  name: string;
  address: string;
  status: 'VERIFIED' | 'SUSPENDED' | 'VERIFICATION_REQUIRED' | 'DUPLICATE';
}

const DISCOVERED_GBP_LOCATIONS: GBPLocation[] = [
  { locationId: 'locations/847291048291', name: 'High Rise Chimney Sweep & Service', address: 'Milwaukee, WI', status: 'VERIFIED' },
  { locationId: 'locations/992817401928', name: 'Kelly Hyundai of Stroudsburg', address: '1534 N 9th St, Stroudsburg, PA 18360', status: 'VERIFIED' },
  { locationId: 'locations/112233445566', name: 'Kelly Hyundai of Stroudsburg Service & Parts', address: '1534 N 9th St, Stroudsburg, PA 18360', status: 'VERIFIED' },
  { locationId: 'locations/445566778899', name: 'CarBahn Corporate Office', address: 'San Jose, CA', status: 'VERIFIED' },
  { locationId: 'locations/556677889900', name: 'Dryspace CrawlSpace Solutions', address: 'Stroudsburg, PA', status: 'SUSPENDED' },
];

function ConnectionCenterContent() {
  const { activeClient } = useClient();
  const [showDiscovery, setShowDiscovery] = useState(false);

  return (
    <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6 text-white font-mono text-xs">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#D99614] font-bold block">
            INTEGRATION CONTROL HUB
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Connection Center</h1>
          <p className="text-slate-400 mt-1">
            Map discovered GBP locations and provider credentials to <strong className="text-white">{activeClient?.name}</strong>.
          </p>
        </div>
        <button
          onClick={() => setShowDiscovery(!showDiscovery)}
          className="px-4 py-2 bg-[#D99614] hover:bg-[#B97A08] text-[#0B0F17] font-bold rounded transition-all"
        >
          🔍 DISCOVER GBP LOCATIONS
        </button>
      </div>

      {showDiscovery && (
        <div className="bg-[#111622] border border-[#A9C7E5]/20 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase">DISCOVERED GBP LOCATIONS IN ACCOUNT CONTAINER</h3>
          <div className="space-y-2">
            {DISCOVERED_GBP_LOCATIONS.map((loc) => (
              <div key={loc.locationId} className="flex justify-between items-center p-3 bg-[#151D2A] rounded border border-[#A9C7E5]/10">
                <div>
                  <span className="text-white font-bold block">{loc.name}</span>
                  <span className="text-slate-400 text-[10px]">{loc.address} | ID: {loc.locationId}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                    loc.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {loc.status}
                  </span>
                  {loc.status === 'VERIFIED' && (
                    <button className="px-3 py-1 bg-[#151D2A] hover:bg-[#1C273A] border border-[#A9C7E5]/20 text-slate-200 font-bold rounded">
                      MAP TO {activeClient?.name.toUpperCase()}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

export default function ConnectionCenterPage() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col font-sans">
      <Suspense fallback={<div className="p-6 text-xs text-slate-400 font-mono">Loading Header...</div>}>
        <GlobalHeader />
      </Suspense>
      <Suspense fallback={<div className="p-6 text-xs text-slate-400 font-mono">Loading Connections...</div>}>
        <ConnectionCenterContent />
      </Suspense>
    </div>
  );
}
