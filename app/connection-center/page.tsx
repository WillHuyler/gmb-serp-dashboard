'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useClient } from '../../lib/client-context';
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
    <div className="flex-1 flex flex-col bg-[#F4F7FB] text-[#0B1F3A]">
      <TrustCertificationStrip
        client={activeClient}
        trustState={trustState}
        recordCount={mappings.length}
      />

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6 font-sans">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-[#DCE5EF] rounded-xl p-6 shadow-sm">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#D99614] font-bold block">
              INTEGRATION GOVERNANCE & RESOURCE MAPPING WIZARD
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0B1F3A] mt-1">
              Connection Center — {clientLoading ? 'Loading...' : activeClient?.name || 'Select Client'}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Discover authorized external accounts, enforce blue-badge GBP verification, and explicitly bind provider resources to {activeClient?.name || 'the selected client'}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => loadClientConnections()}
              className="px-4 py-2 bg-[#F4F7FB] hover:bg-slate-200 border border-[#DCE5EF] rounded-lg text-xs font-bold text-[#0B1F3A] transition-all"
            >
              Refresh Mappings
            </button>
            {activeClient && (
              <Link
                href={`/command-center?clientId=${activeClient.id}`}
                className="px-4 py-2 bg-[#D99614] hover:bg-[#B87D0E] text-[#0B1F3A] font-bold text-xs rounded-lg transition-all shadow-sm"
              >
                Open Command Center →
              </Link>
            )}
          </div>
        </div>

        {statusMessage && (
          <div
            className={`p-4 rounded-xl border text-xs font-semibold ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-rose-50 border-rose-300 text-rose-800'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Certification Integrity Gate Checklist */}
        <div className="bg-white border border-[#DCE5EF] rounded-xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#DCE5EF] pb-3">
            <div>
              <span className="text-[11px] uppercase text-[#D99614] font-bold block">
                FAIL-CLOSED CERTIFICATION GATE (CR-003 / CR-015)
              </span>
              <h3 className="text-base font-bold text-[#0B1F3A]">
                Client Data Certification Requirements
              </h3>
            </div>
            <span className="text-xs font-medium text-slate-500">
              Mapping creation alone never certifies a client.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {certificationChecks.map((chk) => (
              <div
                key={chk.label}
                className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                  chk.passed
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
                    : 'bg-[#F4F7FB] border-[#DCE5EF] text-slate-600'
                }`}
              >
                <span>{chk.label}</span>
                <span className="font-mono font-bold text-[11px]">
                  {chk.passed ? 'PASS' : 'PENDING'}
                </span>
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
                className="bg-white border border-[#DCE5EF] border-t-4 border-t-[#0B1F3A] rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] px-2.5 py-0.5 rounded bg-[#F4F7FB] border border-[#DCE5EF] text-[#0B1F3A] font-bold">
                      {prov.badge}
                    </span>
                    <span
                      className={`font-mono text-[10px] px-2.5 py-0.5 rounded border font-bold ${
                        effectiveResourceId && hasVerifiedTelemetry
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : effectiveResourceId
                          ? 'bg-sky-50 text-sky-800 border-sky-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {effectiveResourceId && hasVerifiedTelemetry
                        ? 'CERTIFIED'
                        : effectiveResourceId
                        ? 'MAPPED · PENDING SYNC'
                        : 'UNMAPPED'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#0B1F3A]">{prov.label}</h3>
                  <p className="text-xs font-mono text-slate-600">
                    Resource ID:{' '}
                    <strong className="text-[#0B1F3A]">{effectiveResourceId || 'None'}</strong>
                  </p>
                  {matchedMapping?.external_account?.descriptive_name && (
                    <p className="text-xs text-slate-600">
                      Account: {matchedMapping.external_account.descriptive_name}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-[#DCE5EF] flex items-center justify-between text-xs text-slate-500">
                  <span>Role: {matchedMapping?.mapping_role || 'PRIMARY_MARKETING'}</span>
                  <span className="font-semibold text-[#0B1F3A]">
                    {matchedMapping?.is_confirmed ? '✓ Confirmed' : 'Awaiting Binding'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Discovered Account Selection & Binding Wizard */}
        <div className="bg-white border border-[#DCE5EF] rounded-xl p-6 space-y-4 shadow-sm">
          <div>
            <span className="text-[11px] uppercase text-[#D99614] font-bold block">
              DISCOVERED RESOURCE BINDING WIZARD
            </span>
            <h3 className="text-base font-bold text-[#0B1F3A] mt-0.5">
              Bind Authorized External Account to {activeClient?.name || 'Active Client'}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Select a discovered account from <code className="font-mono text-[#0B1F3A]">public.external_accounts</code> or enter a verified provider resource identifier.
            </p>
          </div>

          <form onSubmit={handleBindExternalAccount} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-6">
              <label className="block text-xs font-bold text-[#0B1F3A] mb-1">
                Discovered Provider Resource *
              </label>
              <input
                type="text"
                required
                value={selectedAcId}
                onChange={(e) => setSelectedAcId(e.target.value)}
                placeholder="Select or enter discovered ID (e.g., 842-192-3049 or act_9482019482)"
                className="w-full bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg px-3.5 py-2 text-sm text-[#0B1F3A] font-mono focus:outline-none focus:ring-2 focus:ring-[#D99614]"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-[#0B1F3A] mb-1">
                Mapping Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg px-3 py-2 text-sm text-[#0B1F3A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#D99614]"
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
                className="w-full py-2.5 px-4 bg-[#D99614] hover:bg-[#B87D0E] disabled:opacity-50 text-[#0B1F3A] font-bold text-xs rounded-lg transition-all shadow-sm"
              >
                {mappingBusyId ? 'Binding...' : 'Save Mapping'}
              </button>
            </div>
          </form>
        </div>

        <TriPartInsightCard
          title="Provider Lineage & Certification Governance"
          category="CONNECTION CENTER"
          confidence={isCertified ? 'HIGH' : 'INSUFFICIENT_DATA'}
          sources={['SUPABASE_ACCOUNT_MAPPINGS', 'EXTERNAL_ACCOUNTS']}
          whatIsHappening={
            mappings.length > 0
              ? `${activeClient?.name} has ${mappings.length} confirmed row(s) in public.account_mappings.`
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
    <Suspense fallback={<div className="p-6 text-xs text-slate-500">Loading Connection Center...</div>}>
      <ConnectionCenterContent />
    </Suspense>
  );
}
