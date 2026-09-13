import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OtterWatch — Local Search Intelligence',
  description: 'Enterprise Local Search Intelligence by PorchLight',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#08111F] text-[#F7FAFC] antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
