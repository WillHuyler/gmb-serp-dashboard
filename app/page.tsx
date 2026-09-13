"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { BarChart3, Users, Search, Activity, RefreshCw } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'summary' | 'intelligence' | 'roster'>('summary');
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase.from('clients').select('*, gmb_serp_metrics(*)');
      if (data) setClients(data);
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
            Dominate Ignite Portal
          </h1>
          <p className="text-sm text-slate-400">GMB & SERP Telemetry Engine</p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full text-emerald-400">
          <Activity className="w-4 h-4" /> Live Sync Active
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex gap-4 mb-8 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('summary')}
          className={`pb-3 px-2 flex items-center gap-2 font-medium text-sm border-b-2 transition-all ${
            activeTab === 'summary'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Executive Summary
        </button>
        <button
          onClick={() => setActiveTab('intelligence')}
          className={`pb-3 px-2 flex items-center gap-2 font-medium text-sm border-b-2 transition-all ${
            activeTab === 'intelligence'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Search className="w-4 h-4" /> Search & Local Intelligence
        </button>
        <button
          onClick={() => setActiveTab('roster')}
          className={`pb-3 px-2 flex items-center gap-2 font-medium text-sm border-b-2 transition-all ${
            activeTab === 'roster'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" /> Account Roster ({clients.length})
        </button>
      </div>

      {/* Dynamic Tab Views */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Fetching latest metrics...
        </div>
      ) : (
        <div>
          {activeTab === 'summary' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                <span className="text-slate-400 text-sm">Total Accounts</span>
                <p className="text-3xl font-bold mt-2 text-white">{clients.length}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                <span className="text-slate-400 text-sm">Pipeline Status</span>
                <p className="text-3xl font-bold mt-2 text-emerald-400">Operational</p>
              </div>
            </div>
          )}

          {activeTab === 'roster' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800 text-slate-400 uppercase text-xs">
                  <tr>
                    <th className="p-4">Client Name</th>
                    <th className="p-4">Store Code</th>
                    <th className="p-4">Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {clients.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/50">
                      <td className="p-4 font-medium text-white">{c.name}</td>
                      <td className="p-4 text-slate-400">{c.store_code || 'N/A'}</td>
                      <td className="p-4 text-slate-400">{c.address || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
