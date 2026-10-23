'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useClient } from '../../lib/client-context';
import GlobalHeader from '../../components/navigation/GlobalHeader';
import TrustCertificationStrip, {
  DataTrustState,
} from '../../components/design-system/TrustCertificationStrip';
import TriPartInsightCard from '../../components/design-system/TriPartInsightCard';

export const dynamic = 'force-dynamic';

interface ExternalAccountItem {
  id: string;
  provider: string;
  external_account_id: string;
  descriptive_name: string;
  account_type?: string;
  status?: string;
}

interface JoinedMappingItem {
  id: string;
  client_id: string;
  external_account_id: string;
  mapping_role: string;
  is_confirmed: boolean;
  external_account?: ExternalAccountItem | null;
}

const SUPPORTED_PROVIDERS = [
  { key: 'GBP', label: 'Google Business Profile', mappingKey: 'gmb_location_id', badge: 'LOCAL PACK' },
  { key: 'GOOGLE_ADS', label: 'Google Ads (Paid Search)', mappingKey: 'google_ads_id', badge: 'PAID MEDIA' },
  { key: 'META_ADS', label: 'Meta Ads (Paid Social)', mappingKey: 'meta_act_id', badge: 'PAID SOCIAL' },
  { key: 'GA4', label: 'Google Analytics 4', mappingKey: 'ga4_property_id', badge: 'ATTRIBUTION' },
  { key: 'GSC', label: 'Google Search Console', mappingKey: 'gsc_site_url', badge: 'ORGANIC SERP' },
  { key: 'BRIGHTLOCAL', label: 'BrightLocal / SerpAPI Grid', mappingKey: 'brightlocal_location_id', badge: '5×5 GEO-GRID' },
];

function ConnectionCenterContent() {
  const { activeClient, refreshClients, isLoading: clientLoading } = useClient();

  const [mappings, setMappings] = useState<JoinedMappingItem[]>([]);
  const [hasVerifiedTelemetry, setHasVerifiedTelemetry] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [mappingBusyId, setMappingBusyId] = useState<string | null>(null);

  // Manual / Discovered Resource Binding Form
  const [selectedAcId, setSelectedAcId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('PRIMARY_MARKETING');

  const loadClientConnections = useCallback(async () => {
    if (!activeClient?.id) {
      setMappings([]);
      setHasVerifiedTelemetry(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${activeClient.id}/connections`, {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMappings(Array.isArray(data.accountMappings) ? data.accountMappings : []);
        setHasVerifiedTelemetry(Boolean(data.hasVerifiedTelemetry));
      } else {
        setMappings([]);
        setHasVerifiedTelemetry(false);
      }
    } catch {
      setMappings([]);
      setHasVerifiedTelemetry(false);
    } finally {
      setLoading(false);
    }
  }, [activeClient?.id]);

  useEffect(() => {
    loadClientConnections();
  }, [loadClientConnections]);

  const handleBindExternalAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClient?.id || !selectedAcId.trim()) return;

    setMappingBusyId(selectedAcId);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/data/mappings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: activeClient.id,
          external_account_id: selectedAcId.trim(),
          mapping_role: selectedRole,
          include_in_command_center: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatusMessage({
          type: 'error',
          text: data?.error?.message || 'Failed to persist account mapping.',
        });
      } else {
        setStatusMessage({
          type: 'success',
          text: `Resource mapped (${data.certificationStatus || 'MAPPED_PENDING_INGESTION'}). Client remains uncertified until verified telemetry ingestion completes.`,
        });
        setSelectedAcId('');
        await loadClientConnections();
        await refreshClients();
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Network error while saving mapping.',
      });
    } finally {
      setMappingBusyId(null);
    }
  };

  const isCertified = Boolean(activeClient?.is_certified && hasVerifiedTelemetry && mappings.length > 0);
  const trustState: DataTrustState = loading
    ? 'SECTION_LOADING'
    : isCertified
    ? 'CERTIFIED_LIVE'
    : mappings.length > 0
    ? 'MAPPED_PENDING_SYNC'
    : 'UNMAPPED_SETUP';

  const certificationChecks = [
    { label: '1. Tenant & Client Ownership Verified', passed: Boolean(activeClient?.id && activeClient?.tenant_id) },
    { label: '2. Explicit Provider Resource Mapped', passed: mappings.length > 0 },
    { label: '3. Blue-Badge GBP / Store Code Assigned', passed: Boolean(activeClient?.store_code || activeClient?.mappings?.gmb_location_id) },
    { label: '4. Verified Telemetry Ingested in Supabase', passed: hasVerifiedTelemetry },
    { label: '5. Certification Gate Passed', passed: isCertified },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <TrustCertificationStrip
        client={activeClient}
        trustState={trustState}
        recordCount={mappings.length}
      />

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6 text-white font-sans">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#111622] border border-[#A9C7E5]/15 rounded-xl p-6">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-[#D99614] font-bold block">
              INTEGRATION GOVERNANCE & RESOURCE MAPPING HUB
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
              Connection Center — {clientLoading ? 'Loading...' : activeClient?.name || 'Select Client'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Discover authorized external accounts, enforce blue-badge GBP verification, and explicitly bind provider resources to {activeClient?.name || 'the selected client'}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadClientConnections()}
              className="px-3.5 py-2 bg-[#151D2A] hover:bg-[#1C273A] border border-[#A9C7E5]/20 rounded-lg text-xs font-semibold text-slate-200 transition-all"
            >
              Refresh Mappings
            </button>
            {activeClient && (
              <Link
                href={`/command-center?clientId=${activeClient.id}`}
                className="px-4 py-2 bg-[#D99614] hover:bg-[#B97A08] text-[#0B0F17] font-semibold text-xs rounded-lg transition-all"
              >
                Open Command Center →
              </Link>
            )}
          </div>
        </div>

        {statusMessage && (
          <div
            className={`p-4 rounded-xl border text-xs font-mono ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Certification Integrity Gate Checklist (CR-003 / CR-015 Phase 2) */}
        <div className="bg-[#111622] border border-[#A9C7E5]/15 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#A9C7E5]/10 pb-3">
            <div>
              <span className="font-mono text-[10px] uppercase text-[#D99614] font-bold block">
                FAIL-CLOSED CERTIFICATION GATE (CR-003 / CR-015)
              </span>
              <h3 className="text-sm font-bold text-white">
                Client Data Certification Requirements
              </h3>
            </div>
            <span className="font-mono text-xs text-slate-400">
              Mapping creation alone never certifies a client.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {certificationChecks.map((chk) => (
              <div
                key={chk.label}
                className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                  chk.passed
                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                    : 'bg-[#151D2A] border-[#A9C7E5]/10 text-slate-400'
                }`}
              >
                <span className="font-medium">{chk.label}</span>
                <span className="font-mono font-bold">{chk.passed ? 'PASS' : 'PENDING'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Provider Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SUPPORTED_PROVIDERS.map((prov) => {
            const matchedMapping = mappings.find(
              (m) =>
                String(m.external_account?.provider || '')
                  .toUpperCase()
                  .includes(prov.key) ||
                (prov.key === 'GBP' &&
                  String(m.external_account?.provider || '').toUpperCase().includes('GMB'))
            );

            const legacyMappedId =
              (activeClient?.mappings as Record<string, string | undefined>)?.[prov.mappingKey] ||
              (prov.key === 'GBP' ? activeClient?.store_code : undefined);

            const effectiveResourceId =
              matchedMapping?.external_account?.external_account_id ||
              matchedMapping?.external_account_id ||
              legacyMappedId ||
              null;

            return (
              <div
                key={prov.key}
                className="bg-[#111622] border border-[#A9C7E5]/12 rounded-xl p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#151D2A] border border-[#A9C7E5]/15 text-[#D99614] font-semibold">
                      {prov.badge}
                    </span>
                    <span
                      className={`font-mono text-[10px] px-2 py-0.5 rounded border font-semibold ${
                        effectiveResourceId && hasVerifiedTelemetry
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : effectiveResourceId
                          ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {effectiveResourceId && hasVerifiedTelemetry
                        ? 'CERTIFIED'
                        : effectiveResourceId
                        ? 'MAPPED · PENDING SYNC'
                        : 'UNMAPPED'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">{prov.label}</h3>
                  <p className="text-xs font-mono text-slate-400">
                    Resource ID: <strong className="text-slate-200">{effectiveResourceId || 'None'}</strong>
                  </p>
                  {matchedMapping?.external_account?.descriptive_name && (
                    <p className="text-xs text-slate-300">
                      Account: {matchedMapping.external_account.descriptive_name}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-[#A9C7E5]/10 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Role: {matchedMapping?.mapping_role || 'PRIMARY_MARKETING'}</span>
                  <span className="text-slate-300">
                    {matchedMapping?.is_confirmed ? '✓ Confirmed' : 'Awaiting Binding'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Explicit Resource Mapping Form (Persists to public.account_mappings) */}
        <div className="bg-[#111622] border border-[#A9C7E5]/15 rounded-xl p-6 space-y-4">
          <div>
            <span className="font-mono text-[10px] uppercase text-[#D99614] font-bold block">
              EXPLICIT RESOURCE MAPPING (public.account_mappings)
            </span>
            <h3 className="text-base font-bold text-white mt-0.5">
              Bind Discovered External Account to {activeClient?.name || 'Active Client'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter a discovered External Account UUID or Provider Account ID from <code className="font-mono text-slate-200">public.external_accounts</code> (e.g., <code className="font-mono text-[#D99614]">842-192-3049</code> or <code className="font-mono text-[#D99614]">act_9482019482</code>).
            </p>
          </div>

          <form onSubmit={handleBindExternalAccount} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-6">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Discovered External Account ID / UUID *
              </label>
              <input
                type="text"
                required
                value={selectedAcId}
                onChange={(e) => setSelectedAcId(e.target.value)}
                placeholder="e.g., 842-192-3049 or 11111111-1111-1111-1111-111111111111"
                className="w-full bg-[#151D2A] border border-[#A9C7E5]/20 rounded-lg px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#D99614]"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Mapping Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full bg-[#151D2A] border border-[#A9C7E5]/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D99614]"
              >
                <option value="PRIMARY_MARKETING">PRIMARY_MARKETING</option>
                <option value="LOCATION">LOCATION</option>
                <option value="SECONDARY_MARKETING">SECONDARY_MARKETING</option>
                <option value="BRAND">BRAND</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={!activeClient || Boolean(mappingBusyId)}
                className="w-full py-2 px-4 bg-[#D99614] hover:bg-[#B97A08] disabled:opacity-50 text-[#0B0F17] font-semibold text-xs rounded-lg transition-all"
              >
                {mappingBusyId ? 'Binding...' : 'Save Mapping'}
              </button>
            </div>
          </form>
        </div>

        {/* Tri-Part Governance Guidance */}
        <TriPartInsightCard
          title="Provider Lineage & Certification Governance"
          category="CONNECTION CENTER"
          confidence={isCertified ? 'HIGH' : 'INSUFFICIENT_DATA'}
          sources={['SUPABASE_ACCOUNT_MAPPINGS', 'EXTERNAL_ACCOUNTS']}
          whatIsHappening={
            mappings.length > 0
              ? `${activeClient?.name} has${mappings.length} confirmed row(s) in public.account_mappings.`
              : `${activeClient?.name || 'This client'} currently has 0 confirmed rows in public.account_mappings.`
          }
          whyItIsHappening={
            isCertified
              ? 'All mapped accounts have completed verified telemetry ingestion.'
              : 'Per CR-003 and CR-015, PorchLight separates account mapping from data certification until real provider records are ingested.'
          }
          whatToDoNext="Bind the client's discovered Google Business Profile, Google Ads, Meta Ads, and BrightLocal resources above, then run an authenticated ingestion sync."
        />
      </main>
    </div>
  );
}

export default function ConnectionCenterPage() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col font-sans">
      <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading Header...</div>}>
        <GlobalHeader />
      </Suspense>
      <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading Connection Center...</div>}>
        <ConnectionCenterContent />
      </Suspense>
    </div>
  );
}
