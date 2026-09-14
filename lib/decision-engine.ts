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

export interface PredictionAssumption {
  label: string;
  sensitivity: string;
}

export interface PredictionOutcome {
  id: string;
  scenario: string;
  predictedImpact: string;
  confidenceScore: number;
  evidenceGrade?: string;
  baselineValue?: number | string;
  expectedValue?: number | string;
  rangeMin?: number | string;
  rangeMax?: number | string;
  recommendedBudgetShift?: string;
  projectedRankChange?: number;
  assumptions?: PredictionAssumption[];
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

  /**
   * Models forward scenario for Outcome Lab page.
   */
  static modelForwardScenario(
    baselineVisibility: number | number[],
    multiplier: number,
    integrationType: string
  ): PredictionOutcome {
    const baseValue = Array.isArray(baselineVisibility)
      ? baselineVisibility[baselineVisibility.length - 1] || 100
      : baselineVisibility;

    const projected = Number((baseValue * (1 + 0.15 * multiplier)).toFixed(1));
    const minBound = Number((projected * 0.92).toFixed(1));
    const maxBound = Number((projected * 1.08).toFixed(1));

    return {
      id: `pred_${Date.now()}`,
      scenario: integrationType,
      predictedImpact: `+${(baseValue * 0.15 * multiplier).toFixed(1)}% Local Visibility Recovery`,
      confidenceScore: 0.92,
      evidenceGrade: 'HIGH_CONFIDENCE_TELEMETRY',
      baselineValue: baseValue,
      expectedValue: projected,
      rangeMin: minBound,
      rangeMax: maxBound,
      recommendedBudgetShift: 'Reallocate non-performing paid search budget to high-intent GBP Local Ads',
      projectedRankChange: -2.4,
      assumptions: [
        { label: 'GBP Category Alignment Maintained', sensitivity: 'HIGH' },
        { label: 'Ad Spend Reallocation Executed within 7 Days', sensitivity: 'MEDIUM' },
        { label: 'Local Citation Consistency > 95%', sensitivity: 'LOW' },
      ],
    };
  }

  /**
   * Models reverse optimization pathways for target outcomes.
   */
  static modelReverseOptimization(
    targetConfig: { targetMetric: string; desiredValue: number; currentValue: number; timeframeDays: number },
    channels: string[]
  ): PredictionOutcome[] {
    return channels.map((channel, idx) => {
      const minBound = Number((targetConfig.desiredValue * 0.9).toFixed(1));
      const maxBound = Number((targetConfig.desiredValue * 1.1).toFixed(1));

      return {
        id: `rev_${channel}_${Date.now()}_${idx}`,
        scenario: `Target Pathway via ${channel.toUpperCase()}`,
        predictedImpact: `+${targetConfig.desiredValue - targetConfig.currentValue} ${targetConfig.targetMetric} in ${targetConfig.timeframeDays} days`,
        confidenceScore: 0.88 - idx * 0.05,
        evidenceGrade: 'HIGH_CONFIDENCE_TELEMETRY',
        baselineValue: targetConfig.currentValue,
        expectedValue: targetConfig.desiredValue,
        rangeMin: minBound,
        rangeMax: maxBound,
        recommendedBudgetShift: `Increase ${channel} allocation by 15%`,
        projectedRankChange: -1.5,
        assumptions: [
          { label: `Channel Efficiency Score (${channel.toUpperCase()})`, sensitivity: 'HIGH' },
          { label: 'Conversion Rate Stability', sensitivity: 'MEDIUM' },
        ],
      };
    });
  }
}
