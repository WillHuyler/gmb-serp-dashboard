import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClientProvider } from '../lib/client-context';
import AppSidebar from '../components/navigation/AppSidebar';
import ExecutiveTopHeader from '../components/navigation/ExecutiveTopHeader';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OtterWatch by PorchLight — Search Intelligence Dashboard',
  description: 'Enterprise multi-tenant local search, attribution and SERP telemetry platform.',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-[#F4F7FB]">
      <body className={`${inter.className} h-full antialiased text-[#0B1F3A]`}>
        <ClientProvider>
          <div className="min-h-screen flex flex-row bg-[#F4F7FB] overflow-x-hidden">
            {/* Desktop Navigation Sidebar (hidden on mobile) */}
            <AppSidebar />

            {/* Main Application Canvas */}
            <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
              <ExecutiveTopHeader />
              <main className="flex-1 flex flex-col min-w-0 w-full">
                {children}
              </main>
            </div>
          </div>
        </ClientProvider>
      </body>
    </html>
  );
}
