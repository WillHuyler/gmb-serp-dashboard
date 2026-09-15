import './globals.css';
import React from 'react';
import AppSidebar from '../components/navigation/AppSidebar';
import { ClientProvider } from '../lib/client-context';

export const metadata = {
  title: 'PorchLight | Local Search Intelligence',
  description: 'Enterprise Local Search & Paid Media Decision Platform by OtterWatch',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F4F7FB] text-[#0B1F3A] min-h-screen antialiased flex">
        <ClientProvider>
          {/* PERSISTENT DARK NAVY SIDEBAR */}
          <AppSidebar />

          {/* MAIN CONTENT AREA (OFFSET FOR FIXED 64px/16rem SIDEBAR) */}
          <div className="flex-1 ml-64 flex flex-col min-h-screen">
            {/* TOP APPLICATION BAR */}
            <header className="h-16 bg-white border-b border-[#DCE5EF] px-8 flex justify-between items-center sticky top-0 z-20 shadow-sm">
              <div className="flex items-center space-x-4 w-96">
                <div className="relative w-full">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">
                    🔍
                  </span>
                  <input
                    type="text"
                    placeholder="Search clients, locations, or keywords... (Ctrl K)"
                    className="w-full bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg pl-9 pr-4 py-1.5 text-xs text-[#0B1F3A] placeholder-slate-400 focus:outline-none focus:border-[#D99614]"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-6 text-xs font-mono">
                <div className="flex items-center space-x-2 bg-[#F4F7FB] border border-[#DCE5EF] px-3 py-1.5 rounded-lg text-[#53657D]">
                  <span>📅</span>
                  <span className="font-bold text-[#0B1F3A]">Jun 1, 2026 – Aug 27, 2026</span>
                </div>

                <div className="relative">
                  <span className="text-slate-500 text-base">🔔</span>
                  <span className="absolute -top-1 -right-1.5 bg-[#E64B4B] text-white text-[9px] font-bold px-1 rounded-full">
                    3
                  </span>
                </div>

                <div className="flex items-center space-x-2 border-l border-[#DCE5EF] pl-4">
                  <div className="w-8 h-8 rounded-full bg-[#0B1F3A] text-white flex items-center justify-center font-bold text-xs">
                    WH
                  </div>
                  <div className="text-left leading-tight">
                    <div className="font-bold text-[#0B1F3A]">Will Huyler</div>
                    <div className="text-[10px] text-slate-400">Agency Admin</div>
                  </div>
                </div>
              </div>
            </header>

            {/* PAGE CANVAS WORKSPACE */}
            <main className="flex-1 p-8 bg-[#F4F7FB]">{children}</main>
          </div>
        </ClientProvider>
      </body>
    </html>
  );
}
