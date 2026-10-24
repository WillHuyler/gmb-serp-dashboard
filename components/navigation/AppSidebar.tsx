'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useClient } from '../../lib/client-context';

const NAV_ITEMS = [
  { href: '/command-center', label: 'Command Center', icon: '📊' },
  { href: '/otterwatch', label: 'OtterWatch SERP', icon: '🎯' },
  { href: '/paid-media', label: 'Paid Media', icon: '💳' },
  { href: '/reputation', label: 'Reputation', icon: '⭐' },
  { href: '/competitors', label: 'Competitors', icon: '⚔️' },
  { href: '/outcome-lab', label: 'Opportunity Lab', icon: '🧪' },
  { href: '/reports', label: 'Reports', icon: '📑' },
  { href: '/automation', label: 'Automation', icon: '⚡' },
  { href: '/clients', label: 'Clients Portfolio', icon: '👥' },
  { href: '/connection-center', label: 'Connection Center', icon: '🔗' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { activeClient } = useClient();

  if (pathname === '/login') {
    return null;
  }

  return (
    <aside className="hidden lg:flex lg:w-64 lg:shrink-0 bg-[#0B1F3A] text-white flex-col border-r border-[#16325B] min-h-screen z-30">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-[#16325B] flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#D99614] flex items-center justify-center font-bold text-[#0B1F3A] shadow-md">
          ★
        </div>
        <div className="leading-tight">
          <span className="font-extrabold text-sm tracking-tight text-white block">
            PORCHLIGHT
          </span>
          <span className="text-[10px] text-[#D99614] font-semibold uppercase tracking-wider block">
            Search Intelligence
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const href = activeClient
            ? `${item.href}?clientId=${encodeURIComponent(activeClient.id)}`
            : item.href;

          return (
            <Link
              key={item.href}
              href={href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#D99614] text-[#0B1F3A] font-bold shadow-sm'
                  : 'text-slate-300 hover:bg-[#16325B] hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Branding */}
      <div className="p-4 border-t border-[#16325B] text-center">
        <span className="text-[10px] text-slate-400 font-mono">
          OtterWatch Enterprise v1.2
        </span>
      </div>
    </aside>
  );
}
