"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Plus, ArrowUp, ArrowDown, Minus, MapPin, 
  Volume2, Eye, Grid, Users, Radio, TrendingUp, 
  Search, BarChart3, ChevronRight, Activity, Edit2, Check, X
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// HELPER FUNCTION (MODULE SCOPED)
const renderRankChange = (history: any[]) => {
  if (!history || history.length === 0) return { rankUI: <span className="text-[#70839D] font-mono text-xs">Pending Sync</span>, rawRank: 99 };

  const sorted = [...history].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const latest = sorted[0];
  const previous = sorted[1];

  if (!latest || latest.serp_rank >= 99) {
    return {
      rankUI: (
        <div className="flex items-center gap-1.5 font-mono text-xs text-[#70839D]">
          <span>99+</span>
          <span className="text-[10px] bg-[#0E192B] px-1.5 py-0.5 rounded text-[#70839D] border border-[#A9C7E5]/10">Unranked</span>
        </div>
      ),
      rawRank: 99
    };
  }

  if (!previous) {
    return {
      rankUI: (
        <div className="flex items-center gap-1.5 font-mono">
          <span className="font-bold text-[#F7FAFC]">#{latest.serp_rank}</span>
          <span className="text-[10px] text-[#FFC44D] font-bold bg-[#F5A000]/10 border border-[#F5A000]/30 px-1 rounded">NEW</span>
        </div>
      ),
      rawRank: latest.serp_rank
    };
  }

  const diff = previous.serp_rank - latest.serp_rank;
  return {
    rankUI: (
      <div className="flex items-center gap-2 font-mono text-xs">
        <span className="font-bold text-[#F7FAFC]">#{latest.serp_rank}</span>
        {diff > 0 && <span className="text-emerald-400 font-semibold flex items-center gap-0.5"><ArrowUp className="w-3 h-3"/> +{diff}</span>}
        {diff < 0 && <span className="text-rose-400 font-semibold flex items-center gap-0.5"><ArrowDown className="w-3 h-3"/> {diff}</span>}
        {diff === 0 && <span className="text-[#70839D] flex items-center gap-0.5"><Minus className="w-3 h-3"/> 0</span>}
      </div>
    ),
    rawRank: latest.serp_rank
  };
};

export default function OtterWatchDashboard() {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [keywords, setKeywords] = useState<any[]>([]);
  const [newKeyword, setNewKeyword] = useState<string>('');
  const [zipCode, setZipCode] = useState<string>('');
  const [editingZipId, setEditingZipId] = useState<number | null>(null);
  const [editingZipValue, setEditingZipValue] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'rankings' | 'map' | 'competitors' | 'signals'>('overview');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => { loadClients(); }, []);
  useEffect(() => { if (selectedClient) loadKeywords(); }, [selectedClient]);

  async function loadClients() {
    const { data } = await supabase.from('clients').select('*');
    if (data && data.length > 0) {
      setClients(data);
      setSelectedClient(data[0].id);
    }
  }

  async function loadKeywords() {
    const { data } = await supabase
      .from('keyword_library')
      .select('*, rank_history(*)')
      .eq('client_id', selectedClient);

    if (data) setKeywords(data);
  }

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword || !selectedClient) return;

    const activeCount = keywords.filter((k) => k.is_active).length;
    if (activeCount >= 5) {
      alert("Quota Limit Reached: Maximum 5 active telemetry keywords per client.");
      return;
    }

    const targetZip = zipCode.trim() || '18360';

    await supabase.from('keyword_library').insert({
      client_id: selectedClient,
      keyword: newKeyword.trim(),
      zip_code: targetZip,
      location: `Zip: ${targetZip}`,
      is_active: true,
    });

    setNewKeyword('');
    setZipCode('');
    loadKeywords();
  };

  const updateKeywordZip = async (id: number) => {
    if (!editingZipValue.trim()) return;

    const targetZip = editingZipValue.trim();
    await supabase
      .from('keyword_library')
      .update({ 
        zip_code: targetZip,
        location: `Zip: ${targetZip}` 
      })
      .eq('id', id);

    setEditingZipId(null);
    setEditingZipValue('');
    loadKeywords();
  };

  const toggleKeywordStatus = async (id: number, currentStatus: boolean) => {
    await supabase
      .from('keyword_library')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    loadKeywords();
  };

  const currentClientObj = clients.find(c => c.id === selectedClient);
  const activeKeywords = keywords.filter(k => k.is_active);

  const totalVolume = activeKeywords.reduce((acc, kw) => {
    const history = kw.rank_history || [];
    const latest = history.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    return acc + (latest?.search_volume || 0);
  }, 0);

  const top3Keywords = activeKeywords.filter(kw => {
    const history = kw.rank_history || [];
    const latest = history.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    return latest && latest.serp_rank > 0 && latest.serp_rank <= 3;
  });

  const top3Count = top3Keywords.length;

  const top10Count = activeKeywords.filter(kw => {
    const history = kw.rank_history || [];
    const latest = history.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    return latest && latest.serp_rank > 0 && latest.serp_rank <= 10;
  }).length;

  const localPackKeywords = activeKeywords.filter(kw => {
    const history = kw.rank_history || [];
    const latest = history.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    return latest && latest.rank_type === 'Local Pack';
  });

  const localPackCount = localPackKeywords.length;

  const generateClientSignals = () => {
    const signals = [];
    if (top3Count > 0) {
      signals.push({
        id: 'top3',
        type: 'OPPORTUNITY',
        badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        borderColor: 'border-l-emerald-400',
        title: `Secured Position #${top3Keywords[0]?.rank_history[0]?.serp_rank || 1} for "${top3Keywords[0]?.keyword}"`,
        description: `Client holds high visibility in target Zip ${top3Keywords[0]?.zip_code || '18360'}. Competitor velocity remains steady.`,
        time: 'Active Telemetry'
      });
    }

    if (localPackCount > 0) {
      signals.push({
        id: 'pack',
        type: 'LOCAL PACK WIN',
        badgeColor: 'bg-[#F5A000]/10 text-[#FFC44D] border-[#F5A000]/30',
        borderColor: 'border-l-[#F5A000]',
        title: `Local 3-Pack Presence confirmed for "${localPackKeywords[0]?.keyword}"`,
        description: `Appearing directly in Google Maps results for Zip ${localPackKeywords[0]?.zip_code || '18360'}.`,
        time: 'Verified Ingestion'
      });
    }

    if (activeKeywords.length === 0) {
      signals.push({
        id: 'empty',
        type: 'SYSTEM WATCH',
        badgeColor: 'bg-[#55A9E6]/10 text-[#55A9E6] border-[#55A9E6]/20',
        borderColor: 'border-l-[#55A9E6]',
        title: `No Active Keywords Tracked for ${currentClientObj?.name || 'Selected Entity'}`,
        description: 'Add keywords and assign Zip Codes in the Rankings tab to begin collecting localized SERP telemetry.',
        time: 'Action Required'
      });
    }

    if (signals.length === 1 && activeKeywords.length > 0) {
      signals.push({
        id: 'competitor',
        type: 'COMPETITIVE OVERLAP',
        badgeColor: 'bg-[#55A9E6]/10 text-[#55A9E6] border-[#55A9E6]/20',
        borderColor: 'border-l-[#55A9E6]',
        title: `Tracking ${activeKeywords.length} Search Terms Across Assigned Zip Codes`,
        description: `Automated rank ingestion pipeline scanning top 3 organic and local competitors.`,
        time: 'Continuous Logging'
      });
    }

    return signals;
  };

  const clientSignals = generateClientSignals();

  const filteredKeywords = keywords.filter(kw => 
    kw.keyword.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (kw.zip_code && kw.zip_code.includes(searchQuery))
  );

  return (
    <div className="space-y-6 text-[#F7FAFC] font-sans antialiased">
      <div className="flex justify-between items-center bg-[#0E192B] p-4 rounded-xl border border-[#A9C7E5]/10 shadow-sm">
        <div>
          <h1 className="text-lg font-bold">OtterWatch SERP Control</h1>
          <p className="text-xs text-[#70839D]">Local Pack Telemetry & Keyword Intelligence</p>
        </div>
        <div className="flex items-center gap-3 bg-[#08111F] px-3.5 py-1.5 rounded-lg border border-[#A9C7E5]/10">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#70839D]">Entity:</label>
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="bg-transparent text-xs font-semibold text-[#A9C7E5] focus:outline-none focus:text-[#FFC44D] cursor-pointer w-[200px] truncate"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#0E192B] text-white">{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0E192B] border border-[#A9C7E5]/10 p-5 rounded-xl">
          <span className="text-[11px] font-bold uppercase text-[#70839D]">Tracked Terms</span>
          <div className="text-3xl font-extrabold text-[#F7FAFC] font-mono mt-1">{keywords.length}</div>
        </div>
        <div className="bg-[#0E192B] border border-[#A9C7E5]/10 p-5 rounded-xl">
          <span className="text-[11px] font-bold uppercase text-[#70839D]">Top 3 Share</span>
          <div className="text-3xl font-extrabold text-[#FFC44D] font-mono mt-1">{top3Count}</div>
        </div>
        <div className="bg-[#0E192B] border border-[#A9C7E5]/10 p-5 rounded-xl">
          <span className="text-[11px] font-bold uppercase text-[#70839D]">Local Pack Wins</span>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono mt-1">{localPackCount}</div>
        </div>
        <div className="bg-[#0E192B] border border-[#A9C7E5]/10 p-5 rounded-xl">
          <span className="text-[11px] font-bold uppercase text-[#70839D]">Est. Volume</span>
          <div className="text-3xl font-extrabold text-[#F7FAFC] font-mono mt-1">{totalVolume.toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-[#0E192B] border border-[#A9C7E5]/10 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-[#A9C7E5]">
          <thead className="bg-[#08111F] text-[#70839D] uppercase text-[11px] tracking-widest font-bold border-b border-[#A9C7E5]/10">
            <tr>
              <th className="p-4">Keyword</th>
              <th className="p-4">Zip Code</th>
              <th className="p-4">Volume</th>
              <th className="p-4">Rank</th>
              <th className="p-4">Competitors</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#A9C7E5]/10">
            {filteredKeywords.map((kw) => {
              const rankTelemetry = renderRankChange(kw.rank_history);
              return (
                <tr key={kw.id} className="hover:bg-[#08111F]/50">
                  <td className="p-4 font-semibold text-[#F7FAFC]">{kw.keyword}</td>
                  <td className="p-4 font-mono text-xs">{kw.zip_code || '18360'}</td>
                  <td className="p-4 font-mono text-xs">
                    {(kw.rank_history?.[0]?.search_volume || 0).toLocaleString()}
                  </td>
                  <td className="p-4">{rankTelemetry.rankUI}</td>
                  <td className="p-4 text-xs font-mono">
                    {kw.rank_history?.[0]?.top_competitors?.join(', ') || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
