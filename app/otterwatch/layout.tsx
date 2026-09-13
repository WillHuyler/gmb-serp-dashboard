"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Bot, Radio } from 'lucide-react';

export default function OtterWatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* OtterWatch Sub-Navigation */}
      <div className="bg-[#0E192B] border-b border-[#A9C7E5]/10 px-8 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold text-[#F7FAFC]">OTTERWATCH</span>
          <span className="text-[10px] text-[#A9C7E5] font-mono border border-[#A9C7E5]/20 px-1.5 py-0.5 rounded">
            SERP TELEMETRY
          </span>
        </div>

        <nav className="flex gap-4 font-mono text-xs">
          <Link
            href="/otterwatch"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              pathname === '/otterwatch'
                ? 'bg-[#102033] text-[#FFC44D] font-bold border border-[#F5A000]/30'
                : 'text-[#A9C7E5] hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>SERP Dashboard</span>
          </Link>

          <Link
            href="/otterwatch/ai-visibility"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              pathname === '/otterwatch/ai-visibility'
                ? 'bg-[#102033] text-[#FFC44D] font-bold border border-[#F5A000]/30'
                : 'text-[#A9C7E5] hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-[#F5A000]" />
            <span>AI Visibility</span>
          </Link>

          <Link
            href="/otterwatch/signals"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              pathname === '/otterwatch/signals'
                ? 'bg-[#102033] text-[#FFC44D] font-bold border border-[#F5A000]/30'
                : 'text-[#A9C7E5] hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-[#3498DB]" />
            <span>Signals</span>
          </Link>
        </nav>
      </div>

      <div className="px-8">{children}</div>
    </div>
  );
}
