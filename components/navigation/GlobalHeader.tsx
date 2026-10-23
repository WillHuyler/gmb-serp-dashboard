'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useClient } from '../../lib/client-context';

const NAV_LINKS = [
  { href: '/clients', label: 'Clients' },
  { href: '/command-center', label: 'Command Center' },
  { href: '/otterwatch', label: 'OtterWatch SERP' },
  { href: '/connection-center', label: 'Connections' },
  { href: '/paid-media', label: 'Paid Media' },
  { href: '/reputation', label: 'Reputation' },
  { href: '/competitors', label: 'Competitors' },
  { href: '/outcome-lab', label: 'Opportunity Lab' },
  { href: '/reports', label: 'Reports' },
];

export default function GlobalHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeClient, setActiveClient, clientRegistry } = useClient();

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const client = clientRegistry.find((c) => c.id === selectedId);
    if (client) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`pl_insights_${activeClient?.id}`);
        sessionStorage.removeItem(`pl_telemetry_${activeClient?.id}`);
      }

      setActiveClient(client);

      const params = new URLSearchParams(searchParams.toString());
      params.set('clientId', client.id);
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  return (
    <header className="bg-[#0B0F17] border-b border-[#A9C7E5]/15 sticky top-0 z-50 font-sans">
      <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Lockup & Primary Navigation */}
        <div className="flex items-center gap-6 overflow-x-auto">
          <Link href="/command-center" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 bg-[#D99614]/20 border border-[#D99614] rounded-lg flex items-center justify-center font-mono font-bold text-sm text-[#D99614]">
              OW
            </div>
            <div className="leading-tight">
              <span className="font-bold tracking-wider text-sm text-white block">
                OTTERWATCH
              </span>
              <span className="font-mono text-[9px] text-[#D99614] uppercase tracking-widest block">
                BY PORCHLIGHT
              </span>
            </div>
          </Link>

          <nav className="hidden xl:flex items-center gap-1">
            {NAV_LINKS.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              const targetHref = activeClient?.id
                ? `${item.href}?clientId=${activeClient.id}`
                : item.href;

              return (
                <Link
                  key={item.href}
                  href={targetHref}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[#D99614]/15 text-[#D99614] border border-[#D99614]/30 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-[#151D2A]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Active Client Context Selector */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 uppercase font-mono text-[10px] hidden sm:inline">
              ACTIVE CLIENT:
            </span>
            <select
              value={activeClient?.id || ''}
              onChange={handleClientChange}
              className="bg-[#151D2A] text-white font-semibold text-xs border border-[#A9C7E5]/20 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#D99614]"
            >
              {clientRegistry.length === 0 && (
                <option value="">No Authorized Clients</option>
              )}
              {clientRegistry.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.is_certified ? '✓ Certified' : '• Uncertified'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sub-navigation bar for smaller screens */}
      <div className="xl:hidden border-t border-[#A9C7E5]/10 px-6 py-2 flex items-center gap-2 overflow-x-auto">
        {NAV_LINKS.map((item) => {
          const isActive = pathname === item.href;
          const targetHref = activeClient?.id
            ? `${item.href}?clientId=${activeClient.id}`
            : item.href;

          return (
            <Link
              key={item.href}
              href={targetHref}
              className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap ${
                isActive
                  ? 'bg-[#D99614]/15 text-[#D99614] border border-[#D99614]/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
