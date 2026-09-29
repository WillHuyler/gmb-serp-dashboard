"use client";

import React, { useState, useRef, useEffect } from "react";
import { useClient, ClientRecord } from "@/components/providers/client-provider";

export function ClientSelector() {
  const { activeClient, clients, isLoading, error, setActiveClientById } = useClient();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.market_location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1.5 rounded-md text-xs">
        <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        <span>Loading Client Registry...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2 bg-rose-950/50 border border-rose-800 text-rose-300 px-3 py-1.5 rounded-md text-xs">
        <span>Error loading clients</span>
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-64 bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-100 px-3 py-2 rounded-md shadow-sm text-xs focus:outline-none transition-colors"
      >
        <div className="flex flex-col text-left truncate">
          <div className="flex items-center space-x-1.5 truncate">
            <span className="font-semibold text-slate-100 truncate">
              {activeClient ? activeClient.name : "Select Client"}
            </span>
            {activeClient?.type === "TEST" && (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-1 rounded font-mono">
                TEST
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 truncate">
            {activeClient?.market_location || "No Market Specified"}
          </span>
        </div>
        <svg className="w-4 h-4 text-slate-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1 w-80 rounded-md bg-slate-900 border border-slate-700 shadow-2xl z-50 overflow-hidden">
          <div className="p-2 border-b border-slate-800 bg-slate-950">
            <input
              type="text"
              placeholder="Search active clients or markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 text-slate-200 border border-slate-700 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500 placeholder-slate-500"
            />
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/50">
            {filteredClients.length === 0 ? (
              <div className="p-3 text-xs text-slate-500 text-center">No matching clients found</div>
            ) : (
              filteredClients.map((client) => {
                const isSelected = activeClient?.id === client.id;
                return (
                  <button
                    key={client.id}
                    onClick={() => {
                      setActiveClientById(client.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                      isSelected ? "bg-slate-800/70 border-l-2 border-cyan-400" : ""
                    }`}
                  >
                    <div className="flex flex-col truncate pr-2">
                      <span className={`font-medium truncate ${isSelected ? "text-cyan-300" : "text-slate-200"}`}>
                        {client.name}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">{client.market_location}</span>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      {client.type === "TEST" ? (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] px-1 rounded font-mono">
                          TEST
                        </span>
                      ) : (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-1 rounded font-mono">
                          REAL
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
