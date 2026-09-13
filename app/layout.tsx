import React from 'react';
import './globals.css';

export const metadata = {
  title: 'Dominate Ignite Portal',
  description: 'GMB & SERP Telemetry Engine',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
