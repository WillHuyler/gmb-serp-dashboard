"use client";
import React from 'react';
import Link from 'next/link';
import { Compass, Search, Target, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-8 font-sans">
      <div className="bg-[#08111F] text-white rounded-2xl p-8 border border-[#F5A000]/30 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-[#0E192B] border border-[#F5A000]/40 rounded-xl">
            <Compass className="w-6 h-6 text-[#F5A000]" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-wider">PORCHLIGHT</h1>
            <span className="text-xs text-[#A9C7E5] font-mono">DECISION INTELLIGENCE PLATFORM</span>
          </div>
        </div>
        <p className="text-sm text-[#A9C7E5] max-w-2xl leading-relaxed">
          Welcome to the PorchLight decision engine shell. Navigate into the Executive Command Center, access Outcome Lab predictive modeling, or monitor local SERP telemetry via OtterWatch.
        </p>

        <div className="mt-6 flex flex-wrap gap-4">
          <Link
            href="/command-center"
            className="bg-[#F5A000] hover:bg-[#FFC44D] text-[#08111F] font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md"
          >
            <span>Open Command Center</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/otterwatch"
            className="bg-[#0E192B] hover:bg-[#102033] border border-[#A9C7E5]/30 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all"
          >
            <span>Access OtterWatch SERP</span>
            <Search className="w-4 h-4 text-[#3498DB]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
