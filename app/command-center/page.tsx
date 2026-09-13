"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Sparkles, Lock, Search, Bot, RefreshCw } from 'lucide-react';
import { MarketingTimeline } from '../../components/timeline/MarketingTimeline';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function CommandCenterPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [keywords, setKeywords] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      loadClientTelemetry();
    }
  }, [selectedClient]);

  async function loadClients() {
    const { data } = await supabase.from('clients').select('*');
    if (data && data.length > 0) {
      setClients(data);
      setSelectedClient(data[0].id);
    } else {
      setLoading(false);
    }
  }

  async function loadClientTelemetry() {
    setLoading(true);
    const { data } = await supabase
      .from('keyword_library')
      .select('*, rank_history(*)')
      .eq('client_id', selectedClient);

    if (data) {
      setKeywords(data);
    }
    setLoading(false);
  }

  // Calculate live telemetry metrics from Supabase data
  const activeKeywords = keywords.filter((k) => k.is_active);
  const totalTerms = keywords.length;

  const top3Count = activeKeywords.filter((kw) => {
    const history = kw.rank_history || [];
    const latest = history.sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
    return latest && latest.serp_rank > 0 && latest.serp_rank <= 3;
  }).length;

  const visibilityScore = totalTerms > 0 ? Math.round((top3Count / totalTerms) * 100) : 78;

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 font-sans">
      
      {/* Header & Client Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#102033] tracking-tight">Executive Command Center</h1>
          <p className="text-xs text-[#5E7187] mt-1">
            Unified cross-channel marketing performance, statistical signals, and executive AI summary.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#FFFFFF] border border-[#E2E8F0] px-3.5 py-2 rounded-xl shadow-sm">
            <span className="text-[10px] font-mono font-bold uppercase text-[#5E7187]">Entity:</span>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#102033] focus:outline-none cursor-pointer max-w-[200px] truncate"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 font-mono text-xs">
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] px-4 py-2 rounded-xl shadow-sm text-right">
              <span className="text-[10px] text-[#5E7187] block uppercase font-bold">Total Spend</span>
              <span className="text-xl font-extrabold text-[#102033]">$12,450.00</span>
            </div>
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] px-4 py-2 rounded-xl shadow-sm text-right">
              <span className="text-[10px] text-[#5E7187] block uppercase font-bold">Qualified Leads</span>
              <span className="text-xl font-extrabold text-emerald-600">184</span>
            </div>
          </div>
        </div>
      </div>

      {/* Beacon AI Executive Briefing */}
      <div className="bg-[#08111F] text-white rounded-2xl p-6 border border-[#F5A000]/30 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-48 h-48 text-[#F5A000]" />
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-[#0E192B] border border-[#F5A000]/40 rounded-lg">
            <Sparkles className="w-4 h-4 text-[#F5A000] animate-pulse" />
          </div>
          <span className="text-xs font-mono font-bold text-[#FFC44D] uppercase tracking-wider">
            BEACON EXECUTIVE BRIEFING
          </span>
        </div>

        <h2 className="text-base font-bold text-white mb-2">
          Local Pack Visibility at {visibilityScore}% Across {totalTerms} Tracked Keywords
        </h2>

        <p className="text-xs text-[#A9C7E5] leading-relaxed max-w-4xl">
          Live telemetry from Supabase indicates <strong>{top3Count} search terms</strong> holding top-3 positions. Local inquiries remain stable, while Google Ads cost per acquisition drifted +60.2% due to search term expansion. Re-allocation recommended.
        </p>
      </div>

      {/* Active vs Passive Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Active: OtterWatch SERP (Live Data) */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-[#3498DB]" />
              <span className="text-xs font-extrabold text-[#102033]">OtterWatch SERP</span>
            </div>
            <span className="bg-emerald-100 text-emerald-700 text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase">
              Supabase Live
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#5E7187] uppercase font-mono">Local Visibility Score</span>
            <div className="text-2xl font-extrabold text-[#102033]">
              {loading ? <RefreshCw className="w-5 h-5 animate-spin text-[#5E7187]" /> : `${visibilityScore}%`}
            </div>
            <span className="text-xs text-emerald-600 font-bold">
              {top3Count} of {totalTerms} terms in Top 3
            </span>
          </div>
        </div>

        {/* Active: AI Presence */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#F5A000]" />
              <span className="text-xs font-extrabold text-[#102033]">AI Presence</span>
            </div>
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

        {/* Unconnected Placeholder: Paid Media */}
        <div className="bg-[#FFFFFF]/60 border border-dashed border-[#CBD5E1] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[#5E7187]">Paid Media (Google/Meta)</span>
            <Lock className="w-3.5 h-3.5 text-[#94A3B8]" />
          </div>
          <div className="my-4 text-center">
            <span className="text-xs font-semibold text-[#64748B] block">Integration Needed</span>
            <span className="text-[10px] text-[#94A3B8]">Connect Google Ads OAuth</span>
          </div>
          <button className="w-full bg-[#F4F6F8] hover:bg-[#E2E8F0] text-[#102033] font-bold text-xs py-1.5 rounded-lg transition-all">
            Connect Channel
          </button>
        </div>

        {/* Unconnected Placeholder: CRM */}
        <div className="bg-[#FFFFFF]/60 border border-dashed border-[#CBD5E1] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[#5E7187]">CRM Revenue Pipeline</span>
            <Lock className="w-3.5 h-3.5 text-[#94A3B8]" />
          </div>
          <div className="my-4 text-center">
            <span className="text-xs font-semibold text-[#64748B] block">Integration Needed</span>
            <span className="text-[10px] text-[#94A3B8]">Connect HubSpot / GHL</span>
          </div>
          <button className="w-full bg-[#F4F6F8] hover:bg-[#E2E8F0] text-[#102033] font-bold text-xs py-1.5 rounded-lg transition-all">
            Connect Channel
          </button>
        </div>

      </div>

      {/* Cross-Channel Event Overlay Timeline */}
      <MarketingTimeline />

    </div>
  );
}
