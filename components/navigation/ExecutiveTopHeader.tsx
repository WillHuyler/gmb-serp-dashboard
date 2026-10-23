'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useClient } from '../../lib/client-context';

export default function ExecutiveTopHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    activeClient,
    setActiveClient,
    clientRegistry,
    registryState,
    currentUser,
    reportingPeriod,
    reportingPresets,
    setReportingPeriod,
    refreshClients,
    signOutCleanly,
  } = useClient();

  if (pathname === '/login') {
    return null;
  }

  const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chosenId = e.target.value;
    const found = clientRegistry.find((c) => c.id === chosenId) || null;
    if (found) {
      setActiveClient(found);
      const url = new URL(window.location.href);
      url.searchParams.set('clientId', found.id);
      url.searchParams.set('startDate', reportingPeriod.startDate);
      url.searchParams.set('endDate', reportingPeriod.endDate);
      router.push(`${url.pathname}?${url.searchParams.toString()}`);
    }
  };

  const handlePeriodSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetId = e.target.value;
    const chosen = reportingPresets.find((p) => p.presetId === presetId);
    if (chosen) {
      setReportingPeriod(chosen);
      const url = new URL(window.location.href);
      if (activeClient?.id) {
        url.searchParams.set('clientId', activeClient.id);
      }
      url.searchParams.set('startDate', chosen.startDate);
      url.searchParams.set('endDate', chosen.endDate);
      router.push(`${url.pathname}?${url.searchParams.toString()}`);
    }
  };

  const handleSignOut = async () => {
    await signOutCleanly();
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-[#DCE5EF] px-6 flex items-center justify-between gap-4 sticky top-0 z-40 shadow-sm">
      {/* Left: Global Authorized Client Selector (Distinct States, Zero Leaked Counts) */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 hidden sm:inline">
          Client Account:
        </span>

        {registryState === 'AUTH_LOADING' || registryState === 'CLIENTS_LOADING' ? (
          <div className="h-9 w-64 rounded-lg bg-slate-100 border border-[#DCE5EF] animate-pulse flex items-center px-3 text-xs text-slate-500 font-medium">
            {registryState === 'AUTH_LOADING'
              ? 'Verifying session...'
              : 'Loading authorized client registry...'}
          </div>
        ) : registryState === 'AUTH_REQUIRED' ? (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 rounded-lg px-3 py-1.5">
            <span className="text-xs font-semibold text-amber-900">
              Authentication Required
            </span>
            <Link
              href="/login"
              className="px-2.5 py-1 bg-[#D99614] hover:bg-[#B87D0E] text-[#0B1F3A] font-bold text-xs rounded transition-all"
            >
              Sign In →
            </Link>
          </div>
        ) : registryState === 'FORBIDDEN' ? (
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-lg px-3 py-1.5">
            <span className="text-xs font-semibold text-rose-700">
              Tenant Access Restricted (403)
            </span>
          </div>
        ) : registryState === 'QUERY_FAILED' ? (
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-lg px-3 py-1.5">
            <span className="text-xs font-semibold text-rose-700">
              Client Registry Query Failed
            </span>
            <button
              type="button"
              onClick={() => refreshClients()}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-rose-300 text-rose-700 font-semibold text-xs rounded"
            >
              Retry
            </button>
          </div>
        ) : registryState === 'NO_CLIENTS_ASSIGNED' ? (
          <div className="flex items-center gap-2 bg-slate-100 border border-[#DCE5EF] rounded-lg px-3 py-1.5">
            <span className="text-xs font-medium text-slate-600">
              No Clients Assigned
            </span>
            <Link
              href="/clients"
              className="text-xs font-bold text-[#D99614] hover:underline"
            >
              + Add Client
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <select
              aria-label="Select Active Client"
              value={activeClient?.id || ''}
              onChange={handleClientSelect}
              className="bg-[#F4F7FB] hover:bg-slate-100 text-[#0B1F3A] font-bold text-xs border border-[#DCE5EF] rounded-lg px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#D99614] transition-all cursor-pointer"
            >
              {clientRegistry.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.is_certified ? ' (✓ Certified)' : ' (• Setup / Uncertified)'}
                </option>
              ))}
            </select>
            <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 text-slate-600 border border-[#DCE5EF]">
              {clientRegistry.length} Authorized
            </span>
          </div>
        )}
      </div>

      {/* Right: Calculated Reporting Period Selector & Verified User Identity */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-2 bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg px-3 py-1.5">
          <svg
            className="w-4 h-4 text-[#D99614] shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <select
            aria-label="Select Reporting Period"
            value={reportingPeriod.presetId}
            onChange={handlePeriodSelect}
            className="bg-transparent text-xs font-semibold text-[#0B1F3A] focus:outline-none cursor-pointer"
          >
            {reportingPresets.map((preset) => (
              <option key={preset.presetId} value={preset.presetId}>
                {preset.presetLabel}
              </option>
            ))}
            {reportingPeriod.presetId === 'CUSTOM' && (
              <option value="CUSTOM">{reportingPeriod.presetLabel}</option>
            )}
          </select>
        </div>

        {/* Verified User Identity */}
        {currentUser ? (
          <div className="flex items-center gap-3 pl-3 border-l border-[#DCE5EF]">
            <div className="w-8 h-8 rounded-full bg-[#0B1F3A] text-white font-bold text-xs flex items-center justify-center uppercase">
              {currentUser.email.slice(0, 2)}
            </div>
            <div className="hidden md:block leading-tight text-left">
              <span className="text-xs font-bold text-[#0B1F3A] block max-w-[160px] truncate">
                {currentUser.email}
              </span>
              <span className="text-[10px] font-mono uppercase text-slate-500 block">
                {currentUser.role.replace(/_/g, ' ')}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              title="Sign Out"
              className="text-xs text-slate-500 hover:text-rose-600 font-semibold ml-1"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="px-3.5 py-2 bg-[#0B1F3A] hover:bg-[#16325B] text-white font-semibold text-xs rounded-lg transition-all"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
