'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useClient, Client } from '../../lib/client-context';

export function ClientSelector() {
  const { activeClient, clients, availableClients, setActiveClient, setActiveClientId } = useClient();
  const clientList = clients || availableClients || [];
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-between w-64 px-3 py-1.5 text-xs font-semibold text-[#0B1F3A] bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg shadow-sm hover:bg-white transition-all focus:outline-none"
      >
        <div className="flex items-center space-x-2 truncate">
          <span className={`w-2 h-2 rounded-full ${activeClient?.is_certified ? 'bg-[#12A36D]' : 'bg-amber-500'}`} />
          <span className="truncate">{activeClient?.name || 'Select Client...'}</span>
        </div>
        <span className="ml-2 text-slate-400">▼</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 z-50 w-64 mt-1 bg-white border border-[#DCE5EF] rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div className="py-1">
            {clientList.map((client: Client) => (
              <button
                key={client.id}
                onClick={() => {
                  if (setActiveClient) setActiveClient(client);
                  else if (setActiveClientId) setActiveClientId(client.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-[#F4F7FB] ${
                  activeClient?.id === client.id ? 'bg-[#F4F7FB] font-bold text-[#0B1F3A]' : 'text-slate-600'
                }`}
              >
                <span className="truncate">{client.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                    client.is_certified
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {client.is_certified ? 'Certified' : 'Uncertified'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
