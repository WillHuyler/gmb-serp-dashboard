'use client';

import React from 'react';
import Link from 'next/link';
import { ClientProfile } from '../../lib/client-context';

export type DataTrustState =
  | 'CERTIFIED_LIVE'
  | 'HISTORICAL_STALE'
  | 'MAPPED_PENDING_SYNC'
  | 'UNMAPPED_SETUP'
  | 'SECTION_LOADING'
  | 'PROVIDER_ERROR';

interface TrustCertificationStripProps {
  client: ClientProfile | null;
  trustState: DataTrustState;
  lastIngestedAt?: string | null;
  recordCount?: number;
  reportingPeriod?: { startDate: string; endDate: string };
}

export default function TrustCertificationStrip({
  client,
  trustState,
  lastIngestedAt,
  recordCount = 0,
  reportingPeriod,
}: TrustCertificationStripProps) {
  const mappedCount =
    client?.mapped_resource_count ??
    Object.values(client?.mappings || {}).filter(Boolean).length;

  const badgeConfig: Record<
    DataTrustState,
    { label: string; classes: string; dotColor: string }
  > = {
    CERTIFIED_LIVE: {
      label: 'CERTIFIED TELEMETRY',
      classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      dotColor: 'bg-emerald-400',
    },
    HISTORICAL_STALE: {
      label: 'HISTORICAL / STALE',
      classes: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      dotColor: 'bg-amber-400',
    },
    MAPPED_PENDING_SYNC: {
      label: 'MAPPED · AWAITING INGESTION',
      classes: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
      dotColor: 'bg-sky-400',
    },
    UNMAPPED_SETUP: {
      label: 'UNMAPPED · SETUP REQUIRED',
      classes: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      dotColor: 'bg-amber-400',
    },
    SECTION_LOADING: {
      label: 'VERIFYING PROVENANCE...',
      classes: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
      dotColor: 'bg-slate-400 animate-pulse',
    },
    PROVIDER_ERROR: {
      label: 'TELEMETRY DEGRADED',
      classes: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      dotColor: 'bg-rose-400',
    },
  };

  const activeBadge = badgeConfig[trustState];

  return (
    <div className="w-full bg-[#111622] border-b border-[#A9C7E5]/12 px-6 py-2.5 text-xs font-sans">
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Provenance Status & Client Scope */}
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 font-mono text-[11px] font-semibold px-2.5 py-0.5 rounded border ${activeBadge.classes}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${activeBadge.dotColor}`} />
            {activeBadge.label}
          </span>

          <span className="text-slate-600">|</span>

          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-500 uppercase font-mono text-[10px]">CLIENT:</span>
            <strong className="text-white font-semibold">
              {client?.name || 'No Client Selected'}
            </strong>
            {client?.store_code && (
              <span className="font-mono text-[11px] text-slate-400 bg-[#151D2A] px-1.5 py-0.5 rounded border border-[#A9C7E5]/10">
                #{client.store_code}
              </span>
            )}
          </div>

          <span className="text-slate-600 hidden sm:inline">|</span>

          <div className="hidden sm:flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-500 uppercase font-mono text-[10px]">PROVENANCE:</span>
            <span className="font-mono text-[11px] text-slate-200">
              {mappedCount} Mapped {mappedCount === 1 ? 'Source' : 'Sources'}
            </span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-[11px] text-slate-200">
              {recordCount} Verified {recordCount === 1 ? 'Record' : 'Records'}
            </span>
          </div>
        </div>

        {/* Right: Freshness & Governance Link */}
        <div className="flex items-center gap-4">
          {reportingPeriod && (
            <div className="hidden md:flex items-center gap-1.5 text-slate-400">
              <span className="uppercase font-mono text-[10px] text-slate-500">WINDOW:</span>
              <span className="font-mono text-[11px] text-slate-200">
                {reportingPeriod.startDate} → {reportingPeriod.endDate}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="uppercase font-mono text-[10px] text-slate-500">FRESHNESS:</span>
            <span className="font-mono text-[11px] text-slate-200">
              {lastIngestedAt
                ? new Date(lastIngestedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'No Verified Ingestion'}
            </span>
          </div>

          {client && (
            <Link
              href={`/connection-center?clientId=${client.id}`}
              className="font-mono text-[11px] text-[#D99614] hover:underline font-semibold"
            >
              Manage Mappings →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
