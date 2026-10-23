'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useClient } from '../../lib/client-context';
import TrustCertificationStrip, {
  DataTrustState,
} from '../../components/design-system/TrustCertificationStrip';
import KpiMetricCard from '../../components/design-system/KpiMetricCard';
import TriPartInsightCard from '../../components/design-system/TriPartInsightCard';

export const dynamic = 'force-dynamic';

interface ExecutionRecord {
  executionId: string;
  clientId: string;
  ruleId: string;
  status: 'SUCCEEDED' | 'FAILED' | 'RECORDED';
  completedAt: string;
  summary: string;
}

interface AutomationApiPayload {
  isClientCertified: boolean;
  rulePersistenceAvailable: boolean;
  setupRequired: boolean;
  setupReason: string;
  rules: any[];
  cronInfrastructure: {
    endpoint: string;
    scheduleDescription: string;
    automatedActionsBlocked: boolean;
  };
  executionHistory: ExecutionRecord[];
}

function AutomationContent() {
  const {
    activeClient,
    reportingPeriod,
    registryState,
    clientSwitchVersion,
  } = useClient();

  const [payload, setPayload] = useState<AutomationApiPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeClient?.id) {
      setPayload(null);
      setError(null);
      return;
    }

    const controller = new AbortController();
    async function loadAutomationState() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/automation?clientId=${encodeURIComponent(activeClient!.id)}`,
          {
            credentials: 'include',
            headers: { 'Cache-Control': 'no-cache' },
            signal: controller.signal,
          }
        );
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data?.error?.message || 'Failed to load automation state.');
          setPayload(null);
        } else {
          setPayload(data);
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          setError(err?.message || 'Network error loading automation logs.');
          setPayload(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadAutomationState();
    return () => controller.abort();
  }, [activeClient?.id, clientSwitchVersion]);

  const isCertified = Boolean(activeClient?.is_certified);
  const executionHistory = payload?.executionHistory || [];
  const verifiedSucceededRuns = executionHistory.filter(
    (e) =>
      e.status === 'SUCCEEDED' &&
      Boolean(e.executionId && e.clientId && e.ruleId && e.completedAt)
  );
  const verifiedFailedRuns = executionHistory.filter((e) => e.status === 'FAILED');

  const trustState: DataTrustState = loading
    ? 'SECTION_LOADING'
    : isCertified
    ? 'CERTIFIED_LIVE'
    : 'UNMAPPED_SETUP';

  return (
    <div className="flex-1 flex flex-col bg-[#F4F7FB] text-[#0B1F3A]">
      <TrustCertificationStrip
        client={activeClient}
        trustState={trustState}
        lastIngestedAt={activeClient?.last_sync_at}
        recordCount={executionHistory.length}
        reportingPeriod={reportingPeriod}
      />

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6 font-sans">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-[#DCE5EF] rounded-xl p-6 shadow-sm">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#D99614] font-bold block">
              TELEMETRY MONITORING & VERIFIED EXECUTION AUDIT LEDGER (CR-025)
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0B1F3A] mt-1">
              Automation & Execution Integrity — {activeClient?.name || 'Select Client'}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Displays only persisted client alert rules and verified execution records from <code className="font-mono text-[#0B1F3A]">public.api_execution_logs</code>. Never infers execution success from certification state.
            </p>
          </div>

          {activeClient && (
            <Link
              href={`/connection-center?clientId=${encodeURIComponent(activeClient.id)}`}
              className="px-4 py-2 bg-[#0B1F3A] hover:bg-[#16325B] text-white rounded-lg text-xs font-bold shadow-sm"
            >
              Manage Provider Connections →
            </Link>
          )}
        </div>

        {registryState === 'AUTH_REQUIRED' && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 flex items-center justify-between gap-4">
            <span className="text-xs font-bold text-amber-900">
              Authentication Required — Please sign in to inspect automation and execution logs.
            </span>
            <Link
              href="/login"
              className="px-4 py-2 bg-[#0B1F3A] text-white font-bold text-xs rounded-lg"
            >
              Sign In →
            </Link>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800">
            {error}
          </div>
        )}

        {/* KPI Strip (Strictly Bound to Persisted Records) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiMetricCard
            label="Persisted Client Alert Rules"
            value={payload?.rulePersistenceAvailable ? payload.rules.length : null}
            format="number"
            sourceBadge={
              payload?.rulePersistenceAvailable ? 'PERSISTED RULES' : 'SETUP REQUIRED'
            }
            provenanceNote="Requires Persistent Rule Store"
            isCertified={Boolean(payload?.rulePersistenceAvailable)}
            isLoading={loading}
            accentColor="gold"
          />

          <KpiMetricCard
            label="Verified Succeeded Runs"
            value={executionHistory.length > 0 ? verifiedSucceededRuns.length : null}
            format="number"
            sourceBadge="API_EXECUTION_LOGS"
            provenanceNote="Requires Execution ID & Timestamp"
            isCertified={executionHistory.length > 0}
            isLoading={loading}
            accentColor="teal"
          />

          <KpiMetricCard
            label="Recorded Execution Failures"
            value={executionHistory.length > 0 ? verifiedFailedRuns.length : null}
            format="number"
            sourceBadge="API_EXECUTION_LOGS"
            provenanceNote="Logged Provider / Sync Errors"
            isCertified={executionHistory.length > 0}
            isLoading={loading}
            accentColor="blue"
          />
        </div>

        {/* Section 1: Human-Configurable Client Alert Rules vs. System Cron Infrastructure */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Cols: Client-Configurable Alert Rules */}
          <div className="lg:col-span-7 bg-white border border-[#DCE5EF] rounded-xl p-6 space-y-4 shadow-sm">
            <div className="border-b border-[#DCE5EF] pb-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase text-[#D99614] font-bold block">
                  HUMAN-CONFIGURABLE CLIENT ALERTS
                </span>
                <h2 className="text-base font-bold text-[#0B1F3A]">
                  Persisted Alert Rule Configuration
                </h2>
              </div>
              <span className="font-mono text-[10px] px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                AUTOMATION SETUP REQUIRED
              </span>
            </div>

            <div className="p-6 rounded-xl bg-[#F4F7FB] border border-[#DCE5EF] space-y-2.5">
              <h3 className="text-sm font-bold text-[#0B1F3A]">
                Automation Setup Required — No Persisted Alert Rules Configured
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {payload?.setupReason ||
                  'PorchLight does not display hardcoded browser-only alert rules as active production monitors. Persistent client-scoped alert rule storage must be configured before Enable/Disable toggles are active.'}
              </p>
              {!isCertified && (
                <p className="text-xs font-semibold text-amber-800 pt-1">
                  🔒 Automated actions are additionally gated until {activeClient?.name || 'this client'} has certified provider telemetry.
                </p>
              )}
            </div>
          </div>

          {/* Right 5 Cols: System Cron Infrastructure (Distinct from User Alerts) */}
          <div className="lg:col-span-5 bg-white border border-[#DCE5EF] rounded-xl p-6 space-y-4 shadow-sm">
            <div className="border-b border-[#DCE5EF] pb-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase text-[#D99614] font-bold block">
                  SYSTEM CRON INFRASTRUCTURE
                </span>
                <h2 className="text-base font-bold text-[#0B1F3A]">
                  Scheduled Ingestion Pipeline
                </h2>
              </div>
              <span className="font-mono text-[10px] px-2.5 py-0.5 rounded bg-[#F4F7FB] text-[#0B1F3A] border border-[#DCE5EF] font-bold">
                SERVER PIPELINE
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Ingestion Endpoint:</span>
                <code className="font-mono font-bold text-[#0B1F3A]">
                  {payload?.cronInfrastructure?.endpoint || '/api/cron/daily-etl'}
                </code>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Automated Action Gate:</span>
                <strong
                  className={`font-mono ${
                    isCertified ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {isCertified
                    ? 'ELIGIBLE (CERTIFIED)'
                    : 'BLOCKED (UNCERTIFIED TELEMETRY)'}
                </strong>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Last Recorded Client Sync:</span>
                <span className="font-mono text-slate-700">
                  {activeClient?.last_sync_at || 'None Recorded'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Verifiable Execution History Ledger (public.api_execution_logs) */}
        <div className="bg-white border border-[#DCE5EF] rounded-xl p-6 space-y-4 shadow-sm">
          <div className="border-b border-[#DCE5EF] pb-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase text-[#D99614] font-bold block">
                VERIFIED EXECUTION AUDIT LOG
              </span>
              <h2 className="text-base font-bold text-[#0B1F3A]">
                Recorded Execution History (<code className="font-mono text-xs">public.api_execution_logs</code>)
              </h2>
            </div>
            <span className="font-mono text-xs text-slate-500">
              {executionHistory.length} Verified {executionHistory.length === 1 ? 'Row' : 'Rows'}
            </span>
          </div>

          {executionHistory.length === 0 ? (
            <div className="p-8 text-center bg-[#F4F7FB] border border-[#DCE5EF] rounded-xl space-y-2">
              <p className="text-sm font-bold text-[#0B1F3A]">
                No Execution Records Logged for {activeClient?.name || 'Selected Client'}
              </p>
              <p className="text-xs text-slate-600 max-w-lg mx-auto">
                A <code className="font-mono font-bold">SUCCEEDED</code> status requires a recorded <code className="font-mono">execution_id</code>, <code className="font-mono">client_id</code>, <code className="font-mono">rule_id</code>, completion timestamp, and verified outcome in <code className="font-mono">public.api_execution_logs</code>.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#DCE5EF] text-slate-500 font-bold uppercase text-[11px] bg-[#F4F7FB]">
                    <th className="py-3 px-3">Execution ID</th>
                    <th className="py-3 px-3">Client ID</th>
                    <th className="py-3 px-3">Rule / Pipeline ID</th>
                    <th className="py-3 px-3">Result Status</th>
                    <th className="py-3 px-3">Completion Timestamp</th>
                    <th className="py-3 px-3">Diagnostic Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE5EF]">
                  {executionHistory.map((rec) => (
                    <tr key={rec.executionId} className="hover:bg-[#F4F7FB]">
                      <td className="py-3 px-3 font-mono font-semibold text-[#0B1F3A]">
                        {rec.executionId}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">{rec.clientId}</td>
                      <td className="py-3 px-3 font-mono text-[#0B1F3A]">{rec.ruleId}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-mono text-[10px] px-2.5 py-0.5 rounded border font-bold ${
                            rec.status === 'SUCCEEDED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : rec.status === 'FAILED'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-slate-100 text-slate-700 border-[#DCE5EF]'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {rec.completedAt}
                      </td>
                      <td className="py-3 px-3 text-slate-700">{rec.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <TriPartInsightCard
          title="Automation & Execution Provenance Contract"
          category="CR-025 GOVERNANCE"
          confidence={executionHistory.length > 0 ? 'HIGH' : 'INSUFFICIENT_DATA'}
          sources={['PUBLIC.API_EXECUTION_LOGS']}
          whatIsHappening={
            executionHistory.length > 0
              ? `${executionHistory.length} verified execution log row(s) found for ${activeClient?.name}.`
              : `0 execution log rows recorded for ${activeClient?.name || 'this client'} in public.api_execution_logs.`
          }
          whyItIsHappening="Per CR-025, PorchLight never infers rule execution success from client certification state and never displays hardcoded browser rules as active automation."
          whatToDoNext="Complete provider mapping and initial ingestion in Connection Center to begin recording verifiable sync executions."
          actionLabel="Open Connection Center"
          actionHref={`/connection-center?clientId=${activeClient?.id || ''}`}
        />
      </main>
    </div>
  );
}

export default function AutomationPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-500">Loading Automation...</div>}>
      <AutomationContent />
    </Suspense>
  );
}
