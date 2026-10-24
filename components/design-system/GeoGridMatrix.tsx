'use client';

import React, { useState } from 'react';

export interface GeoGridNode {
  id: string;
  gridRow: number;
  gridCol: number;
  rank: number | null;
  lat?: number;
  lng?: number;
  label?: string;
}

export function buildEmptyGeoGridNodes(): GeoGridNode[] {
  const nodes: GeoGridNode[] = [];
  for (let r = 1; r <= 5; r++) {
    for (let c = 1; c <= 5; c++) {
      nodes.push({
        id: `node-${r}-${c}`,
        gridRow: r,
        gridCol: c,
        rank: null,
      });
    }
  }
  return nodes;
}

interface GeoGridMatrixProps {
  clientId?: string;
  clientName?: string;
  centerAddress?: string | null;
  keyword?: string | null;
  scanTimestamp?: string | null;
  isVerifiedScan?: boolean;
  nodes?: GeoGridNode[];
  compact?: boolean;
}

export default function GeoGridMatrix({
  clientName = 'Selected Client',
  centerAddress,
  keyword,
  scanTimestamp,
  isVerifiedScan = false,
  nodes = buildEmptyGeoGridNodes(),
  compact = false,
}: GeoGridMatrixProps) {
  const [selectedNode, setSelectedNode] = useState<GeoGridNode | null>(null);

  const getNodeColor = (rank: number | null) => {
    if (!rank || !isVerifiedScan) return 'bg-slate-100 border-slate-300 text-slate-400';
    if (rank <= 3) return 'bg-emerald-500 border-emerald-600 text-white font-bold';
    if (rank <= 10) return 'bg-amber-400 border-amber-500 text-slate-900 font-bold';
    return 'bg-rose-500 border-rose-600 text-white font-bold';
  };

  return (
    <div className="bg-white border border-[#DCE5EF] rounded-xl p-4 sm:p-6 shadow-sm w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#DCE5EF] pb-3 mb-4">
        <div>
          <span className="text-[10px] sm:text-[11px] uppercase text-[#D99614] font-bold block">
            5×5 LOCAL SERP GEO-GRID MATRIX
          </span>
          <h3 className="text-sm sm:text-base font-extrabold text-[#0B1F3A]">
            {keyword ? `Target: "${keyword}"` : 'Awaiting Active Keyword Scan'}
          </h3>
        </div>
        <span
          className={`font-mono text-[10px] px-2 py-0.5 rounded border font-bold ${
            isVerifiedScan
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-slate-100 text-slate-600 border-[#DCE5EF]'
          }`}
        >
          {isVerifiedScan ? 'VERIFIED SCAN' : 'UNSCANNED BASELINE'}
        </span>
      </div>

      {/* Grid Canvas */}
      <div className="max-w-[420px] mx-auto">
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 aspect-square w-full">
          {nodes.map((node) => {
            const isCenter = node.gridRow === 3 && node.gridCol === 3;
            const isSelected = selectedNode?.id === node.id;

            return (
              <button
                key={node.id}
                type="button"
                onClick={() => setSelectedNode(node)}
                aria-label={`Grid node row ${node.gridRow}, col ${node.gridCol}, rank ${
                  node.rank || 'none'
                }`}
                className={`w-full aspect-square min-h-[44px] min-w-[44px] rounded-lg sm:rounded-xl border flex flex-col items-center justify-center transition-all ${getNodeColor(
                  node.rank
                )} ${
                  isSelected ? 'ring-2 ring-[#0B1F3A] scale-105 shadow-md' : 'hover:opacity-90'
                } ${isCenter ? 'ring-2 ring-[#D99614]' : ''}`}
              >
                <span className="text-xs sm:text-sm font-extrabold">
                  {isVerifiedScan && node.rank ? `#${node.rank}` : '—'}
                </span>
                {isCenter && (
                  <span className="text-[8px] font-bold uppercase tracking-tight text-[#D99614] hidden sm:block">
                    Center
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-[#DCE5EF] text-[11px] text-slate-600 flex flex-col sm:flex-row justify-between gap-1">
        <span className="truncate">
          Center: {centerAddress || 'Primary address unconfigured'}
        </span>
        <span className="font-mono text-slate-500 shrink-0">
          {scanTimestamp ? `Scanned: ${scanTimestamp}` : 'No verified scan recorded'}
        </span>
      </div>

      {/* Mobile Touch Bottom-Sheet Node Details Modal */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 bg-[#0B1F3A]/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white border border-[#DCE5EF] rounded-t-2xl sm:rounded-2xl max-w-sm w-full p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#DCE5EF] pb-2">
              <h4 className="text-sm font-bold text-[#0B1F3A]">
                Node Inspector [{selectedNode.gridRow}, {selectedNode.gridCol}]
              </h4>
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>
            <div className="text-xs space-y-1.5">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Client:</span>
                <span className="font-bold text-[#0B1F3A]">{clientName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Local Map Rank:</span>
                <span className="font-mono font-bold text-[#0B1F3A]">
                  {isVerifiedScan && selectedNode.rank ? `#${selectedNode.rank}` : 'Not Scanned'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Node Status:</span>
                <span className="font-bold text-slate-700">
                  {selectedNode.gridRow === 3 && selectedNode.gridCol === 3
                    ? 'Primary Center Anchor'
                    : 'Territory Perimeter Point'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedNode(null)}
              className="w-full py-2 bg-[#0B1F3A] text-white font-bold text-xs rounded-lg mt-2"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
