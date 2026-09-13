"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Compass, Database } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export function GlobalHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');

  useEffect(() => {
    async function fetchClients() {
      const { data } = await supabase.from('clients').select('*');
      if (data && data.length > 0) {
        setClients(data);
        const currentParam = searchParams.get('client');
        if (currentParam) {
          setSelectedClient(currentParam);
        } else {
          setSelectedClient(data[0].id);
        }
      }
    }
    fetchClients();
  }, [searchParams]);

  const handleClientChange = (clientId: string) => {
    setSelectedClient(clientId);
    const params = new URLSearchParams(searchParams.toString());
    params.set('client', clientId);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <header className="bg-[#08111F] text-white border-b border-[#A9C7E5]/10 sticky top-0 z-50 font-sans">
      <div className="max-w-[1600px] mx-auto px-6 h-16 flex justify-between items-center">
        
        {/* Brand & Main Navigation */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="p-1.5 bg-[#0E192B] border border-[#F5A000]/40 rounded-lg">
              <Compass className="w-5 h-5 text-[#F5A000]" />
            </div>
            <div>
              <span className="text-sm font-extrabold tracking-wider block leading-none">PORCHLIGHT</span>
              <span className="text-[9px] text-[#A9C7E5] font-mono block">DECISION ENGINE</span>
            </div>
          </Link>

          <nav className="flex gap-2 text-xs font-mono">
            <Link
              href="/command-center"
              className={`px-3 py-1.5 rounded-lg transition-all ${
                pathname.startsWith('/command-center')
                  ? 'bg-[#102033] text-[#FFC44D] font-bold border border-[#F5A000]/30'
                  : 'text-[#A9C7E5] hover:text-white'
              }`}
            >
              Command Center
            </Link>

            <Link
              href="/otterwatch"
              className={`px-3 py-1.5 rounded-lg transition-all ${
                pathname.startsWith('/otterwatch')
                  ? 'bg-[#102033] text-[#FFC44D] font-bold border border-[#F5A000]/30'
                  : 'text-[#A9C7E5] hover:text-white'
              }`}
            >
              OtterWatch SERP
            </Link>

            <Link
              href="/outcome-lab"
              className={`px-3 py-1.5 rounded-lg transition-all ${
                pathname.startsWith('/outcome-lab')
                  ? 'bg-[#102033] text-[#FFC44D] font-bold border border-[#F5A000]/30'
                  : 'text-[#A9C7E5] hover:text-white'
              }`}
            >
              Outcome Lab
            </Link>
          </nav>
        </div>

        {/* Global Supabase Entity Dropdown */}
        <div className="flex items-center gap-3 bg-[#0E192B] border border-[#A9C7E5]/20 px-3.5 py-1.5 rounded-xl shadow-sm">
          <Database className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono font-bold uppercase text-[#A9C7E5]">Live Entity:</span>
          <select
            value={selectedClient}
            onChange={(e) => handleClientChange(e.target.value)}
            className="bg-transparent text-xs font-bold text-[#FFC44D] focus:outline-none cursor-pointer max-w-[220px] truncate"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#08111F] text-white">
                {c.name}
              </option>
            ))}
          </select>
        </div>

      </div>
    </header>
  );
}
