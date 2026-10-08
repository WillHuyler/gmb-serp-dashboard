'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function AppSidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/command-center', icon: '📊' },
    { label: 'Local Search', href: '/otterwatch', icon: '📍' },
    { label: 'Paid Media', href: '/paid-media', icon: '🎯' },
    { label: 'Reputation', href: '/reputation', icon: '⭐' },
    { label: 'Competitors', href: '/competitors', icon: '⚔️' },
    { label: 'Opportunity Lab', href: '/outcome-lab', icon: '🧪' },
    { label: 'Reports', href: '/reports', icon: '📄' },
    { label: 'Clients', href: '/clients', icon: '🏢' },
    { label: 'Automation', href: '/automation', icon: '⚡' },
    { label: 'Settings', href: '/settings', icon: '⚙️' },
  ];

  return (
    <aside className="w-64 bg-[#0B1F3A] text-white fixed top-0 bottom-0 left-0 z-30 flex flex-col justify-between border-r border-[#142E52]">
      <div>
        {/* TOP LEFT LOGO HEADER */}
        <div className="p-6 border-b border-[#142E52] flex items-center space-x-3">
          <div className="relative w-10 h-10 flex-shrink-0">
            {/* Replace /porchlight-logo.png with your image asset path */}
            <Image
              src="/porchlight-logo.png"
              alt="PorchLight Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-wider text-sm text-white font-sans">
              PORCHLIGHT
            </span>
            <span className="text-[10px] text-[#D99614] font-mono font-semibold">
              SEARCH INTELLIGENCE
            </span>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#D99614] text-white font-bold shadow-sm'
                    : 'text-[#7C8DA5] hover:text-white hover:bg-[#142E52]'
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* FOOTER BRANDING */}
      <div className="p-4 border-t border-[#142E52] text-center">
        <span className="text-[10px] font-mono text-[#7C8DA5] tracking-wider uppercase">
          Powered by <strong className="text-white">OtterWatch</strong>
        </span>
      </div>
    </aside>
  );
}
