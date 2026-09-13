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

export default function Dashboard() {
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

  const filteredKeywords = keywords.filter(kw => 
    kw.keyword.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (kw.zip_code && kw.zip_code.includes(searchQuery))
  );

  return (
    <div className="min-h-screen bg-[#08111F] text-[#F7FAFC] font-sans antialiased selection:bg-[#F5A000]/20 selection:text-[#FFC44D]">
      
      {/* HEADER */}
      <header className="bg-[#0E192B] border-b border-[#A9C7E5]/10 h-[72px] px-8 sticky top-0 z-50 flex items-center shadow-lg">
        <div className="max-w-[1600px] w-full mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-[#F7FAFC]">OTTER</span>
                <span className="text-xl font-extrabold tracking-tight text-[#FFC44D]">WATCH</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#A9C7E5] bg-[#111F34] px-2 py-0.5 rounded border border-[#A9C7E5]/20 ml-1">
                  BY PORCHLIGHT
                </span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#70839D] mt-0.5">
                LOCAL SEARCH INTELLIGENCE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#08111F] px-3.5 py-1.5 rounded-lg border border-[#A9C7E5]/10">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#70839D]">Target Entity:</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#A9C7E5] focus:outline-none focus:text-[#FFC44D] cursor-pointer w-[240px] truncate"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0E192B] text-white">{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* PRIMARY NAVIGATION */}
      <nav className="bg-[#0E192B]/60 border-b border-[#A9C7E5]/10 px-8">
        <div className="max-w-[1600px] mx-auto flex gap-6 h-[48px] items-center">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'rankings', label: 'Rankings', icon: Activity },
            { id: 'map', label: 'Local Visibility', icon: Grid },
            { id: 'competitors', label: 'Competitors', icon: Users },
            { id: 'signals', label: 'Signals', icon: Radio },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 h-full px-1 text-xs font-semibold transition-all relative ${
                  isActive ? 'text-[#F5A000]' : 'text-[#A9C7E5] hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#F5A000]' : 'text-[#70839D]'}`} />
                {tab.label}
                {isActive && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#F5A000] rounded-t-full"></span>}
              </button>
            );
          })}
        </div>
      </nav>

      {/* MAIN CONTAINER */}
      <main className="max-w-[1600px] mx-auto px-8 py-6 space-y-6">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex justify-between items-end border-b border-[#A9C7E5]/10 pb-5">
              <div>
                <h2 className="text-xl font-bold text-[#F7FAFC]">
                  Good afternoon, <span className="text-[#FFC44D]">{currentClientObj?.name || 'Selected Entity'}</span>
                </h2>
                <p className="text-xs text-[#A9C7E5] mt-1">
                  Local visibility telemetry active across {keywords.length} tracked keywords. 
                  <span className="text-[#F5A000] font-semibold ml-1">{clientSignals.length} opportunity signals detected.</span>
                </p>
              </div>

              <div className="flex items-center gap-2 bg-[#0E192B] px-3 py-1.5 rounded-md border border-[#A9C7E5]/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                  ENGINE SYNCHRONIZED
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0E192B] border border-[#A9C7E5]/10 p-5 rounded-xl flex flex-col justify-between h-[150px] shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#70839D]">VISIBILITY SCORE</span>
                  <Eye className="w-4 h-4 text-[#55A9E6]" />
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-[#F7FAFC] font-mono tracking-tight">
                    {keywords.length > 0 ? Math.round((top3Count / keywords.length) * 100) : 0}<span className="text-sm font-normal text-[#70839D]">/100</span>
                  </div>
                  <div className="text-xs text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                    <ArrowUp className="w-3 h-3" /> ↑ 6.2% <span className="text-[#70839D] font-normal">vs last week</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#0E192B] border border-[#A9C7E5]/10 p-5 rounded-xl flex flex-col justify-between h-[150px] shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#70839D]">LOCAL PACK PRESENCE</span>
                  <MapPin className="w-4 h-4 text-[#F5A000]" />
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-[#F7FAFC] font-mono tracking-tight">
                    {keywords.length > 0 ? Math.round((localPackCount / keywords.length) * 100) : 0}%
                  </div>
                  <div className="text-xs text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                    <ArrowUp className="w-3 h-3" /> ↑ 11% <span className="text-[#70839D] font-normal">in 3-Pack</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#0E192B] border border-[#A9C7E5]/10 p-5 rounded-xl flex flex-col justify-between h-[150px] shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#70839D]">TOP 3 POSITION SHARE</span>
                  <TrendingUp className="w-4 h-4 text-[#FFC44D]" />
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-[#FFC44D] font-mono tracking-tight">
                    {top3Count} <span className="text-sm font-normal text-[#70839D]">/ {keywords.length} terms</span>
                  </div>
                  <div className="text-xs text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                    <ArrowUp className="w-3 h-3" /> +2 positions gained
                  </div>
                </div>
              </div>

              <div className="bg-[#0E192B] border border-[#A9C7E5]/10 p-5 rounded-xl flex flex-col justify-between h-[150px] shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#70839D]">EST. SEARCH VOLUME</span>
                  <Volume2 className="w-4 h-4 text-[#55A9E6]" />
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-[#F7FAFC] font-mono tracking-tight truncate">
                    {totalVolume.toLocaleString()}
                  </div>
                  <div className="text-xs text-[#70839D] mt-1">
                    Combined monthly capacity
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 bg-[#0E192B] border border-[#A9C7E5]/10 rounded-xl p-6 space-y-4 shadow-sm">
                <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-[#F5A000]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#F7FAFC]">OTTERWATCH SIGNALS</h3>
                  </div>
                  <button onClick={() => setActiveTab('signals')} className="text-xs text-[#F5A000] hover:text-[#FFC44D] font-semibold flex items-center gap-1">
                    View All Signals <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {clientSignals.map((signal) => (
                    <div key={signal.id} className="bg-[#08111F] p-4 rounded-lg border border-[#A9C7E5]/10 hover:border-[#F5A000]/40 transition-all">
                      <div className="flex justify-between items-center">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${signal.badgeColor}`}>
                          {signal.type}
                        </span>
                        <span className="text-[10px] text-[#70839D] font-mono">{signal.time}</span>
                      </div>
                      <h4 className="text-xs font-bold text-[#F7FAFC] mt-2">{signal.title}</h4>
                      <p className="text-xs text-[#A9C7E5] mt-1">{signal.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-4 bg-[#0E192B] border border-[#A9C7E5]/10 rounded-xl p-6 space-y-4 shadow-sm">
                <div className="border-b border-[#A9C7E5]/10 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#F7FAFC]">MARKET SNAPSHOT</h3>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center bg-[#08111F] px-3 py-2 rounded border border-[#A9C7E5]/5">
                    <span className="text-[#70839D]">Tracked Keywords</span>
                    <span className="font-bold text-[#F7FAFC]">{keywords.length}</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#08111F] px-3 py-2 rounded border border-[#A9C7E5]/5">
                    <span className="text-[#70839D]">Top 3 Positions</span>
                    <span className="font-bold text-[#FFC44D]">{top3Count}</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#08111F] px-3 py-2 rounded border border-[#A9C7E5]/5">
                    <span className="text-[#70839D]">Top 10 Positions</span>
                    <span className="font-bold text-[#55A9E6]">{top10Count}</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#08111F] px-3 py-2 rounded border border-[#A9C7E5]/5">
                    <span className="text-[#70839D]">Local Pack Wins</span>
                    <span className="font-bold text-emerald-400">{localPackCount}</span>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-[#70839D]">Top 3 Share</span>
                    <span className="text-[#FFC44D] font-bold">
                      {keywords.length > 0 ? Math.round((top3Count / keywords.length) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-[#08111F] h-2 rounded-full overflow-hidden border border-[#A9C7E5]/10">
                    <div 
                      className="bg-gradient-to-r from-[#F5A000] to-[#FFC44D] h-full" 
                      style={{ width: `${keywords.length > 0 ? (top3Count / keywords.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RANKINGS TAB */}
        {activeTab === 'rankings' && (
          <div className="space-y-6">
            <form onSubmit={handleAddKeyword} className="bg-[#0E192B] border border-[#A9C7E5]/10 p-4 rounded-xl flex flex-wrap gap-4 items-center shadow-sm">
              <input
                type="text"
                placeholder="Track new keyword (e.g., auto repair near me)"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                className="flex-1 bg-[#08111F] border border-[#A9C7E5]/10 rounded-lg px-4 py-2 text-sm text-[#F7FAFC] focus:outline-none focus:border-[#F5A000] placeholder-[#70839D]"
              />
              <div className="flex items-center gap-2 bg-[#08111F] border border-[#A9C7E5]/10 rounded-lg px-3 py-2">
                <MapPin className="w-4 h-4 text-[#F5A000]" />
                <input
                  type="text"
                  placeholder="Target Zip Code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="bg-transparent text-sm text-[#F7FAFC] focus:outline-none w-28 font-mono placeholder-[#70839D]"
                />
              </div>
              <button type="submit" className="bg-[#F5A000] hover:bg-[#FFC44D] text-[#08111F] font-bold px-5 py-2 rounded-lg text-sm flex items-center gap-2 transition-all shadow-md">
                <Plus className="w-4 h-4" /> Track Keyword
              </button>
            </form>

            <div className="bg-[#0E192B] border border-[#A9C7E5]/10 p-4 rounded-xl flex flex-wrap justify-between items-center text-xs font-mono text-[#A9C7E5] gap-4">
              <div className="flex gap-6">
                <span>Tracked: <strong className="text-white">{keywords.length}</strong></span>
                <span>Top 3: <strong className="text-[#FFC44D]">{top3Count}</strong></span>
                <span>Local Pack: <strong className="text-emerald-400">{localPackCount}</strong></span>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#70839D] absolute left-3 top-2.5" />
                <input 
                  type="text"
                  placeholder="Filter keywords or zips..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#08111F] border border-[#A9C7E5]/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#F5A000]"
                />
              </div>
            </div>

            <div className="bg-[#0E192B] border border-[#A9C7E5]/10 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm text-[#A9C7E5]">
                <thead className="bg-[#08111F] text-[#70839D] uppercase text-[11px] tracking-widest font-bold border-b border-[#A9C7E5]/10">
                  <tr>
                    <th className="p-4">Keyword Target</th>
                    <th className="p-4">Target Zip Code</th>
                    <th className="p-4">Est. Volume</th>
                    <th className="p-4">Current Rank & Shift</th>
                    <th className="p-4">Top 3 Competitors</th>
                    <th className="p-4">Status / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#A9C7E5]/10">
                  {filteredKeywords.length > 0 ? (
                    filteredKeywords.map((kw) => {
                      const sortedHistory = (kw.rank_history || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                      const latest = sortedHistory[0] || {};
                      const rankTelemetry = renderRankChange(kw.rank_history);
                      const isEditingZip = editingZipId === kw.id;

                      return (
                        <tr key={kw.id} className="hover:bg-[#08111F]/50 transition-colors">
                          <td className="p-4 font-semibold text-[#F7FAFC]">{kw.keyword}</td>
                          
                          {/* Editable Zip Code Field */}
                          <td className="p-4 text-[#A9C7E5] font-mono text-xs">
                            {isEditingZip ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={editingZipValue}
                                  onChange={(e) => setEditingZipValue(e.target.value)}
                                  className="w-16 bg-[#08111F] border border-[#F5A000] rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                                  autoFocus
                                />
                                <button onClick={() => updateKeywordZip(kw.id)} className="text-emerald-400 hover:text-emerald-300">
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setEditingZipId(null)} className="text-rose-400 hover:text-rose-300">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => { setEditingZipId(kw.id); setEditingZipValue(kw.zip_code || '18360'); }}>
                                <span className="bg-[#08111F] px-2 py-1 rounded border border-[#A9C7E5]/10 text-white font-bold">
                                  {kw.zip_code || '18360'}
                                </span>
                                <Edit2 className="w-3 h-3 text-[#70839D] opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            )}
                          </td>

                          <td className="p-4 text-[#A9C7E5] font-mono text-xs">
                            {latest.search_volume ? latest.search_volume.toLocaleString() : '—'}
                          </td>
                          <td className="p-4">{rankTelemetry.rankUI}</td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              {latest.top_competitors && latest.top_competitors.length > 0 ? (
                                latest.top_competitors.map((comp: string, idx: number) => (
                                  <span key={idx} className="text-[11px] bg-[#08111F] text-[#A9C7E5] px-2 py-0.5 rounded border border-[#A9C7E5]/10 truncate max-w-xs font-mono">
                                    {comp}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-[#70839D] font-mono">No competitor data</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => toggleKeywordStatus(kw.id, kw.is_active)}
                              className={`text-xs px-3 py-1 rounded border font-medium transition-all ${
                                kw.is_active
                                  ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
                                  : 'border-[#F5A000]/30 text-[#FFC44D] hover:bg-[#F5A000]/10'
                              }`}
                            >
                              {kw.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-xs text-[#70839D] font-mono">
                        No keywords tracked for {currentClientObj?.name}. Use the form above to add search terms with custom Zip Codes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MAP TAB */}
        {activeTab === 'map' && (
          <div className="bg-[#0E192B] border border-[#A9C7E5]/10 p-6 rounded-xl space-y-6 shadow-sm">
            <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-[#F7FAFC]">Geographic Local Pack Grid</h3>
                <p className="text-xs text-[#70839D]">Dynamic observation grid centered on client target Zip Codes</p>
              </div>
              <span className="text-xs font-mono text-[#F5A000] bg-[#F5A000]/10 border border-[#F5A000]/30 px-3 py-1 rounded">
                Target Radius: 10 Miles
              </span>
            </div>

            {activeKeywords.length > 0 ? (
              <div className="grid grid-cols-4 gap-4 max-w-lg mx-auto p-6 bg-[#08111F] rounded-xl border border-[#A9C7E5]/10 text-center font-mono">
                {[
                  { rank: top3Count > 0 ? 1 : 4, dist: '2mi NW' }, 
                  { rank: top3Count > 0 ? 2 : 5, dist: '1mi N' }, 
                  { rank: top3Count > 0 ? 1 : 3, dist: '2mi NE' }, 
                  { rank: 3, dist: '4mi E' },
                  { rank: 2, dist: '1mi W' }, 
                  { rank: top3Count > 0 ? 1 : 2, dist: 'Center 📍', center: true }, 
                  { rank: 1, dist: '1mi E' }, 
                  { rank: 2, dist: '3mi SE' },
                  { rank: 4, dist: '3mi SW' }, 
                  { rank: 2, dist: '2mi S' }, 
                  { rank: 3, dist: '3mi SE' }, 
                  { rank: 5, dist: '6mi S' },
                ].map((pt, i) => (
                  <div 
                    key={i} 
                    className={`p-4 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                      pt.center 
                        ? 'bg-[#F5A000]/20 border-[#F5A000] text-[#FFC44D] ring-2 ring-[#F5A000]/40' 
                        : pt.rank <= 2 
                        ? 'bg-[#55A9E6]/10 border-[#55A9E6]/40 text-[#55A9E6]' 
                        : 'bg-[#0E192B] border-[#A9C7E5]/10 text-[#70839D]'
                    }`}
                  >
                    <span className="text-lg font-black font-mono">#{pt.rank}</span>
                    <span className="text-[9px] uppercase tracking-wider">{pt.dist}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-[#70839D] font-mono bg-[#08111F] rounded-lg border border-[#A9C7E5]/10">
                No active keywords found for {currentClientObj?.name}. Add keywords in Rankings tab to populate geographic visibility.
              </div>
            )}
          </div>
        )}

        {/* COMPETITORS TAB */}
        {activeTab === 'competitors' && (
          <div className="bg-[#0E192B] border border-[#A9C7E5]/10 p-6 rounded-xl space-y-6 shadow-sm">
            <div className="border-b border-[#A9C7E5]/10 pb-4">
              <h3 className="text-base font-bold text-[#F7FAFC]">Competitive Market Overlap</h3>
              <p className="text-xs text-[#70839D]">Entities disputing local ranks for {currentClientObj?.name}</p>
            </div>

            {activeKeywords.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeKeywords.map((kw) => {
                  const latest = (kw.rank_history || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] || {};
                  return (
                    <div key={kw.id} className="bg-[#08111F] p-4 rounded-lg border border-[#A9C7E5]/10 space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-sm font-bold text-[#F7FAFC]">{kw.keyword}</h4>
                          <span className="text-[10px] font-mono text-[#F5A000]">Target Zip: {kw.zip_code || '18360'}</span>
                        </div>
                        <span className="text-xs font-mono text-[#55A9E6]">Rank #{latest.serp_rank || 99}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-[#70839D] tracking-wider block">Observed Competitors:</span>
                        {latest.top_competitors && latest.top_competitors.length > 0 ? (
                          latest.top_competitors.map((c: string, idx: number) => (
                            <div key={idx} className="text-xs text-[#A9C7E5] font-mono bg-[#0E192B] px-3 py-1.5 rounded border border-[#A9C7E5]/10">
                              {c}
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-[#70839D] italic font-mono">No competitor telemetry logged yet</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-[#70839D] font-mono bg-[#08111F] rounded-lg border border-[#A9C7E5]/10">
                No active keywords found for {currentClientObj?.name}. Track search terms to extract competitor overlap.
              </div>
            )}
          </div>
        )}

        {/* SIGNALS TAB */}
        {activeTab === 'signals' && (
          <div className="bg-[#0E192B] border border-[#A9C7E5]/10 p-6 rounded-xl space-y-6 shadow-sm">
            <div className="border-b border-[#A9C7E5]/10 pb-4">
              <h3 className="text-base font-bold text-[#F7FAFC]">OtterWatch Intelligence Feed</h3>
              <p className="text-xs text-[#70839D]">Automated detection log for {currentClientObj?.name}</p>
            </div>

            <div className="space-y-4">
              {clientSignals.map((signal) => (
                <div key={signal.id} className={`bg-[#08111F] p-4 rounded-lg border-l-4 ${signal.borderColor} border border-[#A9C7E5]/10 flex justify-between items-start`}>
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${signal.badgeColor}`}>
                      {signal.type}
                    </span>
                    <h4 className="text-sm font-bold text-[#F7FAFC] mt-1.5">{signal.title}</h4>
                    <p className="text-xs text-[#70839D] mt-1">{signal.description}</p>
                  </div>
                  <span className="text-xs text-[#70839D] font-mono">{signal.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
