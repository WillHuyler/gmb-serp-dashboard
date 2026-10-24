'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useClient } from '../../lib/client-context';
import MobileNavDrawer from './MobileNavDrawer';

export default function ExecutiveTopHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

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
    <>
      <header className="h-16 bg-white border-b border-[#DCE5EF] px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-40 shadow-sm min-w-0">
        {/* Left: Hamburger (Mobile) + Global Client Selector */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Open mobile navigation"
            className="lg:hidden p-2 -ml-1 text-slate-700 hover:text-[#0B1F3A] hover:bg-slate-100 rounded-lg focus:outline-none"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 hidden md:inline">
            Client Account:
          </span>

          {registryState === 'AUTH_LOADING' || registryState === 'CLIENTS_LOADING' ? (
            <div className="h-9 w-36 sm:w-64 rounded-lg bg-slate-100 border border-[#DCE5EF] animate-pulse flex items-center px-3 text-xs text-slate-500 font-medium">
              Loading...
            </div>
          ) : registryState === 'AUTH_REQUIRED' ? (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 rounded-lg px-2.5 py-1">
              <span className="text-xs font-semibold text-amber-900 hidden sm:inline">
                Authentication Required
              </span>
              <Link
                href="/login"
                className="px-2.5 py-1 bg-[#D99614] hover:bg-[#B87D0E] text-[#0B1F3A] font-bold text-xs rounded transition-all"
              >
                Sign In
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0 max-w-[170px] sm:max-w-xs md:max-w-md">
              <select
                aria-label="Select Active Client"
                value={activeClient?.id || ''}
                onChange={handleClientSelect}
                className="bg-[#F4F7FB] hover:bg-slate-100 text-[#0B1F3A] font-bold text-xs border border-[#DCE5EF] rounded-lg px-2.5 sm:px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#D99614] transition-all cursor-pointer truncate w-full"
              >
                {clientRegistry.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.is_certified ? ' (✓ Certified)' : ' (• Uncertified)'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right: Date Picker & Verified User Identity */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Timezone Date Preset Selector */}
          <div className="hidden sm:flex items-center gap-1.5 bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg px-2.5 py-1.5">
            <select
              aria-label="Select Reporting Period"
              value={reportingPeriod.presetId}
              onChange={handlePeriodSelect}
              className="bg-transparent text-xs font-semibold text-[#0B1F3A] focus:outline-none cursor-pointer max-w-[140px] md:max-w-none truncate"
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

          {/* User Badge / Sign Out */}
          {currentUser ? (
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-[#DCE5EF]">
              <div className="w-8 h-8 rounded-full bg-[#0B1F3A] text-white font-bold text-xs flex items-center justify-center uppercase shrink-0">
                {currentUser.email.slice(0, 2)}
              </div>
              <div className="hidden xl:block leading-tight text-left">
                <span className="text-xs font-bold text-[#0B1F3A] block max-w-[140px] truncate">
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
                className="text-xs text-slate-500 hover:text-rose-600 font-semibold p-1"
              >
                <span className="hidden sm:inline">Sign Out</span>
                <span className="sm:hidden">✕</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1.5 bg-[#0B1F3A] hover:bg-[#16325B] text-white font-semibold text-xs rounded-lg transition-all"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Slide-over Mobile Navigation Drawer */}
      <MobileNavDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      />
    </>
  );
}
