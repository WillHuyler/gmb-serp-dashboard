import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export interface SignalIntervention {
  tenant_id: string;
  client_id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  signal_type: 'SERP_PACK_DROP' | 'SPEND_SPIKE' | 'CONVERSION_BOTTLENECK';
  title: string;
  message: string;
  recommended_action: string;
}

export class DecisionEngine {
  /**
   * Scans keyword telemetry to detect local pack drops (> 3 rank drop).
   */
  static async evaluateRankAnomalies(tenantId: string, clientId: string): Promise<SignalIntervention[]> {
    const { data: keywords, error } = await supabase
      .from('keyword_library')
      .select(`
        id,
        keyword,
        rank_history (
          serp_rank,
          created_at
        )
      `)
      .eq('client_id', clientId);

    if (error || !keywords) return [];

    const interventions: SignalIntervention[] = [];

    (keywords as any[]).forEach((kw) => {
      const history = kw.rank_history || [];
      if (history.length < 2) return;

      const latestRank = history[0].serp_rank;
      const previousRank = history[1].serp_rank;

      // Rule: Drop out of Top 3 Local Pack
      if (previousRank <= 3 && latestRank > 3) {
        interventions.push({
          tenant_id: tenantId,
          client_id: clientId,
          severity: 'CRITICAL',
          signal_type: 'SERP_PACK_DROP',
          title: `Local Pack Loss: ${kw.keyword}`,
          message: `Keyword "${kw.keyword}" dropped from position #${previousRank} to #${latestRank}, losing Top 3 Local Pack placement.`,
          recommended_action: 'Audit primary GBP category assignment and request immediate local citation sync.',
        });
      }
    });

    return interventions;
  }

  /**
   * Persists evaluated interventions to the signals ledger.
   */
  static async persistInterventions(interventions: SignalIntervention[]) {
    if (interventions.length === 0) return;

    const { error } = await supabase.from('signals').insert(
      interventions.map((i) => ({
        ...i,
        is_resolved: false,
        created_at: new Date().toISOString(),
      }))
    );

    if (error) {
      console.error('Failed to persist Beacon interventions:', error.message);
    }
  }
}
