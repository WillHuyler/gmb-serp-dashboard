export type HealthStatus = 'VALID' | 'DATA_UNAVAILABLE' | 'STALE' | 'REVIEW_REQUIRED';

export interface MetricReceipt {
  metricId: string;
  tenantId: string;
  clientId: string;
  sampleSize: number;
  calculatedAt: string;
  sourceTable: string;
  formulaVersion: string;
}

export interface CanonicalMetricResult<T> {
  value: T | null;
  healthStatus: HealthStatus;
  statusMessage: string;
  provenance: MetricReceipt;
}

export interface TargetPacingResult {
  currentValue: number | null;
  targetValue: number | null;
  pacePercentage: number | null;
  status: 'ON_PACE' | 'BEHIND' | 'EXCEEDING' | 'UNAVAILABLE';
}

export class MetricRegistry {
  /**
   * Calculates Local Visibility Score without synthetic fallback values.
   */
  static calculateLocalVisibility(
    tenantId: string,
    clientId: string,
    keywords: Array<{ id: number; rank_history?: Array<{ serp_rank: number }> }>
  ): CanonicalMetricResult<number> {
    const activeKeywords = keywords || [];
    
    if (!activeKeywords || activeKeywords.length === 0) {
      return {
        value: null,
        healthStatus: 'DATA_UNAVAILABLE',
        statusMessage: 'No tracked terms found for entity.',
        provenance: {
          metricId: 'local_visibility',
          tenantId,
          clientId,
          sampleSize: 0,
          calculatedAt: new Date().toISOString(),
          sourceTable: 'keyword_library',
          formulaVersion: 'v2.0-certified',
        },
      };
    }

    let totalRanks = 0;
    let trackedCount = 0;

    activeKeywords.forEach((kw) => {
      if (kw.rank_history && kw.rank_history.length > 0) {
        const latestRank = kw.rank_history[0].serp_rank;
        totalRanks += latestRank;
        trackedCount++;
      }
    });

    if (trackedCount === 0) {
      return {
        value: null,
        healthStatus: 'DATA_UNAVAILABLE',
        statusMessage: 'Keywords present but missing rank history observations.',
        provenance: {
          metricId: 'local_visibility',
          tenantId,
          clientId,
          sampleSize: 0,
          calculatedAt: new Date().toISOString(),
          sourceTable: 'rank_history',
          formulaVersion: 'v2.0-certified',
        },
      };
    }

    // Top 3 Local Pack placement score calculation
    const avgRank = totalRanks / trackedCount;
    const visibilityScore = Math.max(0, Math.min(100, Math.round(((11 - avgRank) / 10) * 100)));

    return {
      value: visibilityScore,
      healthStatus: 'VALID',
      statusMessage: 'Certified from raw SERP rank history.',
      provenance: {
        metricId: 'local_visibility',
        tenantId,
        clientId,
        sampleSize: trackedCount,
        calculatedAt: new Date().toISOString(),
        sourceTable: 'rank_history',
        formulaVersion: 'v2.0-certified',
      },
    };
  }

  /**
   * Calculates target pacing without arbitrary default assumptions.
   */
  static calculateTargetPacing(current: number | null, target: number | null): TargetPacingResult {
    if (current === null || target === null || target === 0) {
      return {
        currentValue: current,
        targetValue: target,
        pacePercentage: null,
        status: 'UNAVAILABLE',
      };
    }

    const pace = Math.round((current / target) * 100);
    let status: 'ON_PACE' | 'BEHIND' | 'EXCEEDING' = 'ON_PACE';

    if (pace < 90) status = 'BEHIND';
    if (pace > 110) status = 'EXCEEDING';

    return {
      currentValue: current,
      targetValue: target,
      pacePercentage: pace,
      status,
    };
  }
}
