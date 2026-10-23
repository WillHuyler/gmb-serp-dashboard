import './globals.css';
import React from 'react';
import { ClientProvider } from '../lib/client-context';
import AppSidebar from '../components/navigation/AppSidebar';
import ExecutiveTopHeader from '../components/navigation/ExecutiveTopHeader';

export const metadata = {
  title: 'OtterWatch by PorchLight | Search & SERP Telemetry Engine',
  description:
    'Enterprise Local Search, 5x5 Geo-Grid SERP Telemetry, and Multi-Channel Marketing Intelligence.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F4F7FB] text-[#0B1F3A] antialiased font-sans selection:bg-[#D99614]/20">
        <ClientProvider>
          <div className="min-h-screen flex flex-row bg-[#F4F7FB]">
            {/* 1. Single Authoritative Dark Navy Sidebar */}
            <AppSidebar />

            {/* 2. Single Authoritative Light Executive Viewport */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#F4F7FB]">
              <ExecutiveTopHeader />
              <div className="flex-1 flex flex-col min-w-0">{children}</div>
            </div>
          </div>
        </ClientProvider>
      </body>
    </html>
  );
}
