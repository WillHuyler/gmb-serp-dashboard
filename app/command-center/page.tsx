"use client";
import React from 'react';
import { Sparkles, Lock, Search, Bot } from 'lucide-react';
import { MarketingTimeline } from '../../components/timeline/MarketingTimeline';

export default function CommandCenterPage() {
  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-[#102033] tracking-tight">Executive Command Center</h1>
          <p className="text-xs text-[#5E7187] mt-1">
            Unified cross-channel marketing performance, statistical signals, and executive AI summary.
          </p>
        </div>

        <div className="flex gap-2 font-mono text-xs">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] px-4 py-2 rounded-xl shadow-sm text-right">
            <span className="text-[10px] text-[#5E7187] block uppercase font-bold">Total Marketing Spend</span>
            <span className="text-xl font-extrabold text-[#102033]">$12,450.00</span>
          </div>
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] px-4 py-2 rounded-xl shadow-sm text-right">
            <span className="text-[10px] text-[#5E7187] block uppercase font-bold">Qualified Leads</span>
            <span className="text-xl font-extrabold text-emerald-600">184</span>
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
          Strong Local Visibility Surge (+14%), But Paid CPA Drift Requires Attention
        </h2>

        <p className="text-xs text-[#A9C7E5] leading-relaxed max-w-4xl">
          Over the last 30 days, <strong>OtterWatch Local Pack Visibility</strong> improved across 4 primary zip codes, driving a 12% increase in organic phone inquiries. However, Google Ads Cost Per Lead drifted up +60.2% ($68.10 CPL) due to exact-match search term expansion. Outcome Lab recommends re-allocating $1,200 into local geo-targeted campaigns to stabilize overall CPA.
        </p>
      </div>

      {/* Active vs Passive Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Active: OtterWatch */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-[#3498DB]" />
              <span className="text-xs font-extrabold text-[#102033]">OtterWatch SERP</span>
            </div>
            <span className="bg-emerald-100 text-emerald-700 text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase">
              Connected
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#5E7187] uppercase font-mono">Local Pack Visibility</span>
            <div className="text-2xl font-extrabold text-[#102033]">78.4%</div>
            <span className="text-xs text-emerald-600 font-bold">↑ +4.2% this period</span>
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
            <span className="text-xs text-[#5E7187] font-semibold">Across 5 Monitored LLMs</span>
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
