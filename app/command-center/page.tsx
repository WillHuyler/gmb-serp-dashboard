"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Sparkles, Lock, RefreshCw, Printer, Target, AlertTriangle } from 'lucide-react';

import { MarketingTimeline } from '../../components/timeline/MarketingTimeline';
import { DemoControls } from '../../components/demo/DemoControls';
import { MetricRegistry, CanonicalMetricResult, TargetPacingResult } from '../../lib/metrics/registry';
import { DataCertificationBadge, CertificationStatus } from '../../components/trust/DataCertificationBadge';
import { GrowthFunnel, FunnelStageData } from '../../components/analytics/GrowthFunnel';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

function CommandCenterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [keywords, setKeywords] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [demoAnomaly, setDemoAnomaly] = useState<string>('baseline');

  const funnelStages: FunnelStageData[] = [
    { stageName: 'Impressions', count: 485000, conversionRate: 100, benchmarkRate: 100 },
    { stageName: 'Clicks', count: 12400, conversionRate: 2.55, benchmarkRate: 2.80 },
    { stageName: 'Leads', count: 620, conversionRate: 5.00, benchmarkRate: 6.20 },
    { stageName: 'Qualified', count: 184, conversionRate: 29.67, benchmarkRate: 40.00 },
    { stageName: 'Closed Sales', count: 42, conversionRate: 22.82, benchmarkRate: 25.00 },
  ];

  useEffect(() => {
    async function loadClients() {
      const { data } = await supabase.from('clients').select('*');
      if (data && data.length > 0) {
        setClients(data);
        const urlClient = searchParams.get('client');
        if (urlClient && data.some((c) => c.id === urlClient)) {
          setSelectedClient(urlClient);
        } else {
          setSelectedClient(data[0].id);
        }
      } else {
        setLoading(false);
      }
    }
    loadClients();
  }, [searchParams]);

  useEffect(() => {
    if (selectedClient) {
      loadClientTelemetry();
      loadClientSignals();
    }
  }, [selectedClient]);

  async function loadClientTelemetry() {
    setLoading(true);
    const { data } = await supabase
      .from('keyword_library')
      .select('*, rank_history(*)')
      .eq('client_id', selectedClient);

    setKeywords(data || []);
    setLoading(false);
  }

  async function loadClientSignals() {
    const { data } = await supabase
      .from('signals')
      .select('*')
      .eq('client_id', selectedClient)
      .eq('is_resolved', false)
      .order('created_at', { ascending: false });

    setSignals(data || []);
  }

  const handleClientChange = (clientId: string) => {
    setSelectedClient(clientId);
    const params = new URLSearchParams(searchParams.toString());
    params.set('client', clientId);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const currentClientObj = clients.find((c) => c.id === selectedClient);
  const activeKeywords = keywords.filter((k) => k.is_active);

  const visibilityMetric: CanonicalMetricResult<number> = MetricRegistry.calculateLocalVisibility(
    currentClientObj?.tenant_id || '',
    selectedClient,
    activeKeywords
  );

  let displayedVisibility = visibilityMetric.value;
  if (displayedVisibility !== null && demoAnomaly === 'rank_drop') {
    displayedVisibility = Math.max(0, displayedVisibility - 28);
  }

  const leadsPacing: TargetPacingResult = MetricRegistry.calculateTargetPacing(184, 225);

  const certStatus: CertificationStatus = currentClientObj?.data_certification_status || 
    (visibilityMetric.healthStatus === 'VALID' ? 'DATA_CERTIFIED' : 'DATA_REVIEW_REQUIRED');

  const criticalSignal = signals.find((s) => s.severity === 'CRITICAL');

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 font-sans print:p-0 print:bg-white">
      
      {/* Demo Scenario Anomaly Control Bar */}
      <div className="print:hidden">
        <DemoControls onTriggerScenario={(scenario) => setDemoAnomaly(scenario)} />
      </div>

      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-[#102033] tracking-tight">Executive Command Center</h1>
            <DataCertificationBadge status={certStatus} statusMessage={visibilityMetric.statusMessage} />
          </div>
          <p className="text-xs text-[#5E7187]">
            Unified decision surface for <span className="text-[#FFC44D] font-bold">{currentClientObj?.name || 'Selected Entity'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#FFFFFF] border border-[#E2E8F0] px-3.5 py-1.5 rounded-xl shadow-sm text-xs font-mono">
            <Target className="w-4 h-4 text-[#3498DB]" />
            <div>
              <span className="text-[9px] text-[#5E7187] block uppercase font-bold">Leads Target Pace</span>
              <span className={`font-bold ${leadsPacing.status === 'BEHIND' ? 'text-amber-600' : 'text-emerald-600'}`}>
                184 / 225 ({leadsPacing.pacePercentage}%)
              </span>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="print:hidden bg-[#FFFFFF] border border-[#E2E8F0] hover:bg-[#F4F6F8] text-[#102033] font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all"
          >
            <Printer className="w-4 h-4 text-[#5E7187]" />
            <span>Export Briefing PDF</span>
          </button>

          <div className="flex items-center gap-2 bg-[#FFFFFF] border border-[#E2E8F0] px-3.5 py-2 rounded-xl shadow-sm">
            <span className="text-[10px] font-mono font-bold uppercase text-[#5E7187]">Entity:</span>
            <select
              value={selectedClient}
              onChange={(e) => handleClientChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#102033] focus:outline-none cursor-pointer max-w-[220px] truncate"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Beacon AI Executive Briefing */}
      <div className="bg-[#08111F] text-white rounded-2xl p-6 border border-[#F5A000]/30 shadow-md relative overflow-hidden print:border-black print:bg-white print:text-black">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-[#0E192B] border border-[#F5A000]/40 rounded-lg">
            <Sparkles className="w-4 h-4 text-[#F5A000]" />
          </div>
          <span className="text-xs font-mono font-bold text-[#FFC44D] print:text-black uppercase tracking-wider">
            BEACON EXECUTIVE BRIEFING
          </span>
        </div>

        <h2 className="text-base font-bold text-white print:text-black mb-2">
          {criticalSignal 
            ? `Critical Alert: ${criticalSignal.title}`
            : visibilityMetric.healthStatus === 'DATA_UNAVAILABLE'
            ? `Telemetry Notice: No Active Keywords Tracked for ${currentClientObj?.name || 'Client'}`
            : demoAnomaly === 'rank_drop'
            ? 'Critical Alert: Local Visibility Loss (-28%) Detected across Zip Codes'
            : `Local Pack Visibility at ${displayedVisibility}% Across ${activeKeywords.length} Tracked Terms`}
        </h2>

        <p className="text-xs text-[#A9C7E5] print:text-gray-800 leading-relaxed max-w-4xl">
          {criticalSignal
            ? `${criticalSignal.message} Recommended Action: ${criticalSignal.recommended_action}`
            : visibilityMetric.healthStatus === 'DATA_UNAVAILABLE'
            ? 'Add search terms with assigned target Zip Codes in OtterWatch SERP to calculate real-time visibility scores.'
            : demoAnomaly === 'rank_drop'
            ? 'Recent local pack shift displaced primary category terms into position #6+. Immediate GBP secondary listing update recommended.'
            : `Currently pacing at ${leadsPacing.pacePercentage}% toward monthly target of 225 qualified leads. Primary bottleneck identified at Lead -> Qualified stage.`}
        </p>
      </div>

      {/* Growth Funnel & Bottleneck Diagnostics */}
      <GrowthFunnel stages={funnelStages} clientName={currentClientObj?.name || 'Client'} />

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-extrabold text-[#102033]">OtterWatch SERP</span>
            <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
              visibilityMetric.healthStatus === 'VALID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {visibilityMetric.healthStatus === 'VALID' ? 'Supabase Verified' : 'No Active Data'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#5E7187] uppercase font-mono">Local Visibility Score</span>
            <div className="text-2xl font-extrabold text-[#102033]">
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin text-[#5E7187]" />
              ) : displayedVisibility !== null ? (
                `${displayedVisibility}%`
              ) : (
                <span className="text-xs font-mono text-[#5E7187]">DATA UNAVAILABLE</span>
              )}
            </div>
            <span className="text-xs font-semibold text-[#5E7187]">
              {visibilityMetric.provenance.sampleSize} tracked telemetry terms
            </span>
          </div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-extrabold text-[#102033]">AI Presence</span>
            <span className="bg-emerald-100 text-emerald-700 text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase">
              Connected
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#5E7187] uppercase font-mono">Brand Citation Rate</span>
            <div className="text-2xl font-extrabold text-[#102033]">60.0%</div>
            <span className="text-xs text-[#5E7187] font-semibold">Across Monitored LLMs</span>
          </div>
        </div>

        <div className="bg-[#FFFFFF]/60 border border-dashed border-[#CBD5E1] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[#5E7187]">Paid Media</span>
            <Lock className="w-3.5 h-3.5 text-[#94A3B8]" />
          </div>
          <div className="my-4 text-center">
            <span className="text-xs font-mono text-[#64748B] block">NOT CONNECTED</span>
          </div>
        </div>

        <div className="bg-[#FFFFFF]/60 border border-dashed border-[#CBD5E1] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[#5E7187]">CRM Pipeline</span>
            <Lock className="w-3.5 h-3.5 text-[#94A3B8]" />
          </div>
          <div className="my-4 text-center">
            <span className="text-xs font-mono text-[#64748B] block">NOT CONNECTED</span>
          </div>
        </div>
      </div>

      <MarketingTimeline />

    </div>
  );
}

export default function CommandCenterPage() {
  return (
    <Suspense fallback={
      <div className="p-8 max-w-[1600px] mx-auto flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-6 h-6 animate-spin text-[#5E7187]" />
      </div>
    }>
      <CommandCenterContent />
    </Suspense>
  );
}
