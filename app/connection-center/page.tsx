'use client';

import React, { Suspense } from 'react';
import { useClient } from '../../lib/client-context';
import GlobalHeader from '../../components/navigation/GlobalHeader';

export const dynamic = 'force-dynamic';

export type ConnectionStatus =
  | 'NOT_CONNECTED'
  | 'AUTHORIZING'
  | 'MAPPED'
  | 'HEALTHY'
  | 'STALE'
  | 'CONFIGURATION_REQUIRED';

interface ProviderConfig {
  key: string;
  name: string;
  category: string;
  mappingKey: string;
  description: string;
  icon: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    key: 'google_ads',
    name: 'Google Ads',
    category: 'Paid Acquisition',
    mappingKey: 'google_ads_id',
    description: 'Ad spend, campaign performance, CTR, and conversion telemetry.',
    icon: '🎯',
  },
  {
    key: 'meta_ads',
    name: 'Meta Ads',
    category: 'Paid Social',
    mappingKey: 'meta_act_id',
    description: 'Facebook & Instagram ad spend, reach, impressions, and link clicks.',
    icon: '📲',
  },
  {
    key: 'ga4',
    name: 'Google Analytics 4',
    category: 'Web Analytics',
    mappingKey: 'ga4_property_id',
    description: 'Web traffic sessions, active user counts, and engaged session metrics.',
    icon: '📊',
  },
  {
    key: 'gsc',
    name: 'Google Search Console',
    category: 'Organic Search',
    mappingKey: 'gsc_site_url',
    description: 'Organic clicks, impressions, CTR, and average SERP position.',
    icon: '🔍',
  },
  {
    key: 'gmb',
    name: 'Google Business Profile',
    category: 'Local Presence',
    mappingKey: 'gmb_account_id',
    description: 'Local profile calls, direction requests, website clicks, and reviews.',
    icon: '📍',
  },
  {
    key: 'brightlocal',
    name: 'BrightLocal (OtterWatch)',
    category: 'SERP Grid Engine',
    mappingKey: 'brightlocal_location_id',
    description: '5x5 geo-grid local map pack rankings and top-3 visibility scores.',
    icon: '🦉',
  },
  {
    key: 'bing_webmaster',
    name: 'Bing Webmaster Tools',
    category: 'Organic Search',
    mappingKey: 'bing_webmaster_site_url',
    description: 'Bing organic search indexation, search queries, and crawling health.',
    icon: '🌐',
  },
  {
    key: 'clarity',
    name: 'Microsoft Clarity',
    category: 'Behavioral Insights',
    mappingKey: 'clarity_project_id',
    description: 'User heatmaps, session recordings, and frustration click metrics.',
    icon: '👁️',
  },
];

function resolveProviderStatus(
  client: any,
  provider: ProviderConfig
): { status: ConnectionStatus; label: string; badgeClass: string; accountId: string | null } {
  if (!client) {
    return {
      status: 'NOT_CONNECTED',
      label: 'NOT CONNECTED',
      badgeClass: 'bg-slate-800 text-slate-400 border-slate-700',
      accountId: null,
    };
  }

  const accountId = client.mappings?.[provider.mappingKey] || null;

  if (!accountId || String(accountId).trim() === '') {
    return {
      status: 'NOT_CONNECTED',
      label: 'NOT CONNECTED',
      badgeClass: 'bg-slate-800 text-slate-400 border-slate-700',
      accountId: null,
    };
  }

  if (!client.is_certified) {
    return {
      status: 'MAPPED',
      label: 'MAPPED (UNCERTIFIED BASELINE)',
      badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      accountId,
    };
  }

  return {
    status: 'HEALTHY',
    label: 'LIVE & SYNCHRONIZED',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    accountId,
  };
}

function ConnectionCenterContent() {
  const { activeClient } = useClient();

  return (
    <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D99614] font-bold block">
            SYSTEM ARCHITECTURE • INTEGRATION SPINE
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Connection Center</h1>
          <p className="text-xs text-slate-400 mt-1">
            Active provider connections, OAuth account mappings, and telemetry ingestion health for{' '}
            <strong className="text-white">{activeClient?.name || 'Selected Client'}</strong>.
          </p>
        </div>

        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-lg px-3 py-2 text-right">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Certification Status</span>
          <span
            className={`text-xs font-mono font-bold
