"use client";
import React from 'react';
import { Calendar } from 'lucide-react';

export interface MarketingEvent {
  id: string;
  date: string;
  title: string;
  category: 'Google Ads' | 'Meta Ads' | 'GBP' | 'Algorithm' | 'CRM Workflow';
  impact: 'High' | 'Medium' | 'Low';
  description: string;
}

const MOCK_EVENTS: MarketingEvent[] = [
  {
    id: 'evt-101',
    date: 'Sep 10, 2026',
    title: 'Google Core Algorithm Update',
    category: 'Algorithm',
    impact: 'High',
    description: 'Widespread local pack indexing updates detected across healthcare queries.'
  },
  {
    id: 'evt-102',
    date: 'Sep 04, 2026',
    title: 'Meta Campaign "Retargeting Q3" Launched',
    category: 'Meta Ads',
    impact: 'Medium',
    description: 'Increased monthly budget by $1,500 targeting existing site visitors.'
  },
  {
    id: 'evt-103',
    date: 'Aug 28, 2026',
    title: 'GBP Secondary Categories Updated',
    category: 'GBP',
    impact: 'High',
    description: 'Added "Emergency Dental Service" and "Cosmetic Dentist" attributes.'
  }
];

export function MarketingTimeline() {
  return (
    <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-4 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-extrabold text-[#102033]">Unified Marketing Event Timeline</h3>
          <p className="text-xs text-[#5E7187]">Cross-channel interventions and system occurrences</p>
        </div>
        <span className="text-[10px] font-mono text-[#5E7187] bg-[#F4F6F8] px-2.5 py-1 rounded border border-[#E2E8F0]">
          Auto-Correlated
        </span>
      </div>

      <div className="relative border-l-2 border-[#E2E8F0] ml-3 pl-6 space-y-6 my-2">
        {MOCK_EVENTS.map((event) => (
          <div key={event.id} className="relative group">
            <div className="absolute -left-[31px] top-0 bg-[#FFFFFF] border-2 border-[#3498DB] p-1 rounded-full">
              <Calendar className="w-3 h-3 text-[#3498DB]" />
            </div>

            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#102033]">{event.title}</span>
                  <span className="bg-[#F4F6F8] text-[#5E7187] text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                    {event.category}
                  </span>
                </div>
                <p className="text-xs text-[#5E7187] mt-1">{event.description}</p>
              </div>
              <span className="text-[10px] font-mono text-[#5E7187] whitespace-nowrap">{event.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
