'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useClient } from '../../lib/client-context';

export function GlobalHeader() {
  const { activeClient, clients, setActiveClient, isLoading } = useClient();
  const pathname = usePathname();

  const navItems = [
    { label: 'Command Center', href: '/command-center' },
    { label: 'Outcome Lab', href: '/outcome-lab' },
    { label: 'Connection Center', href: '/connection-center' },
    { label: 'OtterWatch SERP', href: '/otterwatch' },
  ];

  return (
    <header className="bg-[#0B0F17] border-b border-[#A9C7E5]/10 px-6 py-3 flex justify-between items-center text-white">
      <div className="flex items-center space-x-8">
        <Link href="/command-center" className="flex items-center space-x-2">
          <span className="font-bold tracking-wider text-sm text-[#55A9E6]">PORCHLIGHT</span>
        </Link>

        {/* MAIN PLATFORM NAVIGATION */}
        <nav className="flex items-center space-x-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={activeClient?.id ? `${item.href}?clientId=${activeClient.id}` : item.href}
                className={`text-xs font-mono px-3 py-1.5 rounded transition-all ${
                  isActive
                    ? 'bg-[#55A9E6]/20 text-[#55A9E6] border border-[#55A9E6]/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-[#111622]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <span className="text-xs text-slate-400 font-mono">
          {activeClient?.is_certified ? '✓ CERTIFIED DATA' : '⚠ DATA REVIEW REQUIRED'}
        </span>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 bg-[#111622] border border-[#A9C7E5]/20 rounded-md px-3 py-1.5">
          <span className="text-xs text-slate-400 font-mono">Select Pitch Prospect:</span>
          {isLoading ? (
            <span className="text-xs text-slate-500 animate-pulse font-mono">Loading DB clients...</span>
          ) : (
            <select
              value={activeClient?.id || ''}
              onChange={(e) => {
                const target = clients.find((c) => c.id === e.target.value);
                if (target) {
                  setActiveClient(target);
                  window.location.search = `?clientId=${target.id}`;
                }
              }}
              className="bg-transparent text-xs font-mono text-amber-400 focus:outline-none cursor-pointer"
            >
              {clients.map((client) => (
                <option key={client.id} value={client.id} className="bg-[#111622] text-white">
                  {client.name} {client.is_certified ? '(Certified)' : '(Uncertified)'}
                </option>
              ))}
            </select>
          )}
        </div>

        <button className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold px-3 py-1.5 rounded hover:bg-amber-500/20 transition-all">
          ✨ ASK BEACON
        </button>
      </div>
    </header>
  );
}
