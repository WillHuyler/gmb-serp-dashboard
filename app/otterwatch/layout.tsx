"use client";
import React from 'react';
import { OtterWatchNav } from '../../components/navigation/OtterWatchNav';

export default function OtterWatchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      <OtterWatchNav />
      <div className="p-8 max-w-[1600px] mx-auto">
        {children}
      </div>
    </div>
  );
}
