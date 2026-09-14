import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export const revalidate = 0;

export default async function CommandCenterPage() {
  const clientId = 'bf93fef0-fc60-4119-8ea2-68a274984355';

  // Fetch Signals & Anomalies
  const { data: signals } = await supabase
    .from('signals')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  // Fetch CRM Telemetry
  const { data: crmData } = await supabase
    .from('crm_telemetry')
    .select('*')
    .eq('client_id', clientId)
    .order('recorded_at', { ascending: false })
    .limit(1);

  // Fetch Paid Media Telemetry
  const { data: paidData } = await supabase
    .from('paid_media_telemetry')
    .select('*')
    .eq('client_id', clientId);

  const crm = crmData?.[0] || { total_leads: 0, qualified_leads: 0, closed_sales: 0, total_revenue: 0 };

  // Calculate aggregated paid ad spend
  const totalSpend = (paidData || []).reduce((acc, curr) => {
    const amount = typeof curr.spend === 'number' ? curr.spend : parseFloat(curr.spend || '0');
    return acc + (isNaN(amount) ? 0 : amount);
  }, 0);

  const costPerLead = crm.total_leads > 0 ? (totalSpend / crm.total_leads).toFixed(2) : '0.00';

  return (
    <div className="p-8 space-y-8 bg-[#0B0F17] text-white min-h-screen">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">EXECUTIVE COMMAND CENTER</h1>
        <p className="text-sm text-slate-400 mt-1">
          Unified Decision Platform & Real-Time Telemetry Synthesis
        </p>
      </div>

      {/* METRICS OVERVIEW GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-2">
          <span className="text-xs font-mono uppercase text-slate-400">TOTAL LEADS (CRM)</span>
          <div className="text-2xl font-bold text-white font-mono">{crm.total_leads}</div>
          <span className="text-[10px] text-emerald-400 font-mono">QUALIFIED: {crm.qualified_leads}</span>
        </div>

        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-2">
          <span className="text-xs font-mono uppercase text-slate-400">CLOSED REVENUE</span>
          <div className="text-2xl font-bold text-emerald-400 font-mono">${Number(crm.total_revenue).toLocaleString()}</div>
          <span className="text-[10px] text-slate-400 font-mono">DEALS: {crm.closed_sales}</span>
        </div>

        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-2">
          <span className="text-xs font-mono uppercase text-slate-400">TOTAL AD SPEND</span>
          <div className="text-2xl font-bold text-amber-400 font-mono">${totalSpend.toFixed(2)}</div>
          <span className="text-[10px] text-slate-400 font-mono">META + GOOGLE ADS</span>
        </div>

        <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-5 space-y-2">
          <span className="text-xs font-mono uppercase text-slate-400">BLENDED COST / LEAD</span>
          <div className="text-2xl font-bold text-[#55A9E6] font-mono">${costPerLead}</div>
          <span className="text-[10px] text-slate-400 font-mono">ACQUISITION EFFICIENCY</span>
        </div>
      </div>

      {/* SIGNALS & DEPLOYED STRATEGIES LEDGER */}
      <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-6 space-y-4">
        <h2 className="text-xs font-mono uppercase text-slate-400 tracking-wider">
          BEACON INTELLIGENCE LEDGER & DEPLOYED TARGETS
        </h2>

        <div className="space-y-3">
          {(signals || []).map((sig: any) => (
            <div
              key={sig.id}
              className="bg-[#0B0F17] border border-[#A9C7E5]/10 rounded-lg p-4 flex justify-between items-center"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                      sig.severity === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {sig.severity}
                  </span>
                  <span className="text-sm font-bold text-white">{sig.title}</span>
                </div>
                <p className="text-xs text-slate-400">{sig.message}</p>
              </div>

              <div className="text-right space-y-1">
                <span className="text-[10px] font-mono text-slate-500 block">
                  {new Date(sig.created_at).toLocaleDateString()}
                </span>
                <span className="text-xs font-mono text-[#55A9E6] block">
                  {sig.signal_type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
