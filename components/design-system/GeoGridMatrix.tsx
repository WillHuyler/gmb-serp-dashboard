'use client';

import React, { useState } from 'react';

export interface GeoGridNode {
  nodeIndex: number; // 0..24
  row: number; // 0..4
  col: number; // 0..4
  quadrantLabel: string; // e.g., "NW-1", "CENTER", "SE-2"
  latOffsetMiles: number;
  lngOffsetMiles: number;
  rank: number | null; // null if unscanned
  topCompetitor?: string;
}

interface GeoGridMatrixProps {
  clientName: string;
  centerAddress?: string;
  keyword: string | null;
  scanTimestamp: string | null;
  isVerifiedScan: boolean;
  nodes: GeoGridNode[];
  compact?: boolean;
}

const QUADRANT_LABELS = [
  ['NW-Outer', 'NNW', 'North', 'NNE', 'NE-Outer'],
  ['WNW', 'NW-Inner', 'N-Inner', 'NE-Inner', 'ENE'],
  ['West', 'W-Inner', 'CENTER (0mi)', 'E-Inner', 'East'],
  ['WSW', 'SW-Inner', 'S-Inner', 'SE-Inner', 'ESE'],
  ['SW-Outer', 'SSW', 'South', 'SSE', 'SE-Outer'],
];

export function buildEmptyGeoGridNodes(): GeoGridNode[] {
  const list: GeoGridNode[] = [];
  let idx = 0;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      list.push({
        nodeIndex: idx++,
        row: r,
        col: c,
        quadrantLabel: QUADRANT_LABELS[r][c],
        latOffsetMiles: (2 - r) * 1.25,
        lngOffsetMiles: (c - 2) * 1.25,
        rank: null,
      });
    }
  }
  return list;
}

export default function GeoGridMatrix({
  clientName,
  centerAddress,
  keyword,
  scanTimestamp,
  isVerifiedScan,
  nodes,
  compact = false,
}: GeoGridMatrixProps) {
  const displayNodes = nodes.length === 25 ? nodes : buildEmptyGeoGridNodes();
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number>(12); // Center node default

  const selectedNode =
    displayNodes.find((n) => n.nodeIndex === selectedNodeIndex) || displayNodes[12];

  const getNodeStyle = (rank: number | null) => {
    if (!isVerifiedScan || rank === null || rank <= 0) {
      return 'bg-[#151D2A] text-slate-500 border-[#A9C7E5]/15';
    }
    if (rank <= 3) {
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/10';
    }
    if (rank <= 10) {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
    }
    return 'bg-rose-500/20 text-rose-300 border-rose-500/50';
  };

  const scannedNodes = isVerifiedScan
    ? displayNodes.filter((n) => typeof n.rank === 'number' && n.rank > 0)
    : [];
  const top3Count = scannedNodes.filter((n) => (n.rank as number) <= 3).length;
  const midCount = scannedNodes.filter((n) => (n.rank as number) >= 4 && (n.rank as number) <= 10).length;
  const lowCount = scannedNodes.filter((n) => (n.rank as number) > 10).length;

  return (
    <div className="bg-[#111622] border border-[#A9C7E5]/15 rounded-xl p-5 space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#A9C7E5]/10 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#D99614] font-bold">
              OTTERWATCH 5×5 GEO-GRID TELEMETRY
            </span>
            <span
              className={`font-mono text-[10px] px-2 py-0.5 rounded border font-semibold ${
                isVerifiedScan
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              {isVerifiedScan ? '● VERIFIED SERP SCAN' : '○ NO VERIFIED SCAN RECORDED'}
            </span>
          </div>
          <h3 className="text-base font-bold text-white mt-1 font-sans">
            Query: {keyword ? `"${keyword}"` : 'No Tracked Keyword Configured'}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Center Anchor: {centerAddress || 'Location address pending'} • 25 Coordinate Nodes (5.0 mi × 5.0 mi)
          </p>
        </div>

        <div className="text-right font-mono text-xs">
          <span className="text-slate-500 block text-[10px]">SCAN TIMESTAMP</span>
          <span className="text-slate-200">
            {isVerifiedScan && scanTimestamp ? scanTimestamp : 'UNAVAILABLE'}
          </span>
        </div>
      </div>

      {/* Grid + Inspector Split */}
      <div className={`grid grid-cols-1 ${compact ? '' : 'lg:grid-cols-12'} gap-5 items-start`}>
        {/* 5x5 Coordinate Matrix */}
        <div className={`${compact ? '' : 'lg:col-span-7'} bg-[#0B0F17] border border-[#A9C7E5]/10 rounded-xl p-4 space-y-3`}>
          <div className="grid grid-cols-5 gap-2.5 max-w-[420px] mx-auto">
            {displayNodes.map((node) => {
              const isSelected = node.nodeIndex === selectedNodeIndex;
              return (
                <button
                  key={node.nodeIndex}
                  type="button"
                  onClick={() => setSelectedNodeIndex(node.nodeIndex)}
                  className={`aspect-square rounded-lg border flex flex-col items-center justify-center transition-all font-mono ${getNodeStyle(
                    node.rank
                  )} ${
                    isSelected
                      ? 'ring-2 ring-[#D99614] scale-[1.03]'
                      : 'hover:border-[#A9C7E5]/40'
                  }`}
                >
                  <span className="text-[9px] text-slate-400 uppercase tracking-tighter">
                    {node.row === 2 && node.col === 2 ? 'CTR' : `N${node.nodeIndex + 1}`}
                  </span>
                  <span className="text-sm sm:text-base font-bold">
                    {isVerifiedScan && typeof node.rank === 'number' ? `#${node.rank}` : '—'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Distribution Legend */}
          <div className="pt-3 border-t border-[#A9C7E5]/10 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
            <span className="text-emerald-400">
              ● Rank #1–3: <strong>{isVerifiedScan ? top3Count : '—'}</strong>/25
            </span>
            <span className="text-amber-400">
              ● Rank #4–10: <strong>{isVerifiedScan ? midCount : '—'}</strong>/25
            </span>
            <span className="text-rose-400">
              ● Rank #11+: <strong>{isVerifiedScan ? lowCount : '—'}</strong>/25
            </span>
          </div>
        </div>

        {/* Node SERP Pack Inspector */}
        {!compact && (
          <div className="lg:col-span-5 bg-[#151D2A] border border-[#A9C7E5]/12 rounded-xl p-4 space-y-3 font-sans">
            <div className="flex items-center justify-between border-b border-[#A9C7E5]/10 pb-2.5">
              <div>
                <span className="font-mono text-[10px] uppercase text-[#D99614] font-bold block">
                  NODE INSPECTOR • NODE #{selectedNode.nodeIndex + 1}
                </span>
                <h4 className="text-sm font-bold text-white">
                  Sector: {selectedNode.quadrantLabel}
                </h4>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-[#111622] border border-[#A9C7E5]/15 text-white font-bold">
                {isVerifiedScan && typeof selectedNode.rank === 'number'
                  ? `Rank #${selectedNode.rank}`
                  : 'Unscanned'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded bg-[#111622] border border-[#A9C7E5]/10">
                <span className="text-slate-500 block text-[10px]">LAT OFFSET</span>
                <span className="text-slate-200">
                  {selectedNode.latOffsetMiles >= 0 ? '+' : ''}
                  {selectedNode.latOffsetMiles.toFixed(2)} mi N/S
                </span>
              </div>
              <div className="p-2.5 rounded bg-[#111622] border border-[#A9C7E5]/10">
                <span className="text-slate-500 block text-[10px]">LNG OFFSET</span>
                <span className="text-slate-200">
                  {selectedNode.lngOffsetMiles >= 0 ? '+' : ''}
                  {selectedNode.lngOffsetMiles.toFixed(2)} mi E/W
                </span>
              </div>
            </div>

            {!isVerifiedScan ? (
              <div className="p-3.5 rounded-lg bg-[#111622] border border-amber-500/20 text-xs text-slate-300 space-y-1.5">
                <p className="font-semibold text-amber-400">
                  Provenance Lock: No Verified Scan Recorded
                </p>
                <p className="text-slate-400 leading-relaxed">
                  OtterWatch never displays synthetic map pack rankings. Configure a tracked keyword and run a verified BrightLocal / SerpAPI geo-grid scan for {clientName} to inspect node-level competitors.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-lg bg-[#111622] border border-[#A9C7E5]/10 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Client Position at Node:</span>
                  <strong className="text-white font-mono">
                    {typeof selectedNode.rank === 'number' ? `#${selectedNode.rank}` : 'Not in Top 20'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Map Pack Status:</span>
                  <strong
                    className={`font-mono ${
                      typeof selectedNode.rank === 'number' && selectedNode.rank <= 3
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {typeof selectedNode.rank === 'number' && selectedNode.rank <= 3
                      ? 'IN 3-PACK (DOMINANT)'
                      : 'OUTSIDE 3-PACK'}
                  </strong>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
