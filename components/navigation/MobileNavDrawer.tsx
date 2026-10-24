'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useClient } from '../../lib/client-context';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

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

export default function MobileNavDrawer({ isOpen, onClose }: MobileNavDrawerProps) {
  const pathname = usePathname();
  const { activeClient, currentUser, signOutCleanly } = useClient();

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Escape key close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0B1F3A]/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-[#0B1F3A] text-white flex flex-col shadow-2xl z-10">
        {/* Drawer Header */}
        <div className="h-16 px-5 border-b border-[#16325B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D99614] flex items-center justify-center font-bold text-[#0B1F3A]">
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
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-[#16325B] focus:outline-none"
          >
            ✕
          </button>
        </div>

        {/* Client Banner */}
        {activeClient && (
          <div className="px-5 py-3 bg-[#16325B]/50 border-b border-[#16325B]">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Active Client
            </span>
            <span className="text-xs font-bold text-white truncate block">
              {activeClient.name}
            </span>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={
                  activeClient
                    ? `${item.href}?clientId=${encodeURIComponent(activeClient.id)}`
                    : item.href
                }
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#D99614] text-[#0B1F3A] font-bold shadow-sm'
                    : 'text-slate-300 hover:bg-[#16325B] hover:text-white'
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Sign Out */}
        {currentUser && (
          <div className="p-4 border-t border-[#16325B] bg-[#071324] flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-xs font-bold text-white truncate block">
                {currentUser.email}
              </span>
              <span className="text-[10px] font-mono text-[#D99614] uppercase block">
                {currentUser.role}
              </span>
            </div>
            <button
              type="button"
              onClick={async () => {
                onClose();
                await signOutCleanly();
              }}
              className="px-2.5 py-1.5 rounded bg-[#16325B] text-slate-300 hover:text-rose-400 text-xs font-semibold shrink-0"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
