import type { Metadata } from 'next';
import './globals.css';
import { ClientProvider } from '../lib/client-context';
import { GlobalHeader } from '../components/navigation/GlobalHeader';

export const metadata: Metadata = {
  title: 'PorchLight | Decision Platform',
  description: 'Unified Decision Platform & Real-Time Telemetry Synthesis',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0B0F17] text-white">
        <ClientProvider>
          <GlobalHeader />
          <main>{children}</main>
        </ClientProvider>
      </body>
    </html>
  );
}
