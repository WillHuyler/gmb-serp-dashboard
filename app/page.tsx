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

// HELPER FUNCTION MOVED OUTSIDE DASHBOARD COMPONENT TO SCOPE CLEANLY
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

export default function Dashboard() {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [keywords, setKeywords] = useState<any[]>([]);
  // ... rest of component logic
