"use client";
import './globals.css';
import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Compass, BarChart2, Target } from 'lucide-react';
import { BeaconDrawer } from '../components/beacon/BeaconDrawer';
import { DemoBar } from '../components/demo/DemoBar';
import { DEMO_TENANTS, DemoTenantProfile } from '../lib/demo-engine';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isBeaconOpen, setIsBeaconOpen] = useState(false);
  const [activeTenant, setActiveTenant] = useState<DemoTenantProfile>(DEMO_TENANTS[0]);

  return (
    <html lang="en" className="dark">
      <body className="bg-[#08111F] text-[#F7FAFC] antialiased min-h-screen font-sans">
        
        {/* DEMO PROSPECT SWITCHER BANNER */}
        <DemoBar activeTenant={activeTenant} onSelectTenant={setActiveTenant} />

        {/* GLOBAL EXECUTIVE SHELL NAVIGATION */}
        <header className="bg-[#0E192B] border-b border-[#A9C7E5]/10 h-[64px] px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-[#08111F] border border-[#F5A000]/30 rounded-lg">
                <Compass className="w-5 h-5 text-[#F5A000]" />
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-wider text-white">PORCHLIGHT</span>
                <span className="text-[10px] font-bold text-[#70839D] block uppercase tracking-widest">Decision Platform</span>
              </div>
            </div>

            <nav className="flex items-center gap-6 text-xs font-semibold text-[#A9C7E5]">
              <Link href="/" className="hover:text-[#F5A000] transition-colors flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-[#70839D]" /> OtterWatch SERP
              </Link>
              <Link href="/outcome-lab" className="hover:text-[#F5A000] transition-colors flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#70839D]" /> Outcome Lab
              </Link>
            </nav>
          </div>

          <button
            onClick={() => setIsBeaconOpen(true)}
            className="bg-[#08111F] hover:bg-[#111F34] border border-[#F5A000]/40 text-[#FFC44D] px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#F5A000] animate-pulse" />
            <span>ASK BEACON</span>
          </button>
        </header>

        {children}

        <BeaconDrawer
          isOpen={isBeaconOpen}
          onClose={() => setIsBeaconOpen(false)}
          clientName={activeTenant.name}
        />

      </body>
    </html>
  );
}
