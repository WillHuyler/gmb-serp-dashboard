'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useClient } from '../../lib/client-context';
import { isValidIsoDateString } from '../../lib/reporting-period';
import TrustCertificationStrip, {
  DataTrustState,
} from '../../components/design-system/TrustCertificationStrip';

export const dynamic = 'force-dynamic';

const SUPPORTED_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'UTC',
];

function SettingsWorkspaceContent() {
  const {
    activeClient,
    currentUser,
    registryState,
    userTimezone,
    setUserTimezone,
    reportingPeriod,
    setReportingPeriod,
    refreshClients,
  } = useClient();

  // Client metadata editor state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [domain, setDomain] = useState('');
  const [storeCode, setStoreCode] = useState('');
  const [savingClient, setSavingClient] = useState(false);
  const [saveBanner, setSaveBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Custom date range state
  const [customStart, setCustomStart] = useState(reportingPeriod.startDate);
  const [customEnd, setCustomEnd] = useState(reportingPeriod.endDate);

  // Connection & freshness diagnostics state
  const [connectionDiag, setConnectionDiag] = useState<{
    loading: boolean;
    mappedCount: number;
    hasVerifiedTelemetry: boolean;
    accountMappings: any[];
  }>({
    loading: false,
    mappedCount: 0,
    hasVerifiedTelemetry: false,
    accountMappings: [],
  });

  useEffect(() => {
    setName(activeClient?.name || '');
    setAddress(activeClient?.address || '');
    setDomain(activeClient?.domain || '');
    setStoreCode(activeClient?.store_code || '');
    setSaveBanner(null);
  }, [activeClient?.id, activeClient?.name, activeClient?.address, activeClient?.domain, activeClient?.store_code]);

  useEffect(() => {
    setCustomStart(reportingPeriod.startDate);
    setCustomEnd(reportingPeriod.endDate);
  }, [reportingPeriod.startDate, reportingPeriod.endDate]);

  useEffect(() => {
    if (!activeClient?.id) {
      setConnectionDiag({
        loading: false,
        mappedCount: 0,
        hasVerifiedTelemetry: false,
        accountMappings: [],
      });
      return;
    }

    let cancelled = false;
    async function loadDiagnostics() {
      setConnectionDiag((prev) => ({ ...prev, loading: true }));
      try {
        const res = await fetch(`/api/clients/${activeClient!.id}/connections`, {
          credentials: 'include',
          headers: { 'Cache-Control': 'no-cache' },
        });
        const data = await res.json();
        if (!cancelled && res.ok && data.success) {
          setConnectionDiag({
            loading: false,
            mappedCount: Array.isArray(data.accountMappings)
              ? data.accountMappings.length
              : 0,
            hasVerifiedTelemetry: Boolean(data.hasVerifiedTelemetry),
            accountMappings: Array.isArray(data.accountMappings)
              ? data.accountMappings
              : [],
          });
        } else if (!cancelled) {
          setConnectionDiag({
            loading: false,
            mappedCount: 0,
            hasVerifiedTelemetry: false,
            accountMappings: [],
          });
        }
      } catch {
        if (!cancelled) {
          setConnectionDiag({
            loading: false,
            mappedCount: 0,
            hasVerifiedTelemetry: false,
            accountMappings: [],
          });
        }
      }
    }

    loadDiagnostics();
    return () => {
      cancelled = true;
    };
  }, [activeClient?.id]);

  const handleSaveClientDefaults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClient?.id) return;

    setSavingClient(true);
    setSaveBanner(null);

    try {
      const res = await fetch(`/api/clients/${activeClient.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim() || null,
          domain: domain.trim() || null,
          store_code: storeCode.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setSaveBanner({
          type: 'error',
          text: data?.error?.message || 'Failed to update client defaults.',
        });
      } else {
        setSaveBanner({
          type: 'success',
          text: 'Client profile defaults saved to public.clients.',
        });
        await refreshClients();
      }
    } catch (err: any) {
      setSaveBanner({
        type: 'error',
        text: err?.message || 'Network error saving client defaults.',
      });
    } finally {
      setSavingClient(false);
    }
  };

  const handleApplyCustomDates = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidIsoDateString(customStart) || !isValidIsoDateString(customEnd)) {
      setSaveBanner({
        type: 'error',
        text: 'Please provide valid YYYY-MM-DD start and end dates.',
      });
      return;
    }
    if (customStart > customEnd) {
      setSaveBanner({
        type: 'error',
        text: 'Start date must be on or before end date.',
      });
      return;
    }
    setReportingPeriod({
      presetId: 'CUSTOM',
      startDate: customStart,
      endDate: customEnd,
      presetLabel: `${customStart} → ${customEnd}`,
      timezone: userTimezone,
    });
    setSaveBanner({
      type: 'success',
      text: `Global reporting period updated to ${customStart} → ${customEnd} (${userTimezone}).`,
    });
  };

  const isCertified = Boolean(activeClient?.is_certified);
  const trustState: DataTrustState = connectionDiag.loading
    ? 'SECTION_LOADING'
    : isCertified
    ? 'CERTIFIED_LIVE'
    : connectionDiag.mappedCount > 0
    ? 'MAPPED_PENDING_SYNC'
    : 'UNMAPPED_SETUP';

  return (
    <div className="flex-1 flex flex-col bg-[#F4F7FB] text-[#0B1F3A]">
      <TrustCertificationStrip
        client={activeClient}
        trustState={trustState}
        lastIngestedAt={activeClient?.last_sync_at}
        recordCount={connectionDiag.mappedCount}
        reportingPeriod={reportingPeriod}
      />

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6 font-sans">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-[#DCE5EF] rounded-xl p-6 shadow-sm">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#D99614] font-bold block">
              PLATFORM ADMINISTRATION, TENANT GOVERNANCE & PROVENANCE DIAGNOSTICS
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0B1F3A] mt-1">
              Settings & Governance — {activeClient?.name || 'Workspace Configuration'}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Manage agency tenant membership, client defaults, timezone reporting windows,certification history, and RLS security posture.
            </p>
          </div>

          {activeClient && (
            <div className="flex items-center gap-3">
              <Link
                href={`/connection-center?clientId=${encodeURIComponent(activeClient.id)}`}
                className="px-4 py-2 bg-[#0B1F3A] hover:bg-[#16325B] text-white rounded-lg text-xs font-bold shadow-sm"
              >
                Open Connection Center →
              </Link>
            </div>
          )}
        </div>

        {registryState === 'AUTH_REQUIRED' && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 flex items-center justify-between gap-4 shadow-sm">
            <div>
              <h2 className="text-sm font-bold text-amber-900">
                Authentication Required
              </h2>
              <p className="text-xs text-amber-800 mt-0.5">
                Sign in with your administrator credentials to view tenant settings and modify client configuration.
              </p>
            </div>
            <Link
              href="/login"
              className="px-4 py-2 bg-[#0B1F3A] text-white font-bold text-xs rounded-lg"
            >
              Sign In →
            </Link>
          </div>
        )}

        {saveBanner && (
          <div
            className={`p-4 rounded-xl border text-xs font-semibold ${
              saveBanner.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-rose-50 border-rose-300 text-rose-800'
            }`}
          >
            {saveBanner.text}
          </div>
        )}

        {/* Row 1: Agency & Tenant Profile + Authenticated Users & Roles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Agency & Tenant Profile */}
          <div className="bg-white border border-[#DCE5EF] rounded-xl p-6 space-y-4 shadow-sm">
            <div className="border-b border-[#DCE5EF] pb-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase text-[#D99614] font-bold block">
                  1. AGENCY & TENANT PROFILE
                </span>
                <h2 className="text-base font-bold text-[#0B1F3A]">
                  Multi-Tenant Isolation Scope
                </h2>
              </div>
              <span className="font-mono text-[10px] px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                RLS ENFORCED
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Active Client Tenant ID:</span>
                <span className="font-mono font-bold text-[#0B1F3A]">
                  {activeClient?.tenant_id || 'No Client Selected'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Organization ID:</span>
                <span className="font-mono text-slate-700">
                  {activeClient?.organization_id || 'Default Tenant Scope'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500 font-medium">Authorized Tenant Memberships:</span>
                <span className="font-mono font-bold text-[#0B1F3A]">
                  {currentUser?.authorizedTenantIds?.length ?? 0} Active Tenant(s)
                </span>
              </div>
            </div>
          </div>

          {/* 2. Authenticated Users & Roles */}
          <div className="bg-white border border-[#DCE5EF] rounded-xl p-6 space-y-4 shadow-sm">
            <div className="border-b border-[#DCE5EF] pb-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase text-[#D99614] font-bold block">
                  2. AUTHENTICATED IDENTITY & ROLE
                </span>
                <h2 className="text-base font-bold text-[#0B1F3A]">
                  Active Session & RBAC Standing
                </h2>
              </div>
              <span className="font-mono text-[10px] px-2.5 py-0.5 rounded bg-[#F4F7FB] text-[#0B1F3A] border border-[#DCE5EF] font-bold">
                SUPABASE AUTH
              </span>
            </div>

            {currentUser ? (
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Authenticated Email:</span>
                  <span className="font-bold text-[#0B1F3A]">{currentUser.email}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">User UUID:</span>
                  <span className="font-mono text-slate-700">{currentUser.id}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500 font-medium">Verified Role:</span>
                  <span className="font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                    {currentUser.role}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                No active authenticated user session. Sign in at <Link href="/login" className="text-[#D99614] font-bold underline">/login</Link>.
              </p>
            )}
          </div>
        </div>

        {/* Row 2: Client Defaults Editor + Timezone & Reporting Preferences */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 3. Client Defaults & Metadata */}
          <div className="bg-white border border-[#DCE5EF] rounded-xl p-6 space-y-4 shadow-sm">
            <div className="border-b border-[#DCE5EF] pb-3">
              <span className="text-[11px] uppercase text-[#D99614] font-bold block">
                3. CLIENT DEFAULTS & METADATA (PUBLIC.CLIENTS)
              </span>
              <h2 className="text-base font-bold text-[#0B1F3A]">
                {activeClient ? `Edit ${activeClient.name}` : 'Select a Client to Edit'}
              </h2>
            </div>

            <form onSubmit={handleSaveClientDefaults} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#0B1F3A] mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  disabled={!activeClient}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg px-3.5 py-2 text-sm text-[#0B1F3A] font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0B1F3A] mb-1">
                  Primary Street Address (5×5 Geo-Grid Center Anchor)
                </label>
                <input
                  type="text"
                  disabled={!activeClient}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg px-3.5 py-2 text-sm text-[#0B1F3A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#0B1F3A] mb-1">
                    Primary Website Domain
                  </label>
                  <input
                    type="text"
                    disabled={!activeClient}
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg px-3.5 py-2 text-sm text-[#0B1F3A] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#0B1F3A] mb-1">
                    GBP Store Code
                  </label>
                  <input
                    type="text"
                    disabled={!activeClient}
                    value={storeCode}
                    onChange={(e) => setStoreCode(e.target.value)}
                    className="w-full bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg px-3.5 py-2 text-sm text-[#0B1F3A] font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={!activeClient || savingClient}
                  className="px-4 py-2 bg-[#D99614] hover:bg-[#B87D0E] disabled:opacity-50 text-[#0B1F3A] font-bold rounded-lg text-xs shadow-sm"
                >
                  {savingClient ? 'Saving to Supabase...' : 'Save Client Defaults'}
                </button>
              </div>
            </form>
          </div>

          {/* 9. Reporting Period & Timezone Preferences */}
          <div className="bg-white border border-[#DCE5EF] rounded-xl p-6 space-y-4 shadow-sm">
            <div className="border-b border-[#DCE5EF] pb-3">
              <span className="text-[11px] uppercase text-[#D99614] font-bold block">
                4. TIMEZONE & REPORTING PERIOD PREFERENCES
              </span>
              <h2 className="text-base font-bold text-[#0B1F3A]">
                Dynamic Date Calculation & Custom Window
              </h2>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#0B1F3A] mb-1">
                  Reporting Timezone (Calculates Dynamic Presets)
                </label>
                <select
                  value={userTimezone}
                  onChange={(e) => setUserTimezone(e.target.value)}
                  className="w-full bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg px-3.5 py-2 text-sm text-[#0B1F3A] font-semibold"
                >
                  {SUPPORTED_TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>

              <form onSubmit={handleApplyCustomDates} className="space-y-3 pt-2 border-t border-[#DCE5EF]">
                <span className="font-bold text-[#0B1F3A] block">
                  Apply Custom Reporting Date Range
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">Start Date (YYYY-MM-DD)</label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg px-3 py-2 font-mono text-xs text-[#0B1F3A]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">End Date (YYYY-MM-DD)</label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg px-3 py-2 font-mono text-xs text-[#0B1F3A]"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0B1F3A] hover:bg-[#16325B] text-white font-bold rounded-lg text-xs"
                  >
                    Apply Custom Window
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Row 3: Service-Area Configuration, Provider Connections, Data Freshness & Security Audit */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Service-Area & Geo-Grid Config */}
          <div className="bg-white border border-[#DCE5EF] rounded-xl p-6 space-y-3 shadow-sm">
            <span className="text-[11px] uppercase text-[#D99614] font-bold block">
              5. SERVICE-AREA CONFIGURATION
            </span>
            <h3 className="text-base font-bold text-[#0B1F3A]">
              5×5 Geo-Grid Territory Scope
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Center Anchor:{' '}
              <strong className="text-[#0B1F3A]">
                {activeClient?.address || 'Unconfigured — set primary street address above'}
              </strong>
            </p>
            <div className="p-3 rounded-lg bg-[#F4F7FB] border border-[#DCE5EF] text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Grid Matrix Topology:</span>
                <strong className="font-mono text-[#0B1F3A]">5 × 5 (25 Nodes)</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Configured Service Areas:</span>
                <strong className="font-mono text-[#0B1F3A]">
                  {activeClient?.service_areas?.length
                    ? activeClient.service_areas.join(', ')
                    : 'Awaiting Verified Scan'}
                </strong>
              </div>
            </div>
          </div>

          {/* Data Freshness & Certification Diagnostics */}
          <div className="bg-white border border-[#DCE5EF] rounded-xl p-6 space-y-3 shadow-sm">
            <span className="text-[11px] uppercase text-[#D99614] font-bold block">
              6. PROVENANCE & FRESHNESS DIAGNOSTICS
            </span>
            <h3 className="text-base font-bold text-[#0B1F3A]">
              Certification & Ingestion Status
            </h3>
            <div className="p-3 rounded-lg bg-[#F4F7FB] border border-[#DCE5EF] text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">DB Certification Status:</span>
                <strong className="font-mono text-[#0B1F3A]">
                  {activeClient?.data_certification_status || 'UNCERTIFIED'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Confirmed Account Mappings:</span>
                <strong className="font-mono text-[#0B1F3A]">
                  {connectionDiag.mappedCount}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Verified Telemetry Rows:</span>
                <strong className="font-mono text-[#0B1F3A]">
                  {connectionDiag.hasVerifiedTelemetry ? 'PRESENT' : '0 ROWS'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Last Sync Timestamp:</span>
                <strong className="font-mono text-[#0B1F3A]">
                  {activeClient?.last_sync_at || 'None Recorded'}
                </strong>
              </div>
            </div>
          </div>

          {/* Security & RLS Audit Information */}
          <div className="bg-white border border-[#DCE5EF] rounded-xl p-6 space-y-3 shadow-sm">
            <span className="text-[11px] uppercase text-[#D99614] font-bold block">
              7. SECURITY & RLS AUDIT POSTURE
            </span>
            <h3 className="text-base font-bold text-[#0B1F3A]">
              Database Access Controls
            </h3>
            <div className="p-3 rounded-lg bg-[#F4F7FB] border border-[#DCE5EF] text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Tenant RLS Policy:</span>
                <strong className="font-mono text-emerald-700">strict_tenant_*</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Client Telemetry Policy:</span>
                <strong className="font-mono text-emerald-700">strict_client_*</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Anonymous Grant Access:</span>
                <strong className="font-mono text-emerald-700">REVOKED</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Certification Trigger:</span>
                <strong className="font-mono text-[#0B1F3A]">
                  trg_enforce_client_certification
                </strong>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-500">Loading Settings...</div>}>
      <SettingsWorkspaceContent />
    </Suspense>
  );
}
