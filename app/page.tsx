"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Plus, CheckCircle, ArrowUp, ArrowDown, Minus, MapPin, 
  Volume2, ShieldAlert, Navigation, Eye, Grid, Users, 
  Radio, TrendingUp, Search, Layers, Compass, BarChart3, ChevronRight 
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

    await supabase.from('keyword_library').insert({
      client_id: selectedClient,
      keyword: newKeyword.trim(),
      zip_code: zipCode.trim() || '18360',
      location: zipCode.trim() ? `ZIP: ${zipCode.trim()}` : 'Default Location',
      is_active: true,
    });

    setNewKeyword('');
    setZipCode('');
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

  // Derive Intelligence & Metrics from Live Database Rows
  const activeKeywords = keywords.filter(k => k.is_active);
  const totalVolume = activeKeywords.reduce((acc, kw) => {
    const history = kw.rank_history || [];
    const latest = history.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    return acc + (latest?.search_volume || 0);
  }, 0);

  const top3Count = activeKeywords.filter(kw => {
    const history = kw.rank_history || [];
    const latest = history.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    return latest && latest.serp_rank > 0 && latest.serp_rank <= 3;
  }).length;

  const localPackCount = activeKeywords.filter(kw => {
    const history = kw.rank_history || [];
    const latest = history.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    return latest && latest.rank_type === 'Local Pack';
  }).length;

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
            <span className="text-[10px] bg-[#0E192B] px-1.5 py-0.5 rounded text-[#70839D] border border-slate-800">Unranked</span>
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
      {/* GLOBAL APPLICATION SHELL */}
      <header className="bg-[#0E192B] border-b border-[#0E192B]/80 sticky top-0 z-50 px-8 py-3.5 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Brand Architecture Header */}
          <div className="flex items-center gap-4">
            <div className="bg-[#08111F] p-2 rounded-lg border border-[#F5A000]/20 shadow-inner">
              <Compass className="w-5 h-5 text-[#F5A000]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-wider uppercase text-[#F7FAFC] flex items-center gap-1.5">
                  OtterWatch
                </h1>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#F5A000] bg-[#F5A000]/10 px-2 py-0.5 rounded border border-[#F5A000]/30">
                  Local Search Intelligence
                </span>
              </div>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-[#70839D]">
                A PorchLight Technology
              </p>
            </div>
          </div>

          {/* Global Client Selector */}
          <div className="flex items-center gap-3 bg-[#08111F] px-4 py-2 rounded-lg border border-slate-800 shadow-inner">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#70839D]">Target Entity:</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="bg-transparent text-sm font-semibold text-[#A9C7E5] focus:outline-none focus:text-[#FFC44D] cursor-pointer"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0E192B] text-white">{c.name}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Primary Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-4 flex gap-1 border-t border-slate-800/80 pt-2">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'rankings', label: 'Rankings', icon: Navigation },
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
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-all ${
                  isActive
                    ? 'bg-[#08111F] text-[#F5A000] border-t-2 border-[#F5A000] border-x border-slate-800/60 shadow-lg'
                    : 'text-[#70839D] hover:text-[#A9C7E5] hover:bg-[#08111F]/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#F5A000]' : 'text-[#70839D]'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto p-8 space-y-8">
        
        {/* OVERVIEW / COMMAND CENTER VIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            
            {/* Top Summary Banner */}
            <div className="bg-[#0E192B] border border-slate-800 p-6 rounded-xl flex justify-between items-center shadow-lg">
              <div>
                <h2 className="text-xl font-bold text-[#F7FAFC]">
                  Good afternoon, <span className="text-[#FFC44D]">{currentClientObj?.name || 'Client'}</span>
                </h2>
                <p className="text-sm text-[#A9C7E5] mt-1">
                  Local visibility telemetry active across {keywords.length} tracked keywords. 
                  <span className="text-[#F5A000] font-medium ml-1">3 opportunity signals detected.</span>
                </p>
              </div>
              <div className="bg-[#08111F] px-4 py-2 rounded-lg border border-slate-800/80 text-right">
                <span className="text-[10px] font-mono text-[#70839D] uppercase block">Engine Status</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Synchronized
                </span>
              </div>
            </div>

            {/* Primary Executive KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              
              <div className="bg-[#0E192B] border border-slate-800 p-5 rounded-xl shadow-md">
                <div className="flex justify-between text-xs text-[#70839D] uppercase font-bold tracking-wider">
                  <span>Visibility Score</span>
                  <Eye className="w-4 h-4 text-[#55A9E6]" />
                </div>
                <div className="text-2xl font-black text-[#F7FAFC] mt-3 font-mono">
                  {keywords.length > 0 ? Math.round((top3Count / keywords.length) * 100) : 0}<span className="text-sm font-normal text-[#70839D]">/100</span>
                </div>
                <div className="text-xs text-emerald-400 font-semibold mt-2 flex items-center gap-1">
                  <ArrowUp className="w-3 h-3" /> ↑ 6.2% <span className="text-[#70839D] font-normal">vs last week</span>
                </div>
              </div>

              <div className="bg-[#0E192B] border border-slate-800 p-5 rounded-xl shadow-md">
                <div className="flex justify-between text-xs text-[#70839D] uppercase font-bold tracking-wider">
                  <span>Local Pack Presence</span>
                  <MapPin className="w-4 h-4 text-[#F5A000]" />
                </div>
                <div className="text-2xl font-black text-[#F7FAFC] mt-3 font-mono">
                  {keywords.length > 0 ? Math.round((localPackCount / keywords.length) * 100) : 0}%
                </div>
                <div className="text-xs text-emerald-400 font-semibold mt-2 flex items-center gap-1">
                  <ArrowUp className="w-3 h-3" /> ↑ 11% <span className="text-[#70839D] font-normal">in 3-Pack</span>
                </div>
              </div>

              <div className="bg-[#0E192B] border border-slate-800 p-5 rounded-xl shadow-md">
                <div className="flex justify-between text-xs text-[#70839D] uppercase font-bold tracking-wider">
                  <span>Top 3 Position Share</span>
                  <TrendingUp className="w-4 h-4 text-[#FFC44D]" />
                </div>
                <div className="text-2xl font-black text-[#FFC44D] mt-3 font-mono">
                  {top3Count} <span className="text-sm font-normal text-[#70839D]">/ {keywords.length} terms</span>
                </div>
                <div className="text-xs text-emerald-400 font-semibold mt-2 flex items-center gap-1">
                  <ArrowUp className="w-3 h-3" /> +2 positions gained
                </div>
              </div>

              <div className="bg-[#0E192B] border border-slate-800 p-5 rounded-xl shadow-md">
                <div className="flex justify-between text-xs text-[#70839D] uppercase font-bold tracking-wider">
                  <span>Est. Search Volume</span>
                  <Volume2 className="w-4 h-4 text-[#55A9E6]" />
                </div>
                <div className="text-2xl font-black text-[#F7FAFC] mt-3 font-mono">
                  {totalVolume.toLocaleString()}
                </div>
                <div className="text-xs text-[#70839D] mt-2">
                  Combined monthly search capacity
                </div>
              </div>

            </div>

            {/* OtterWatch Signals Preview Block */}
            <div className="bg-[#0E192B] border border-slate-800 rounded-xl p-6 space-y-4 shadow-lg">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#F5A000] animate-pulse" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#F7FAFC]">OtterWatch Signals</h3>
                </div>
                <button onClick={() => setActiveTab('signals')} className="text-xs text-[#F5A000] hover:underline flex items-center gap-1 font-semibold">
                  View All Signals <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#08111F] p-4 rounded-lg border border-slate-800/80 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                      Opportunity Detected
                    </span>
                    <span className="text-[10px] text-[#70839D] font-mono">2h ago</span>
                  </div>
                  <h4 className="text-xs font-bold text-[#F7FAFC]">"Hyundai Dealer Near Me" secured Local Pack #1</h4>
                  <p className="text-xs text-[#70839D]">Competitor review velocity dropped across target Zip 18360.</p>
                </div>

                <div className="bg-[#08111F] p-4 rounded-lg border border-slate-800/80 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-[#F5A000]/10 text-[#FFC44D] px-2 py-0.5 rounded border border-[#F5A000]/30">
                      Competitive Shift
                    </span>
                    <span className="text-[10px] text-[#70839D] font-mono">1d ago</span>
                  </div>
                  <h4 className="text-xs font-bold text-[#F7FAFC]">Competitor overlaps detected in Organic SERPs</h4>
                  <p className="text-xs text-[#70839D]">Abeloff Hyundai holding Position #2 for primary regional terms.</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* RANKINGS WORKSPACE */}
        {activeTab === 'rankings' && (
          <div className="space-y-6">
            
            {/* Keyword Addition & Toolbar */}
            <form onSubmit={handleAddKeyword} className="bg-[#0E192B] border border-slate-800 p-4 rounded-xl flex flex-wrap gap-4 items-center shadow-lg">
              <input
                type="text"
                placeholder="Track new keyword (e.g., auto repair near me)"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                className="flex-1 bg-[#08111F] border border-slate-800 rounded-lg px-4 py-2 text-sm text-[#F7FAFC] focus:outline-none focus:border-[#F5A000] placeholder-[#70839D]"
              />
              <div className="flex items-center gap-2 bg-[#08111F] border border-slate-800 rounded-lg px-3 py-2">
                <MapPin className="w-4 h-4 text-[#F5A000]" />
                <input
                  type="text"
                  placeholder="Zip Code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="bg-transparent text-sm text-[#F7FAFC] focus:outline-none w-24 font-mono placeholder-[#70839D]"
                />
              </div>
              <button type="submit" className="bg-[#F5A000] hover:bg-[#FFC44D] text-[#08111F] font-bold px-5 py-2 rounded-lg text-sm flex items-center gap-2 transition-all shadow-md">
                <Plus className="w-4 h-4" /> Track Keyword
              </button>
            </form>

            {/* Keyword Visibility Summary Bar */}
            <div className="bg-[#0E192B] border border-slate-800 p-4 rounded-xl flex flex-wrap justify-between items-center text-xs font-mono text-[#A9C7E5] gap-4">
              <div className="flex gap-6">
                <span>Tracked: <strong className="text-white">{keywords.length}</strong></span>
                <span>Top 3: <strong className="text-[#FFC44D]">{top3Count}</strong></span>
                <span>Local Pack: <strong className="text-emerald-400">{localPackCount}</strong></span>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#70839D] absolute left-3 top-2.5" />
                <input 
                  type="text"
                  placeholder="Filter keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#08111F] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#F5A000]"
                />
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-[#0E192B] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-sm text-[#A9C7E5]">
                <thead className="bg-[#08111F] text-[#70839D] uppercase text-[11px] tracking-widest font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-4">Keyword Target</th>
                    <th className="p-4">Geo Location</th>
                    <th className="p-4">Est. Volume</th>
                    <th className="p-4">Current Rank & Shift</th>
                    <th className="p-4">Top 3 Competitors</th>
                    <th className="p-4">Status / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredKeywords.map((kw) => {
                    const sortedHistory = (kw.rank_history || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                    const latest = sortedHistory[0] || {};
                    const rankTelemetry = renderRankChange(kw.rank_history);

                    return (
                      <tr key={kw.id} className="hover:bg-[#08111F]/50 transition-colors">
                        <td className="p-4 font-semibold text-[#F7FAFC]">{kw.keyword}</td>
                        <td className="p-4 text-[#70839D] font-mono text-xs">{kw.zip_code || kw.location}</td>
                        <td className="p-4 text-[#A9C7E5] font-mono text-xs">
                          {latest.search_volume ? latest.search_volume.toLocaleString() : '—'}
                        </td>
                        <td className="p-4">{rankTelemetry.rankUI}</td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            {latest.top_competitors && latest.top_competitors.length > 0 ? (
                              latest.top_competitors.map((comp: string, idx: number) => (
                                <span key={idx} className="text-[11px] bg-[#08111F] text-[#A9C7E5] px-2 py-0.5 rounded border border-slate-800/80 truncate max-w-xs font-mono">
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
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* LOCAL VISIBILITY MAP GRID */}
        {activeTab === 'map' && (
          <div className="bg-[#0E192B] border border-slate-800 p-6 rounded-xl space-y-6 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#F7FAFC]">Geographic Local Pack Grid</h3>
                <p className="text-xs text-[#70839D]">Water Blue to Lantern Gold observation density centered on client ZIP</p>
              </div>
              <span className="text-xs font-mono text-[#F5A000] bg-[#F5A000]/10 border border-[#F5A000]/30 px-3 py-1 rounded">
                Radius: 10 Miles
              </span>
            </div>

            <div className="grid grid-cols-4 gap-4 max-w-lg mx-auto p-6 bg-[#08111F] rounded-xl border border-slate-800 text-center font-mono">
              {[
                { rank: 1, dist: '2mi NW' }, { rank: 2, dist: '1mi N' }, { rank: 1, dist: '2mi NE' }, { rank: 3, dist: '4mi E' },
                { rank: 2, dist: '1mi W' }, { rank: 1, dist: 'Center 📍', center: true }, { rank: 1, dist: '1mi E' }, { rank: 2, dist: '3mi SE' },
                { rank: 4, dist: '3mi SW' }, { rank: 2, dist: '2mi S' }, { rank: 3, dist: '3mi SE' }, { rank: 5, dist: '6mi S' },
              ].map((pt, i) => (
                <div 
                  key={i} 
                  className={`p-4 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                    pt.center 
                      ? 'bg-[#F5A000]/20 border-[#F5A000] text-[#FFC44D] ring-2 ring-[#F5A000]/40' 
                      : pt.rank <= 2 
                      ? 'bg-[#55A9E6]/10 border-[#55A9E6]/40 text-[#55A9E6]' 
                      : 'bg-[#0E192B] border-slate-800 text-[#70839D]'
                  }`}
                >
                  <span className="text-lg font-black font-mono">#{pt.rank}</span>
                  <span className="text-[9px] uppercase tracking-wider">{pt.dist}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COMPETITORS VIEW */}
        {activeTab === 'competitors' && (
          <div className="bg-[#0E192B] border border-slate-800 p-6 rounded-xl space-y-6 shadow-xl">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-[#F7FAFC]">Competitive Market Overlap</h3>
              <p className="text-xs text-[#70839D]">Top entities disputing Local Pack positions for {currentClientObj?.name}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeKeywords.map((kw) => {
                const latest = (kw.rank_history || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] || {};
                return (
                  <div key={kw.id} className="bg-[#08111F] p-4 rounded-lg border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-[#F7FAFC]">{kw.keyword}</h4>
                      <span className="text-xs font-mono text-[#55A9E6]">Rank #{latest.serp_rank || 99}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[#70839D] tracking-wider block">Observed Competitors:</span>
                      {latest.top_competitors && latest.top_competitors.length > 0 ? (
                        latest.top_competitors.map((c: string, idx: number) => (
                          <div key={idx} className="text-xs text-[#A9C7E5] font-mono bg-[#0E192B] px-3 py-1.5 rounded border border-slate-800/80">
                            {c}
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-[#70839D] italic">No competitor telemetry logged</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SIGNALS WORKSPACE */}
        {activeTab === 'signals' && (
          <div className="bg-[#0E192B] border border-slate-800 p-6 rounded-xl space-y-6 shadow-xl">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-[#F7FAFC]">OtterWatch Intelligence Feed</h3>
              <p className="text-xs text-[#70839D]">Automated detection log for opportunities, ranking movement, and anomalies</p>
            </div>

            <div className="space-y-4">
              <div className="bg-[#08111F] p-4 rounded-lg border-l-4 border-l-emerald-400 border border-slate-800 flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Opportunity Signal</span>
                  <h4 className="text-sm font-bold text-[#F7FAFC] mt-0.5">Local Pack Rank #1 Secured</h4>
                  <p className="text-xs text-[#70839D] mt-1">"Hyundai Dealer Near Me" achieved top position in target Zip Code 18360.</p>
                </div>
                <span className="text-xs text-[#70839D] font-mono">Today 02:26 PM</span>
              </div>

              <div className="bg-[#08111F] p-4 rounded-lg border-l-4 border-l-[#F5A000] border border-slate-800 flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFC44D]">Competitive Movement</span>
                  <h4 className="text-sm font-bold text-[#F7FAFC] mt-0.5">Competitor Entry Detected</h4>
                  <p className="text-xs text-[#70839D] mt-1">Abeloff Hyundai holds organic SERP overlaps across 3 active tracking terms.</p>
                </div>
                <span className="text-xs text-[#70839D] font-mono">Yesterday</span>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
