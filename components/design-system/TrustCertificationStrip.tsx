'use client';

import React from 'react';
import Link from 'next/link';
import { ClientProfile, useClient } from '../../lib/client-context';

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
  const { registryState, reportingPeriod: globalPeriod } = useClient();
  const activeWindow = reportingPeriod || globalPeriod;

  const mappedCount =
    client?.mapped_resource_count ??
    Object.values(client?.mappings || {}).filter(Boolean).length;

  const badgeConfig: Record<
    DataTrustState,
    { label: string; classes: string; dotColor: string }
  > = {
    CERTIFIED_LIVE: {
      label: 'CERTIFIED TELEMETRY',
      classes: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      dotColor: 'bg-emerald-500',
    },
    HISTORICAL_STALE: {
      label: 'HISTORICAL / STALE',
      classes: 'bg-amber-50 text-amber-800 border-amber-300',
      dotColor: 'bg-amber-500',
    },
    MAPPED_PENDING_SYNC: {
      label: 'MAPPED · AWAITING INGESTION',
      classes: 'bg-sky-50 text-sky-800 border-sky-300',
      dotColor: 'bg-sky-500',
    },
    UNMAPPED_SETUP: {
      label: 'UNMAPPED · SETUP REQUIRED',
      classes: 'bg-amber-50 text-amber-800 border-amber-300',
      dotColor: 'bg-amber-500',
    },
    SECTION_LOADING: {
      label: 'VERIFYING PROVENANCE...',
      classes: 'bg-slate-100 text-slate-700 border-slate-300',
      dotColor: 'bg-slate-400 animate-pulse',
    },
    PROVIDER_ERROR: {
      label: 'TELEMETRY DEGRADED',
      classes: 'bg-rose-50 text-rose-800 border-rose-300',
      dotColor: 'bg-rose-500',
    },
  };

  const activeBadge = badgeConfig[trustState];

  return (
    <div className="w-full bg-white border-b border-[#DCE5EF] px-6 py-2.5 text-xs font-sans">
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Provenance Status & Client Scope */}
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${activeBadge.classes}`}
          >
            <span className={`w-2 h-2 rounded-full ${activeBadge.dotColor}`} />
            {activeBadge.label}
          </span>

          <span className="text-slate-300">|</span>

          <div className="flex items-center gap-1.5 text-[#0B1F3A]">
            <span className="text-slate-500 uppercase font-semibold text-[11px]">
              Client:
            </span>
            <strong className="text-[#0B1F3A] font-bold">
              {client?.name ||
                (registryState === 'AUTH_REQUIRED'
                  ? 'Sign In Required'
                  : 'Select an Authorized Client')}
            </strong>
            {client?.store_code && (
              <span className="font-mono text-[11px] text-slate-600 bg-[#F4F7FB] px-2 py-0.5 rounded border border-[#DCE5EF]">
                Store #{client.store_code}
              </span>
            )}
          </div>

          <span className="text-slate-300 hidden sm:inline">|</span>

          <div className="hidden sm:flex items-center gap-1.5 text-slate-600">
            <span className="text-slate-500 uppercase font-semibold text-[11px]">
              Provenance:
            </span>
            <span className="font-semibold text-[#0B1F3A]">
              {mappedCount} Mapped {mappedCount === 1 ? 'Source' : 'Sources'}
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-semibold text-[#0B1F3A]">
              {recordCount} Verified {recordCount === 1 ? 'Record' : 'Records'}
            </span>
          </div>
        </div>

        {/* Right: Reporting Window, Freshness & Governance Link */}
        <div className="flex items-center gap-4">
          {activeWindow && (
            <div className="hidden md:flex items-center gap-1.5 text-slate-600">
              <span className="uppercase font-semibold text-[11px] text-slate-500">
                Window:
              </span>
              <span className="font-mono text-[11px] text-[#0B1F3A] font-semibold">
                {activeWindow.startDate} → {activeWindow.endDate}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="uppercase font-semibold text-[11px] text-slate-500">
              Freshness:
            </span>
            <span className="font-mono text-[11px] text-[#0B1F3A] font-semibold">
              {lastIngestedAt
                ? new Date(lastIngestedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Awaiting Sync'}
            </span>
          </div>

          {client && (
            <Link
              href={`/connection-center?clientId=${encodeURIComponent(client.id)}`}
              className="text-xs text-[#D99614] hover:text-[#B87D0E] font-bold hover:underline"
            >
              Manage Mappings →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
