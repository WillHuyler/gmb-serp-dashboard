"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, CheckCircle, ArrowUp, ArrowDown, Minus, MapPin, Volume2, ShieldAlert } from 'lucide-react';

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

  const renderTelemetry = (history: any[]) => {
    if (!history || history.length === 0) return { rankUI: <span className="text-slate-500 font-mono">Pending Sync</span>, volume: '—', competitors: [] };

    const sorted = [...history].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const latest = sorted[0];
    const previous = sorted[1];

    let rankUI;
    if (!previous) {
      rankUI = <span className="font-bold text-amber-400 font-mono">#{latest.serp_rank} (New)</span>;
    } else {
      const diff = previous.serp_rank - latest.serp_rank;
      rankUI = (
        <div className="flex items-center gap-2 font-mono">
          <span className="font-bold text-slate-100">#{latest.serp_rank}</span>
          {diff > 0 && <span className="text-xs text-emerald-400 font-semibold flex items-center"><ArrowUp className="w-3 h-3"/> +{diff}</span>}
          {diff < 0 && <span className="text-xs text-rose-500 font-semibold flex items-center"><ArrowDown className="w-3 h-3"/> {diff}</span>}
          {diff === 0 && <span className="text-xs text-slate-500 flex items-center"><Minus className="w-3 h-3"/> 0</span>}
        </div>
      );
    }

    return {
      rankUI,
      volume: latest.search_volume ? latest.search_volume.toLocaleString() : '—',
      competitors: latest.top_competitors || []
    };
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 p-8 font-sans selection:bg-amber-500/30 selection:text-amber-300">
      {/* Header with Dominate Ignite Infrastructure Palette */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-amber-400 via-amber-500 to-red-500 bg-clip-text text-transparent">
              OtterWatch
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-900 text-amber-400/90 px-2 py-0.5 rounded border border-amber-500/20 shadow-sm">
              by PorchLight
            </span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mt-1">
            Local Search Intelligence
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Target Entity:</label>
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="bg-[#0F172A] border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60 shadow-inner font-medium"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Input Form featuring Dominate Ignite Amber CTA */}
      <form onSubmit={handleAddKeyword} className="bg-[#0F172A] border border-slate-800/90 p-4 rounded-xl mb-8 flex flex-wrap gap-4 items-center shadow-xl">
        <input
          type="text"
          placeholder="Enter keyword (e.g., auto repair near me)"
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          className="flex-1 bg-[#0B1120] border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500/70 placeholder-slate-500"
        />
        <div className="flex items-center gap-2 bg-[#0B1120] border border-slate-800 rounded-lg px-3.5 py-2.5">
          <MapPin className="w-4 h-4 text-amber-500" />
          <input
            type="text"
            placeholder="Zip Code"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            className="bg-transparent text-sm text-slate-100 focus:outline-none w-28 placeholder-slate-500 font-mono"
          />
        </div>
        <button type="submit" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-all shadow-md shadow-amber-950/20">
          <Plus className="w-4 h-4 text-slate-950" /> Track Telemetry
        </button>
      </form>

      {/* Database Telemetry Table */}
      <div className="bg-[#0F172A] border border-slate-800/90 rounded-xl overflow-hidden shadow-2xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-[#0B1120] text-slate-400 uppercase text-[11px] tracking-widest font-bold border-b border-slate-800">
            <tr>
              <th className="p-4">Keyword Target</th>
              <th className="p-4">Geo Location</th>
              <th className="p-4">Est. Volume</th>
              <th className="p-4">Rank & Shift</th>
              <th className="p-4">Top 3 Competitors</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {keywords.map((kw) => {
              const telemetry = renderTelemetry(kw.rank_history);
              return (
                <tr key={kw.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 font-semibold text-slate-100">{kw.keyword}</td>
                  <td className="p-4 text-slate-400 font-mono text-xs">{kw.zip_code || kw.location}</td>
                  <td className="p-4 text-slate-300 font-mono text-xs flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-amber-400"/> {telemetry.volume}
                  </td>
                  <td className="p-4">{telemetry.rankUI}</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      {telemetry.competitors.length > 0 ? (
                        telemetry.competitors.map((comp: string, idx: number) => (
                          <span key={idx} className="text-[11px] bg-[#0B1120] text-slate-300 px-2.5 py-1 rounded border border-slate-800/80 truncate max-w-xs font-mono">
                            {comp}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-600 font-mono">No competitor data logged</span>
                      )}
                    </div>
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
