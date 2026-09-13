"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart, MapPin, Users, Bot, Zap, Shield } from 'lucide-react';

export function OtterWatchNav() {
  const pathname = usePathname();

  const subItems = [
    { name: 'Overview', href: '/otterwatch', icon: BarChart },
    { name: 'Rankings', href: '/otterwatch/rankings', icon: Shield },
    { name: 'Local Visibility', href: '/otterwatch/local-visibility', icon: MapPin },
    { name: 'Competitors', href: '/otterwatch/competitors', icon: Users },
    { name: 'AI Visibility', href: '/otterwatch/ai-visibility', icon: Bot },
    { name: 'Signals', href: '/otterwatch/signals', icon: Zap },
  ];

  return (
    <div className="bg-[#FFFFFF] border-b border-[#E2E8F0] px-8 py-3 flex items-center justify-between font-sans shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-xs tracking-wider text-[#102033]">OTTERWATCH</span>
          <span className="text-[9px] font-mono text-[#5E7187] bg-[#F4F6F8] px-1.5 py-0.5 rounded border border-[#E2E8F0]">
            BY PORCHLIGHT
          </span>
        </div>
        <span className="text-xs text-[#5E7187] font-semibold">| Local Search Intelligence</span>
      </div>

      <nav className="flex items-center gap-1">
        {subItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-[#102033] text-[#FFFFFF]'
                  : 'text-[#5E7187] hover:text-[#102033] hover:bg-[#F4F6F8]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
