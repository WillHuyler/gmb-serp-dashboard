'use client';

import React, { useEffect, useState } from 'react';
import { useClient } from '../../lib/client-context';

export type MappingStatus =
  | 'NOT_CONNECTED'
  | 'AUTHORIZING'
  | 'AUTHORIZED'
  | 'RESOURCE_SELECTION_REQUIRED'
  | 'MAPPED'
  | 'INITIAL_SYNC'
  | 'HEALTHY'
  | 'STALE'
  | 'SYNC_FAILED'
  | 'PERMISSION_ERROR'
  | 'REAUTH_REQUIRED'
  | 'CONFIGURATION_REQUIRED';

interface DiscoveredResource {
  id: string;
  name: string;
  type: string;
  context?: string;
}

interface ProviderCardProps {
  title: string;
  providerKey: 'google_ads' | 'ga4' | 'gsc' | 'bing_webmaster';
  mappedValue?: string;
  lastSync?: string;
  isCertified: boolean;
  discoveredResources: DiscoveredResource[];
  onSelectResource: (resourceId: string) => Promise<void>;
  onSyncNow: () => Promise<void>;
}

function ProviderCard({
  title,
  providerKey,
  mappedValue,
  lastSync,
  isCertified,
  discoveredResources,
  onSelectResource,
  onSyncNow,
}: ProviderCardProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedId, setSelectedId] = useState('');

  const getStatus = (): { label: MappingStatus; color: string } => {
    if (!mappedValue) {
      return discoveredResources.length > 0
        ? { label: 'RESOURCE_SELECTION_REQUIRED', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' }
        : { label: 'NOT_CONNECTED', color: 'bg-slate-800 text-slate-400 border-slate-700' };
    }
    return isCertified
      ? { label: 'HEALTHY', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' }
      : { label: 'MAPPED', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
  };

  const status = getStatus();

  return (
    <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-6 space-y-4 shadow-lg">
      <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-3">
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">{title}</h3>
        <span className={`px-2.5 py-0.5 text-[10px] font-mono font-bold rounded border ${status.color}`}>
          {status.label}
        </span>
      </div>

      <div className="space-y-2 text-xs font-mono">
        <div className="flex justify-between">
          <span className="text-slate-400">Mapped Resource:</span>
          <span className="text-white font-bold">{mappedValue || 'NONE'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Last Sync:</span>
          <span className="text-slate-300">{lastSync || '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Certification State:</span>
          <span className={isCertified ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
            {isCertified ? 'CERTIFIED ✓' : 'NOT CERTIFIED'}
          </span>
        </div>
      </div>

      {isSelecting ? (
        <div className="space-y-3 pt-2">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full bg-[#0B0F17] border border-[#A9C7E5]/20 rounded px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
          >
            <option value="">-- Select Discovered Resource --</option>
            {discoveredResources.map((res) => (
              <option key={res.id} value={res.id}>
                {res.name} ({res.id}) {res.context ? `[${res.context}]` : ''}
              </option>
            ))}
          </select>

          <div className="flex space-x-2">
            <button
              onClick={async () => {
                if (selectedId) {
                  await onSelectResource(selectedId);
                  setIsSelecting(false);
                }
              }}
              disabled={!selectedId}
              className="flex-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono py-1.5 rounded hover:bg-amber-500/30 disabled:opacity-50"
            >
              CONFIRM MAPPING
            </button>
            <button
              onClick={() => setIsSelecting(false)}
              className="px-3 bg-slate-800 text-slate-400 text-xs font-mono py-1.5 rounded hover:bg-slate-700"
            >
              CANCEL
            </button>
          </div>
        </div>
      ) : (
        <div className="flex space-x-2 pt-2">
          {mappedValue ? (
            <>
              <button
                onClick={() => setIsSelecting(true)}
                className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono py-1.5 rounded hover:bg-slate-700 transition-all"
              >
                CHANGE MAPPING
              </button>
              <button
                onClick={async () => {
                  setIsSyncing(true);
                  await onSyncNow();
                  setIsSyncing(false);
                }}
                disabled={isSyncing}
                className="flex-1 bg-[#55A9E6]/10 border border-[#55A9E6]/30 text-[#55A9E6] text-xs font-mono py-1.5 rounded hover:bg-[#55A9E6]/20 transition-all disabled:opacity-50"
              >
                {isSyncing ? 'SYNCING...' : 'SYNC NOW'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsSelecting(true)}
              className="w-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold py-2 rounded hover:bg-amber-500/20 transition-all"
            >
              SELECT ACCOUNT / RESOURCE
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ConnectionCenterPage() {
  const { activeClient } = useClient();
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleSelectResource = async (provider: string, resourceId: string) => {
    if (!activeClient) return;
    const res = await fetch('/api/data/mappings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: activeClient.id,
        external_account_id: resourceId,
        provider,
      }),
    });
    const data = await res.json();
    if (data.success) {
      alert(`Successfully mapped ${provider} to ${resourceId}. Run Sync Now to validate certification.`);
      window.location.reload();
    }
  };

  const handleSyncNow = async (provider: string) => {
    if (!activeClient) return;
    setSyncStatus(`Syncing ${provider}...`);
    const res = await fetch('/api/integrations/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: activeClient.id,
        provider,
      }),
    });
    const data = await res.json();
    setSyncStatus(null);
    if (data.success) {
      alert(`Sync succeeded for ${provider}. Certification status updated.`);
      window.location.reload();
    }
  };

  return (
    <div className="p-8 space-y-8 bg-[#0B0F17] text-white min-h-screen">
      <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-mono">CONNECTION CENTER</h1>
          <p className="text-sm text-slate-400 mt-1">
            Explicit Client Provider Mapping Workspace & Certification Control Plane
          </p>
        </div>
        <div className="bg-[#111622] border border-[#A9C7E5]/20 px-4 py-2 rounded-lg">
          <span className="text-xs font-mono text-slate-400 block">ACTIVE CLIENT WORKSPACE</span>
          <span className="text-sm font-bold text-amber-400 font-mono">
            {activeClient ? activeClient.name : 'NO CLIENT SELECTED'}
          </span>
        </div>
      </div>

      {syncStatus && (
        <div className="p-3 bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-mono rounded animate-pulse">
          {syncStatus}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProviderCard
          title="Google Ads"
          providerKey="google_ads"
          mappedValue={activeClient?.mappings?.google_ads_id}
          lastSync="Oct 11 15:48 EDT"
          isCertified={Boolean(activeClient?.is_certified && activeClient?.mappings?.google_ads_id)}
          discoveredResources={[
            { id: 'ads_highrise_9821', name: 'High Rise Chimney Sweep - Search Account' },
            { id: 'ads_kellyhyundai_4412', name: 'Kelly Hyundai - Regional PPC' },
          ]}
          onSelectResource={(id) => handleSelectResource('google_ads', id)}
          onSyncNow={() => handleSyncNow('google_ads')}
        />

        <ProviderCard
          title="Google Analytics 4 (GA4)"
          providerKey="ga4"
          mappedValue={activeClient?.mappings?.ga4_property_id}
          lastSync="Oct 11 15:48 EDT"
          isCertified={Boolean(activeClient?.is_certified && activeClient?.mappings?.ga4_property_id)}
          discoveredResources={[
            { id: 'ga4_highrise_3311', name: 'High Rise Web Stream', context: 'highrisechimney.com' },
            { id: 'ga4_apexdental_1029', name: 'Apex Primary Stream', context: 'apexdental.com' },
          ]}
          onSelectResource={(id) => handleSelectResource('ga4', id)}
          onSyncNow={() => handleSyncNow('ga4')}
        />

        <ProviderCard
          title="Google Search Console (GSC)"
          providerKey="gsc"
          mappedValue={activeClient?.mappings?.gsc_site_url}
          lastSync="Oct 11 15:48 EDT"
          isCertified={Boolean(activeClient?.is_certified && activeClient?.mappings?.gsc_site_url)}
          discoveredResources={[
            { id: 'https://highrisechimney.com', name: 'High Rise Chimney (URL Prefix)', context: 'URL Prefix' },
            { id: 'sc-domain:highrisechimney.com', name: 'highrisechimney.com (Domain Property)', context: 'Domain Property' },
          ]}
          onSelectResource={(id) => handleSelectResource('gsc', id)}
          onSyncNow={() => handleSyncNow('gsc')}
        />

        <ProviderCard
          title="Bing Webmaster Tools"
          providerKey="bing_webmaster"
          mappedValue={activeClient?.mappings?.bing_webmaster_site_url}
          lastSync="Oct 11 15:48 EDT"
          isCertified={Boolean(activeClient?.is_certified && activeClient?.mappings?.bing_webmaster_site_url)}
          discoveredResources={[
            { id: 'https://highrisechimney.com', name: 'High Rise Chimney Sweep (Verified Site)' },
          ]}
          onSelectResource={(id) => handleSelectResource('bing_webmaster', id)}
          onSyncNow={() => handleSyncNow('bing_webmaster')}
        />
      </div>
    </div>
  );
}
