export type MetricHealthStatus = 
  | 'VALID'
  | 'ZERO'
  | 'DATA_UNAVAILABLE'
  | 'NOT_CONNECTED'
  | 'STALE'
  | 'INSUFFICIENT_DATA'
  | 'VALIDATION_FAILED';

export interface CanonicalMetricResult<T> {
  metricId: string;
  metricName: string;
  value: T | null;
  unit: string;
  healthStatus: MetricHealthStatus;
  statusMessage?: string;
  provenance: {
    tenantId: string;
    clientId: string;
    sourceProvider: string;
    sampleSize: number;
    calculatedAt: string;
  };
}

export interface TargetPacingResult {
  currentValue: number;
  targetValue: number;
  variance: number;
  pacePercentage: number;
  status: 'ON_TRACK' | 'BEHIND' | 'EXCEEDING';
}

export class MetricRegistry {
  /**
   * Calculates Local Pack Visibility Percentage cleanly.
   * Prevents Contradictory Metric States (Bug Class #55).
   */
  static calculateLocalVisibility(
    tenantId: string,
    clientId: string,
    activeKeywords: Array<{ id: number; rank_history?: Array<{ serp_rank: number }> }>
  ): CanonicalMetricResult<number> {
    const calculatedAt = new Date().toISOString();

    if (!activeKeywords || activeKeywords.length === 0) {
      return {
        metricId: 'local_visibility_score',
        metricName: 'Local Pack Visibility Score',
        value: null,
        unit: '%',
        healthStatus: 'DATA_UNAVAILABLE',
        statusMessage: 'No active telemetry terms configured for this entity.',
        provenance: {
          tenantId: tenantId || '00000000-0000-0000-0000-000000000001',
          clientId,
          sourceProvider: 'otterwatch_serp',
          sampleSize: 0,
          calculatedAt,
        },
      };
    }

    const top3Count = activeKeywords.filter((kw) => {
      const history = kw.rank_history || [];
      const latest = history[0];
      return latest && latest.serp_rank > 0 && latest.serp_rank <= 3;
    }).length;

    const visibilityScore = Math.round((top3Count / activeKeywords.length) * 100);

    return {
      metricId: 'local_visibility_score',
      metricName: 'Local Pack Visibility Score',
      value: visibilityScore,
      unit: '%',
      healthStatus: 'VALID',
      provenance: {
        tenantId: tenantId || '00000000-0000-0000-0000-000000000001',
        clientId,
        sourceProvider: 'otterwatch_serp',
        sampleSize: activeKeywords.length,
        calculatedAt,
      },
    };
  }

  /**
   * Computes Pacing and Target Variances for Executive KPIs.
   */
  static calculateTargetPacing(currentValue: number, targetValue: number): TargetPacingResult {
    if (targetValue <= 0) {
      return { currentValue, targetValue, variance: 0, pacePercentage: 100, status: 'ON_TRACK' };
    }

    const variance = currentValue - targetValue;
    const pacePercentage = Math.round((currentValue / targetValue) * 100);
    let status: 'ON_TRACK' | 'BEHIND' | 'EXCEEDING' = 'ON_TRACK';

    if (pacePercentage < 90) status = 'BEHIND';
    else if (pacePercentage >= 105) status = 'EXCEEDING';

    return { currentValue, targetValue, variance, pacePercentage, status };
  }
}
