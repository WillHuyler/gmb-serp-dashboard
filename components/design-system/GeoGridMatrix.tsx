'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export interface GeoGridNode {
  nodeIndex: number;
  row: number;
  col: number;
  quadrantLabel: string;
  latOffsetMiles: number;
  lngOffsetMiles: number;
  rank: number | null;
  topCompetitor?: string;
}

interface GeoGridMatrixProps {
  clientId?: string;
  clientName: string;
  centerAddress?: string | null;
  keyword: string | null;
  scanTimestamp: string | null;
  isVerifiedScan: boolean;
  nodes: GeoGridNode[];
  compact?: boolean;
}

const QUADRANT_LABELS = [
  ['NW Outer Ring', 'North-Northwest', 'North Perimeter', 'North-Northeast', 'NE Outer Ring'],
  ['West-Northwest', 'NW Inner Sector', 'North Inner Sector', 'NE Inner Sector', 'East-Northeast'],
  ['West Perimeter', 'West Inner Sector', 'PRIMARY LOCATION CENTER', 'East Inner Sector', 'East Perimeter'],
  ['West-Southwest', 'SW Inner Sector', 'South Inner Sector', 'SE Inner Sector', 'East-Southeast'],
  ['SW Outer Ring', 'South-Southwest', 'South Perimeter', 'South-Southeast', 'SE Outer Ring'],
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
  clientId,
  clientName,
  centerAddress,
  keyword,
  scanTimestamp,
  isVerifiedScan,
  nodes,
  compact = false,
}: GeoGridMatrixProps) {
  const displayNodes = nodes.length === 25 ? nodes : buildEmptyGeoGridNodes();
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number>(12);

  const selectedNode =
    displayNodes.find((n) => n.nodeIndex === selectedNodeIndex) || displayNodes[12];

  const getNodeStyle = (rank: number | null, isCenter: boolean) => {
    if (!isVerifiedScan || rank === null || rank <= 0) {
      return isCenter
        ? 'bg-amber-50 text-[#0B1F3A] border-[#D99614] font-bold'
        : 'bg-white/90 text-slate-400 border-[#DCE5EF]';
    }
    if (rank <= 3) {
      return 'bg-emerald-500 text-white border-emerald-600 shadow-sm font-bold';
    }
    if (rank <= 10) {
      return 'bg-amber-500 text-white border-amber-600 shadow-sm font-bold';
    }
    return 'bg-rose-500 text-white border-rose-600 shadow-sm font-bold';
  };

  const scannedNodes = isVerifiedScan
    ? displayNodes.filter((n) => typeof n.rank === 'number' && n.rank > 0)
    : [];
  const top3Count = scannedNodes.filter((n) => (n.rank as number) <= 3).length;
  const midCount = scannedNodes.filter(
    (n) => (n.rank as number) >= 4 && (n.rank as number) <= 10
  ).length;
  const lowCount = scannedNodes.filter((n) => (n.rank as number) > 10).length;

  return (
    <div className="bg-white border border-[#DCE5EF] rounded-xl p-6 space-y-5 shadow-sm">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCE5EF] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] uppercase tracking-wider text-[#0B1F3A] bg-[#F4F7FB] border border-[#DCE5EF] px-2.5 py-0.5 rounded font-bold">
              OTTERWATCH 5×5 GEO-GRID MATRIX
            </span>
            <span
              className={`font-mono text-[11px] px-2.5 py-0.5 rounded border font-bold ${
                isVerifiedScan
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              {isVerifiedScan ? '● VERIFIED SERP SCAN' : '○ UNSCANNED SETUP STATE'}
            </span>
          </div>
          <h3 className="text-lg font-bold text-[#0B1F3A] mt-1.5 font-sans">
            Target Search Query: {keyword ? `"${keyword}"` : 'No Tracked Keyword Configured'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Center Location Anchor:{' '}
            <strong className="text-[#0B1F3A]">
              {centerAddress || 'Primary business address pending'}
            </strong>{' '}
            • 25-Node Territory Grid
          </p>
        </div>

        <div className="text-right">
          <span className="text-slate-400 block text-[10px] font-bold uppercase">
            Last Verified Scan
          </span>
          <span className="font-mono text-xs font-bold text-[#0B1F3A]">
            {isVerifiedScan && scanTimestamp ? scanTimestamp : 'Awaiting Initial Scan'}
          </span>
        </div>
      </div>

      {/* Grid + Inspector Split */}
      <div
        className={`grid grid-cols-1 ${
          compact ? '' : 'lg:grid-cols-12'
        } gap-6 items-start`}
      >
        {/* 5x5 Map Canvas */}
        <div
          className={`${
            compact ? '' : 'lg:col-span-7'
          } relative bg-[#EEF3F9] border border-[#DCE5EF] rounded-xl p-5 overflow-hidden`}
        >
          {/* Subtle Map Grid Lines Backdrop */}
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(to right, #CBD5E1 1px, transparent 1px), linear-gradient(to bottom, #CBD5E1 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          <div className="relative z-10 grid grid-cols-5 gap-3 max-w-[440px] mx-auto">
            {displayNodes.map((node) => {
              const isSelected = node.nodeIndex === selectedNodeIndex;
              const isCenter = node.row === 2 && node.col === 2;
              return (
                <button
                  key={node.nodeIndex}
                  type="button"
                  onClick={() => setSelectedNodeIndex(node.nodeIndex)}
                  className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all ${getNodeStyle(
                    node.rank,
                    isCenter
                  )} ${
                    isSelected
                      ? 'ring-2 ring-[#0B1F3A] scale-105 shadow-md'
                      : 'hover:border-[#0B1F3A]/40'
                  }`}
                >
                  <span className="text-[9px] uppercase tracking-tighter opacity-75">
                    {isCenter ? 'ANCHOR' : `N${node.nodeIndex + 1}`}
                  </span>
                  <span className="text-base font-extrabold font-mono">
                    {isVerifiedScan && typeof node.rank === 'number'
                      ? `#${node.rank}`
                      : '—'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Distribution Legend */}
          <div className="relative z-10 mt-4 pt-3 border-t border-[#DCE5EF] bg-white/80 backdrop-blur px-3 py-2 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
            <span className="text-emerald-700 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Top 3 Pack: <strong>{isVerifiedScan ? top3Count : '—'}</strong>/25
            </span>
            <span className="text-amber-700 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              Rank #4–10: <strong>{isVerifiedScan ? midCount : '—'}</strong>/25
            </span>
            <span className="text-rose-700 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              Rank #11+: <strong>{isVerifiedScan ? lowCount : '—'}</strong>/25
            </span>
          </div>
        </div>

        {/* Node Inspector */}
        {!compact && (
          <div className="lg:col-span-5 bg-[#F4F7FB] border border-[#DCE5EF] rounded-xl p-5 space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-[#DCE5EF] pb-3">
              <div>
                <span className="text-[11px] uppercase text-[#D99614] font-bold block">
                  TERRITORY NODE INSPECTOR • NODE #{selectedNode.nodeIndex + 1}
                </span>
                <h4 className="text-base font-bold text-[#0B1F3A]">
                  {selectedNode.quadrantLabel}
                </h4>
              </div>
              <span className="font-mono text-xs px-3 py-1 rounded-lg bg-white border border-[#DCE5EF] text-[#0B1F3A] font-bold shadow-sm">
                {isVerifiedScan && typeof selectedNode.rank === 'number'
                  ? `Rank #${selectedNode.rank}`
                  : 'Unscanned'}
              </span>
            </div>

            {!isVerifiedScan ? (
              <div className="p-4 rounded-xl bg-white border border-[#DCE5EF] space-y-3">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                  <span>🔒 No Verified Geo-Grid Scan Recorded</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>{clientName}</strong> does not yet have a verified 5×5 geo-grid scan in Supabase. OtterWatch never fabricates coordinates or map pack rankings.
                </p>
                {clientId && (
                  <Link
                    href={`/connection-center?clientId=${encodeURIComponent(clientId)}`}
                    className="inline-block w-full text-center py-2 px-3 bg-[#0B1F3A] hover:bg-[#16325B] text-white font-semibold rounded-lg text-xs transition-all"
                  >
                    Configure GBP & SERP Scanner in Connection Center →
                  </Link>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white border border-[#DCE5EF] text-xs space-y-2.5">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Observed Map Pack Position:</span>
                  <strong className="text-[#0B1F3A] font-mono">
                    {typeof selectedNode.rank === 'number'
                      ? `#${selectedNode.rank}`
                      : 'Outside Top 20'}
                  </strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Local 3-Pack Visibility:</span>
                  <strong
                    className={
                      typeof selectedNode.rank === 'number' && selectedNode.rank <= 3
                        ? 'text-emerald-700'
                        : 'text-amber-700'
                    }
                  >
                    {typeof selectedNode.rank === 'number' && selectedNode.rank <= 3
                      ? 'IN GOOGLE 3-PACK'
                      : 'DISPLACED OUTSIDE 3-PACK'}
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
