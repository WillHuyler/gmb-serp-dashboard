"use client";
import React, { useState } from 'react';
import { Bot, CheckCircle2, XCircle, ArrowUpRight } from 'lucide-react';

interface AIPresenceRecord {
  engine: string;
  prompt: string;
  brandMentioned: boolean;
  citationPresent: boolean;
  citedUrl: string;
  competitorsMentioned: string[];
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  lastChecked: string;
}

const MOCK_AI_DATA: AIPresenceRecord[] = [
  {
    engine: 'Google AI Overview',
    prompt: 'best emergency dentist near me',
    brandMentioned: true,
    citationPresent: true,
    citedUrl: 'apex-dental.com/emergency-services',
    competitorsMentioned: ['BrightSmile Care', 'Downtown Dental'],
    sentiment: 'Positive',
    lastChecked: '2 hours ago'
  },
  {
    engine: 'ChatGPT (GPT-4o)',
    prompt: 'top rated cosmetic dentists for veneers',
    brandMentioned: true,
    citationPresent: true,
    citedUrl: 'apex-dental.com/cosmetic-veneers',
    competitorsMentioned: ['Elite Dentistry Group'],
    sentiment: 'Positive',
    lastChecked: '4 hours ago'
  },
  {
    engine: 'Perplexity AI',
    prompt: 'affordable dental implants with good reviews',
    brandMentioned: false,
    citationPresent: false,
    citedUrl: 'N/A',
    competitorsMentioned: ['BrightSmile Care', 'Metro Health Dental'],
    sentiment: 'Neutral',
    lastChecked: '6 hours ago'
  },
  {
    engine: 'Gemini 1.5 Pro',
    prompt: 'who is the best pediatric dentist in town',
    brandMentioned: true,
    citationPresent: false,
    citedUrl: 'N/A',
    competitorsMentioned: ['Pediatric Dental Associates'],
    sentiment: 'Positive',
    lastChecked: '1 day ago'
  },
  {
    engine: 'Claude 3.5 Sonnet',
    prompt: 'same day tooth extraction reviews',
    brandMentioned: false,
    citationPresent: false,
    citedUrl: 'N/A',
    competitorsMentioned: ['Urgent Dental Care Hub'],
    sentiment: 'Neutral',
    lastChecked: '1 day ago'
  }
];

export default function AIVisibilityPage() {
  const [filter, setFilter] = useState<string>('all');

  const filteredData = filter === 'all' 
    ? MOCK_AI_DATA 
    : MOCK_AI_DATA.filter(d => d.engine.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-[#102033] tracking-tight">AI Visibility & Presence</h1>
            <span className="bg-[#F5A000]/10 text-[#F5A000] border border-[#F5A000]/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">
              Synthetic & Observational Telemetry
            </span>
          </div>
          <p className="text-xs text-[#5E7187] mt-1">
            Brand share of voice, citation tracking, and competitive context across major LLM search engines.
          </p>
        </div>

        <div className="flex gap-2 font-mono text-xs">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] px-3 py-2 rounded-lg text-center shadow-sm">
            <span className="text-[10px] text-[#5E7187] block uppercase font-bold">AI Share of Voice</span>
            <span className="text-lg font-bold text-[#102033]">60.0%</span>
          </div>
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] px-3 py-2 rounded-lg text-center shadow-sm">
            <span className="text-[10px] text-[#5E7187] block uppercase font-bold">Citation Rate</span>
            <span className="text-lg font-bold text-emerald-600">40.0%</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-[#E2E8F0] pb-3 text-xs font-semibold text-[#5E7187]">
        {['all', 'Google', 'ChatGPT', 'Perplexity', 'Gemini', 'Claude'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md capitalize transition-all ${
              filter === f ? 'bg-[#102033] text-white' : 'hover:bg-[#FFFFFF] hover:text-[#102033]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F4F6F8] border-b border-[#E2E8F0] text-[10px] font-mono text-[#5E7187] uppercase tracking-wider">
              <th className="p-4">AI Engine</th>
              <th className="p-4">Monitored Prompt</th>
              <th className="p-4">Brand Mention</th>
              <th className="p-4">Citation Source</th>
              <th className="p-4">Competitors Cited</th>
              <th className="p-4 text-right">Last Verified</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] text-xs text-[#102033]">
            {filteredData.map((row, idx) => (
              <tr key={idx} className="hover:bg-[#F4F6F8]/50 transition-colors">
                <td className="p-4 font-bold flex items-center gap-2">
                  <Bot className="w-4 h-4 text-[#3498DB]" />
                  {row.engine}
                </td>
                <td className="p-4 font-mono text-[#5E7187]">"{row.prompt}"</td>
                <td className="p-4">
                  {row.brandMentioned ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      <XCircle className="w-3.5 h-3.5" /> No
                    </span>
                  )}
                </td>
                <td className="p-4 font-mono text-[11px]">
                  {row.citationPresent ? (
                    <a href={`https://${row.citedUrl}`} target="_blank" rel="noreferrer" className="text-[#3498DB] hover:underline flex items-center gap-1">
                      {row.citedUrl} <ArrowUpRight className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-400">Uncited</span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {row.competitorsMentioned.map((c, i) => (
                      <span key={i} className="bg-[#F4F6F8] border border-[#E2E8F0] text-[#5E7187] text-[10px] px-1.5 py-0.5 rounded font-mono">
                        {c}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-4 text-right font-mono text-[#5E7187] text-[11px]">
                  {row.lastChecked}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
