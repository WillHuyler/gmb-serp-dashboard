"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, CheckCircle, ArrowUp, ArrowDown, Minus } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function Dashboard() {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [keywords, setKeywords] = useState<any[]>([]);
  const [newKeyword, setNewKeyword] = useState<string>('');
  const [location, setLocation] = useState<string>('Stroudsburg, Pennsylvania');

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClient) loadKeywords();
  }, [selectedClient]);

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
      alert("Active quota reached! You can only track 5 active keywords per client. Prune an underperforming keyword before adding a new one.");
      return;
    }

    await supabase.from('keyword_library').insert({
      client_id: selectedClient,
      keyword: newKeyword.trim(),
      location: location,
      is_active: true,
    });

    setNewKeyword('');
    loadKeywords();
  };

  const toggleKeywordStatus = async (id: number, currentStatus: boolean) => {
    if (!currentStatus) {
      const activeCount = keywords.filter((k) => k.is_active).length;
      if (activeCount >= 5) {
        alert("Cannot activate! Client already has 5 active keywords.");
        return;
      }
    }

    await supabase
      .from('keyword_library')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    loadKeywords();
  };

  const renderRankChange = (history: any[]) => {
    if (!history || history.length === 0) return <span className="text-slate-500">Pending Run</span>;
    
    const sorted = [...history].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const latest = sorted[0];
    const previous = sorted[1];

    if (!previous) {
      return (
        <span className="font-bold text-emerald-400">
          #{latest.serp_rank} <span className="text-xs text-slate-500 font-normal">(New)</span>
        </span>
      );
    }

    const diff = previous.serp_rank - latest.serp_rank;
    return (
      <div className="flex items-center gap-2">
        <span className="font-bold text-white">#{latest.serp_rank}</span>
        {diff > 0 && <span className="text-xs text-emerald-400 flex items-center"><ArrowUp className="w-3 h-3"/> +{diff}</span>}
        {diff < 0 && <span className="text-xs text-rose-400 flex items-center"><ArrowDown className="w-3 h-3"/> {diff}</span>}
        {diff === 0 && <span className="text-xs text-slate-500 flex items-center"><Minus className="w-3 h-3"/> 0</span>}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
            Dominate Ignite Portal
          </h1>
          <p className="text-sm text-slate-400">Historical SERP Telemetry & Keyword Manager</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-400">Selected Client:</label>
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <form onSubmit={handleAddKeyword} className="bg-slate-900 border border-slate-800 p-4 rounded-xl mb-8 flex flex-wrap gap-4 items-center">
        <input
          type="text"
          placeholder="Enter keyword (e.g., auto repair stroudsburg)"
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
        />
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
        />
        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add to Tracker
        </button>
      </form>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-800 text-slate-400 uppercase text-xs">
            <tr>
              <th className="p-4">Keyword</th>
              <th className="p-4">Location</th>
              <th className="p-4">Status</th>
              <th className="p-4">Current Rank & Shift</th>
              <th className="p-4">Action / Prune</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {keywords.map((kw) => (
              <tr key={kw.id} className="hover:bg-slate-800/50">
                <td className="p-4 font-medium text-white">{kw.keyword}</td>
                <td className="p-4 text-slate-400">{kw.location}</td>
                <td className="p-4">
                  {kw.is_active ? (
                    <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/20">
                      <CheckCircle className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs bg-slate-800 text-slate-500 px-2 py-1 rounded-full border border-slate-700">
                      Archived
                    </span>
                  )}
                </td>
                <td className="p-4">{renderRankChange(kw.rank_history)}</td>
                <td className="p-4">
                  <button
                    onClick={() => toggleKeywordStatus(kw.id, kw.is_active)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      kw.is_active
                        ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
                        : 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10'
                    }`}
                  >
                    {kw.is_active ? 'Prune (Deactivate)' : 'Reactivate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
