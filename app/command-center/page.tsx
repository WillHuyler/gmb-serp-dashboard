'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { RefreshCw, Download, AlertTriangle, CheckCircle2, ShieldAlert, Activity } from 'lucide-react';
import { MetricRegistry, CanonicalMetricResult, TargetPacingResult } from '@/lib/metrics/registry';
import GrowthFunnel from '@/components/analytics/GrowthFunnel';
import MarketingTimeline from '@/components/timeline/MarketingTimeline';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface ClientEntity {
  id: string;
  tenant_id: string;
  name: string;
  industry?: string;
}

interface KeywordRecord {
  id: number;
  keyword: string;
  is_active: boolean;
  rank_history?: Array<{ serp_rank: number; created_at: string }>;
}

interface SignalRecord {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  signal_type: string;
  title: string;
  message: string;
  recommended_action: string;
  created_at: string;
}

function CommandCenterContent() {
  const searchParams = useSearchParams();
  const clientIdFromUrl = searchParams.get('client');

  const [clients, setClients] = useState<ClientEntity[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientEntity | null>(null);
  const [keywords, setKeywords] = useState<KeywordRecord[]>([]);
  const [signals, setSignals] = useState<SignalRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [visibilityMetric, setVisibilityMetric] = useState<CanonicalMetricResult<number> | null>(null);
  const [pacingResult, setPacingResult] = useState<TargetPacingResult | null>(null);

  // 1. Fetch Client Context & Enforce Tenant Isolation
  useEffect(() => {
    async function fetchInitialContext() {
      setIsLoading(true);
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, tenant_id, name, industry');

      if (clientsError || !clientsData || clientsData.length === 0) {
        setIsLoading(false);
        return;
      }

      setClients(clientsData);

      // Select client from URL or default to first certified entity
      const active = clientsData.find((c) => c.id === clientIdFromUrl) || clientsData[0];
      setSelectedClient(active);
    }

    fetchInitialContext();
  }, [clientIdFromUrl]);

  // 2. Fetch Telemetry Data & Calculate Provenance-Backed Metrics
  useEffect(() => {
    if (!selectedClient) return;

    async function fetchTelemetryData() {
      setIsLoading(true);

      // Fetch active keywords with latest rank history
      const { data: keywordData } = await supabase
        .from('keyword_library')
        .select(`
          id,
          keyword,
          is_active,
          rank_history (
            serp_rank,
            created_at
          )
        `)
        .eq('client_id', selectedClient.id)
        .order('created_at', { foreignTable: 'rank_history', ascending: false });

      const fetchedKeywords = (keywordData as unknown as KeywordRecord[]) || [];
      setKeywords(fetchedKeywords);

      // Calculate Zero-Mock Local Visibility Score via Canonical Metric Registry v2
      const visResult = MetricRegistry.calculateLocalVisibility(
        selectedClient.tenant_id,
        selectedClient.id,
        fetchedKeywords
      );
      setVisibilityMetric(visResult);

      // Calculate Target Pacing against Nominal Baseline (80% Top 3 Target)
      const targetPace = MetricRegistry.calculateTargetPacing(visResult.value, 80);
      setPacingResult(targetPace);

      // Fetch Active Signals & Anomaly Alerts
      const { data: signalData } = await supabase
        .from('signals')
        .select('*')
        .eq('client_id', selectedClient.id)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });

      setSignals((signalData as SignalRecord[]) || []);
      setIsLoading(false);
    }

    fetchTelemetryData();

    // 3. Realtime Signal Listener (Supabase WebSocket Channel)
    const channel = supabase
      .channel(`realtime:signals:${selectedClient.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'signals',
          filter: `client_id=eq.${selectedClient.id}`,
        },
        (payload) => {
          setSignals((prev) => [payload.new as SignalRecord, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedClient]);

  const handleExportPDF = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[600px] w-full items-center justify-center p-8 text-[#94A3B8]">
        <RefreshCw className="h-8 w-8 animate-spin text-[#F5A000]" />
        <span className="ml-3 font-mono text-sm tracking-wide">CERTIFYING METRIC PIPELINES...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 p-8 font-sans print:p-0">
      {/* HEADER CONTROLS & ENTITY SELECTOR */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold tracking-tight text-white print:text-black">
              Executive Command Center
            </h1>
            {visibilityMetric?.healthStatus === 'VALID' ? (
              <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> DATA CERTIFIED
              </span>
            ) : (
              <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20">
                <AlertTriangle className="mr-1 h-3.5 w-3.5" /> DATA REVIEW REQUIRED
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-[#94A3B8] print:text-black">
            Unified decision surface for <span className="font-semibold text-white print:text-black">{selectedClient?.name}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 print:hidden">
          {/* Target Pacing Indicator */}
          <div className="flex items-center rounded-lg border border-[#1E293B] bg-[#0F172A] px-3 py-1.5 text-xs text-white">
            <Activity className="mr-2 h-4 w-4 text-[#0066FF]" />
            <span className="text-[#94A3B8]">VISIBILITY PACE:</span>
            <span className="ml-2 font-mono font-bold text-white">
              {pacingResult?.pacePercentage !== null ? `${pacingResult?.pacePercentage}%` : 'N/A'}
            </span>
          </div>

          {/* Export PDF Button */}
          <button
            onClick={handleExportPDF}
            className="flex items-center rounded-lg border border-[#1E293B] bg-[#0F172A] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#1E293B]"
          >
            <Download className="mr-2 h-3.5 w-3.5 text-[#F5A000]" /> Export Briefing PDF
          </button>

          {/* Entity Selector */}
          <select
            value={selectedClient?.id || ''}
            onChange={(e) => {
              const target = clients.find((c) => c.id === e.target.value);
              if (target) setSelectedClient(target);
            }}
            className="rounded-lg border border-[#1E293B] bg-[#0F172A] px-3 py-2 text-xs font-medium text-white outline-none focus:border-[#F5A000]"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                ENTITY: {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* BEACON EXECUTIVE BRIEFING CARD */}
      <div className="rounded-xl border border-[#F5A000]/30 bg-[#08111F] p-6 shadow-md print:border-black print:bg-white print:text-black">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#F5A000]">
          <ShieldAlert className="h-4 w-4" />
          <span>Beacon Executive Briefing</span>
        </div>

        <div className="mt-4 space-y-3">
          {signals.length > 0 ? (
            signals.map((sig) => (
              <div
                key={sig.id}
                className="flex items-start rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-xs"
              >
                <AlertTriangle className="mr-3 h-5 w-5 shrink-0 text-red-400" />
                <div>
                  <h4 className="font-bold text-red-200">{sig.title}</h4>
                  <p className="mt-1 text-red-300/80">{sig.message}</p>
                  <p className="mt-2 text-[#94A3B8]">
                    <span className="font-semibold text-white">Recommended Interventions:</span> {sig.recommended_action}
                  </p>
                </div>
              </div>
            ))
          ) : visibilityMetric?.healthStatus === 'DATA_UNAVAILABLE' ? (
            <div>
              <h3 className="text-base font-semibold text-white print:text-black">
                Telemetry Notice: No Active Keywords Tracked for {selectedClient?.name}
              </h3>
              <p className="mt-1 text-sm text-[#94A3B8] print:text-black">
                Add search terms with assigned target Zip Codes in OtterWatch SERP to calculate real-time visibility scores.
              </p>
            </div>
          ) : (
            <div>
              <h3 className="text-base font-semibold text-emerald-400">
                Local Pack Placement Stable across Monitored Terms
              </h3>
              <p className="mt-1 text-sm text-[#94A3B8]">
                Certified score standing at <span className="font-bold text-white">{visibilityMetric?.value}%</span> across {visibilityMetric?.provenance.sampleSize} verified search term observations.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* GROWTH FUNNEL DIAGNOSTICS */}
      <div className="rounded-xl border border-[#1E293B] bg-white p-6 shadow-sm print:border-black">
        <div className="flex items-center justify-between pb-4">
          <div>
            <h3 className="text-base font-bold text-[#102033]">Growth Funnel & Bottleneck Diagnostics</h3>
            <p className="text-xs text-[#64748B]">Stage-by-stage conversion analysis against cohort benchmarks.</p>
          </div>
        </div>
        <GrowthFunnel 
          clientName={selectedClient?.name || 'Entity'} 
          stages={[]} 
        />
      </div>

      {/* INTEGRATIONS GRID */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* OtterWatch SERP Card */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#64748B]">OtterWatch SERP</span>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {visibilityMetric?.healthStatus}
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-[#102033]">
              {visibilityMetric?.value !== null ? `${visibilityMetric?.value}%` : 'N/A'}
            </div>
            <div className="mt-1 text-xs text-[#64748B]">
              {visibilityMetric?.provenance.sampleSize || 0} tracked telemetry terms
            </div>
          </div>
        </div>

        {/* AI Presence Card */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#64748B]">AI Presence</span>
            <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
              UNCONNECTED
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-[#94A3B8]">--</div>
            <div className="mt-1 text-xs text-[#94A3B8]">Integration Pending</div>
          </div>
        </div>

        {/* Paid Media Card */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#64748B]">Paid Media</span>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              NOT CONNECTED
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-[#94A3B8]">--</div>
            <div className="mt-1 text-xs text-[#94A3B8]">Google/Meta OAuth Required</div>
          </div>
        </div>

        {/* CRM Pipeline Card */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#64748B]">CRM Pipeline</span>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              NOT CONNECTED
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-[#94A3B8]">--</div>
            <div className="mt-1 text-xs text-[#94A3B8]">HubSpot/Salesforce Unlinked</div>
          </div>
        </div>
      </div>

      {/* TIMELINE OVERLAY */}
      <div className="rounded-xl border border-[#1E293B] bg-[#0F172A] p-6 text-white">
        <h3 className="text-base font-bold">Unified Marketing Event Timeline</h3>
        <p className="text-xs text-[#94A3B8]">Correlate budget changes, ranking movements, and deployment events.</p>
        <div className="mt-4">
          <MarketingTimeline />
        </div>
      </div>
    </div>
  );
}

export default function CommandCenterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[600px] w-full items-center justify-center p-8 text-[#94A3B8]">
          <RefreshCw className="h-6 w-6 animate-spin text-[#F5A000]" />
        </div>
      }
    >
      <CommandCenterContent />
    </Suspense>
  );
}
