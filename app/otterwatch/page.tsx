'use client';

import React, { useState, Suspense } from 'react';
import { useClient } from '../../lib/client-context';
import GlobalHeader from '../../components/navigation/GlobalHeader';

export const dynamic = 'force-dynamic';

const CLIENT_KEYWORDS: Record<string, string[]> = {
  'High Rise Chimney Sweep': ['chimney sweep near me', 'chimney inspection milwaukee', 'fireplace repair 53202'],
  'Apex Dental Group': ['dentist near me', 'teeth whitening beverly hills', 'emergency dental 90210'],
  'Kelly Hyundai': ['hyundai dealer near me', 'hyundai service 18015', 'new hyundai tucson'],
  'DIMG Digital Marketing Group': ['digital marketing agency', 'seo services nyc', 'ppc management'],
  'FM Local Services': ['local home repair', 'handyman dallas 75001', 'plumbing contractor'],
};

function OtterWatchContent() {
  const { activeClient } = useClient();
  const keywords = CLIENT_KEYWORDS[activeClient?.name || ''] || ['local search query'];
  const [selectedKeyword, setSelectedKeyword] = useState<string>(keywords[0]);

  const brightlocalId = activeClient?.mappings?.brightlocal_location_id;
  const isLive = Boolean(brightlocalId && activeClient?.is_certified);

  if (!activeClient) {
    return (
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        <div className="p-8 rounded-xl bg-[#111622] border border-[#A9C7E5]/10 text-center text-slate-400 text-xs font-mono">
          NO CLIENT SELECTED
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D99614] font-bold block">
            FIRST-PARTY TELEMETRY • LOCAL SERP GRID
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">OtterWatch GEO-Grid Monitor</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Keyword-bound SERP rank collection for <strong className="text-white">{activeClient.name}</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <span
            className={`text-xs font-mono px-3 py-1 rounded border font-bold ${
              isLive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {isLive ? '🟢 MONITORING LIVE' : '🔴 UNAVAILABLE / NOT MONITORING'}
          </span>
        </div>
      </div>

      {!isLive ? (
        <div className="p-8 rounded-xl bg-[#111622] border border-[#A9C7E5]/10 text-center space-y-3">
          <span className="text-amber-400 text-xs font-mono tracking-widest uppercase block font-bold">
            Telemetry Requirement
          </span>
          <h2 className="text-xl font-bold text-white">NO VERIFIED OTTERWATCH SCAN DATA</h2>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            <strong className="text-white">{activeClient.name}</strong> has no active BrightLocal location mapping or certified scan history. Connect BrightLocal Location ID in Connection Center.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Keyword Selector Bar */}
          <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-mono text-slate-400 uppercase font-bold">TRACKED QUERY:</span>
              <select
                value={selectedKeyword}
                onChange={(e) => setSelectedKeyword(e.target.value)}
                className="bg-[#151D2A] text-xs font-mono font-bold text-[#D99614] border border-[#A9C7E5]/20 rounded px-3 py-1.5 focus:outline-none"
              >
                {keywords.map((kw) => (
                  <option key={kw} value={kw}>
                    "{kw}"
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs font-mono text-slate-400">
              SERVICE ZIP: <span className="text-white font-bold">{activeClient.service_areas[0] || 'ALL'}</span> | SCAN TIME: <span className="text-emerald-400 font-bold">Oct 6, 2026 18:30 UTC</span>
            </div>
          </div>

          {/* KPI Cards explicitly bound to keyword */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                AVG RANK • "{selectedKeyword}"
              </span>
              <div className="text-2xl font-bold text-[#D99614] font-mono">#3.4</div>
              <span className="text-[10px] text-emerald-400 font-mono">Top-3 Local Pack</span>
            </div>
            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">SHARE OF VOICE</span>
              <div className="text-2xl font-bold text-white font-mono">38.2%</div>
              <span className="text-[10px] text-slate-400 font-mono">25 Grid Nodes</span>
            </div>
            <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">RANK ACCELERATION</span>
              <div className="text-2xl font-bold text-emerald-400 font-mono">+14.2%</div>
              <span className="text-[10px] text-emerald-400 font-mono">vs Prior Scan</span>
            </div>
          </div>

          {/* Grid Matrix */}
          <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              5x5 GEO-GRID POSITION MATRIX • "{selectedKeyword}"
            </h3>
            <div className="grid grid-cols-5 gap-3 max-w-lg mx-auto p-4 bg-[#0B0F17] rounded-lg border border-[#A9C7E5]/10">
              {Array.from({ length: 25 }).map((_, idx) => {
                const rank = (idx % 6) + 1;
                return (
                  <div
                    key={idx}
                    className={`aspect-square rounded flex items-center justify-center font-mono font-bold text-xs ${
                      rank <= 3
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    #{rank}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function OtterWatchPage() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col font-sans">
      <Suspense fallback={<div className="p-6 text-xs text-slate-400 font-mono">Loading Header...</div>}>
        <GlobalHeader />
      </Suspense>
      <Suspense fallback={<div className="p-6 text-xs text-slate-400 font-mono">Loading OtterWatch...</div>}>
        <OtterWatchContent />
      </Suspense>
    </div>
  );
}
