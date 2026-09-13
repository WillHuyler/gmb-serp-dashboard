"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Sparkles, LayoutDashboard, Search, Target, Megaphone, Share2, BarChart3, Database, Users } from 'lucide-react';
import { DemoTenantProfile } from '../../lib/demo-engine';

interface GlobalHeaderProps {
  activeTenant: DemoTenantProfile;
  onOpenBeacon: () => void;
}

export function GlobalHeader({ activeTenant, onOpenBeacon }: GlobalHeaderProps) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Command Center', href: '/command-center', icon: LayoutDashboard },
    { name: 'OtterWatch', href: '/otterwatch', icon: Search, activePrefix: '/otterwatch' },
    { name: 'Outcome Lab', href: '/outcome-lab', icon: Target },
    { name: 'Paid Media', href: '#', icon: Megaphone, disabled: true },
    { name: 'Social', href: '#', icon: Share2, disabled: true },
    { name: 'Analytics', href: '#', icon: BarChart3, disabled: true },
    { name: 'CRM', href: '#', icon: Users, disabled: true },
  ];

  return (
    <header className="bg-[#08111F] border-b border-[#0E192B] h-[60px] px-6 flex items-center justify-between sticky top-0 z-40 text-white font-sans">
      <div className="flex items-center gap-6">
        {/* Brand Hierarchy */}
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-[#0E192B] border border-[#F5A000]/30 rounded-lg">
            <Compass className="w-5 h-5 text-[#F5A000]" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-wider text-white block leading-none">PORCHLIGHT</span>
            <span className="text-[9px] font-bold text-[#5E7187] uppercase tracking-widest mt-0.5 block">Decision Intelligence</span>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-[#0E192B]" />

        {/* Global Product Navigation */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.activePrefix 
              ? pathname.startsWith(item.activePrefix)
              : pathname === item.href;

            if (item.disabled) {
              return (
                <span
                  key={item.name}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-[#5E7187]/50 cursor-not-allowed flex items-center gap-1.5"
                  title="Integration Connection Needed"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.name}
                </span>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-[#0E192B] text-[#F5A000] border border-[#F5A000]/30'
                    : 'text-[#A9C7E5] hover:text-white hover:bg-[#0E192B]/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right Shell Controls */}
      <div className="flex items-center gap-4">
        <div className="text-right font-mono">
          <span className="text-[10px] text-[#5E7187] block uppercase font-bold">Active Entity</span>
          <span className="text-xs font-bold text-[#F7FAFC]">{activeTenant.name}</span>
        </div>

        <button
          onClick={onOpenBeacon}
          className="bg-[#0E192B] hover:bg-[#102033] border border-[#F5A000]/40 text-[#FFC44D] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#F5A000] animate-pulse" />
          <span>ASK BEACON</span>
        </button>
      </div>
    </header>
  );
}
