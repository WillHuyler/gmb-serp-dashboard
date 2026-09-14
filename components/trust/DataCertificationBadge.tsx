"use client";
import React from 'react';
import { ShieldCheck, AlertTriangle, XCircle } from 'lucide-react';

export type CertificationStatus = 'DATA_CERTIFIED' | 'DATA_REVIEW_REQUIRED' | 'FAILED';

interface DataCertificationBadgeProps {
  status: CertificationStatus;
  statusMessage?: string;
}

export function DataCertificationBadge({ status, statusMessage }: DataCertificationBadgeProps) {
  if (status === 'DATA_CERTIFIED') {
    return (
      <div 
        className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-emerald-400 font-mono text-xs shadow-xs"
        title="Verified: Tenant -> Client -> Entity -> Source Record -> Canonical Metric"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span className="font-extrabold uppercase tracking-wider text-[10px]">DATA CERTIFIED ✓</span>
      </div>
    );
  }

  if (status === 'DATA_REVIEW_REQUIRED') {
    return (
      <div 
        className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg text-amber-400 font-mono text-xs shadow-xs"
        title={statusMessage || "Verification pending or insufficient data."}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        <span className="font-extrabold uppercase tracking-wider text-[10px]">DATA REVIEW REQUIRED</span>
      </div>
    );
  }

  return (
    <div 
      className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-lg text-rose-400 font-mono text-xs shadow-xs"
      title={statusMessage || "Validation check failed."}
    >
      <XCircle className="w-3.5 h-3.5 text-rose-400" />
      <span className="font-extrabold uppercase tracking-wider text-[10px]">DATA INVALID</span>
    </div>
  );
}
