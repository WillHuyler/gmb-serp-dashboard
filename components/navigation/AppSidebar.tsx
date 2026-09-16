'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: '📊' },
  { label: 'Local Search', href: '/otterwatch', icon: '📍' },
  { label: 'Paid Media', href: '/paid-media', icon: '📈' },
  { label: 'Reputation', href: '/reputation', icon: '⭐' },
  { label: 'Competitors', href: '/competitors', icon: '🎯' },
  { label: 'Opportunity Lab', href: '/outcome-lab', icon: '⚡' },
  { label: 'Reports', href: '/reports', icon: '📑' },
  { label: 'Clients', href: '/connection-center', icon: '🏢' },
  { label: 'Automation', href: '/automation', icon: '⚙️' },
  { label: 'Settings', href: '/settings', icon: '🛠️' },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#0B1F3A] text-white flex flex-col justify-between min-h-screen border-r border-[#142E52] fixed left-0 top-0 bottom-0 z-30">
      <div>
        {/* BRAND HEADER WITH LOGO ICON & SUBTITLE */}
        <div className="p-6 border-b border-[#142E52]/60 flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#D99614] to-amber-300 flex items-center justify-center text-xl shadow-md mb-2">
            🏠
          </div>
          <div className="text-[#D99614] font-bold text-lg tracking-wider">
            PORCHLIGHT
          </div>
          <span className="text-[9px] font-mono text-slate-400 tracking-widest uppercase mt-0.5">
            LOCAL SEARCH INTELLIGENCE BY OTTERWATCH
          </span>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#D99614]/20 text-white font-bold border-l-4 border-[#D99614]'
                    : 'text-slate-300 hover:bg-[#142E52] hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* FOOTER */}
      <div className="p-4 border-t border-[#142E52]/60 text-center text-[10px] text-slate-400 font-mono">
        <div className="flex items-center justify-center space-x-1.5 mb-1">
          <span className="w-5 h-5 rounded-full bg-[#142E52] text-white flex items-center justify-center font-bold text-[9px]">
            PL
          </span>
          <span>Powered by <strong className="text-white">OtterWatch</strong></span>
        </div>
        <div className="text-slate-500 text-[9px]">Find the Signal. Grow Faster.</div>
      </div>
    </aside>
  );
}
