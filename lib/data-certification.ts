export type DataCertificationState =
  | 'CERTIFIED_LIVE'
  | 'STALE_MAPPED'
  | 'HISTORICAL_UNVERIFIED'
  | 'MAPPED_PENDING_SYNC'
  | 'UNMAPPED';

export interface ProvenanceEvaluationInput {
  dbIsCertifiedFlag: boolean;
  mappedAccountsCount: number;
  verifiedConnectionsCount: number;
  dailyMetricsCount: number;
  platformMetricsCount: number;
  keywordRowsCount: number;
  latestMetricDate: string | null;
  referenceDate?: Date;
  freshnessThresholdDays?: number;
}

export interface ProvenanceEvaluationResult {
  certificationState: DataCertificationState;
  isCertified: boolean;
  isLiveSyncVerified: boolean;
  hasHistoricalData: boolean;
  latestMetricDate: string | null;
  stalenessDays: number | null;
  reason: string;
}

/**
 * CR-012: Strictly separates historical database records from verified live synchronization.
 * Never marks a client certified merely because `clients.is_certified = true` or rows exist.
 */
export function evaluateClientDataProvenance(
  input: ProvenanceEvaluationInput
): ProvenanceEvaluationResult {
  const now = input.referenceDate || new Date();
  const maxFreshDays = input.freshnessThresholdDays ?? 7;

  const totalMetricRows =
    input.dailyMetricsCount + input.platformMetricsCount + input.keywordRowsCount;
  const hasHistoricalData = totalMetricRows > 0;

  let stalenessDays: number | null = null;
  if (input.latestMetricDate) {
    const parsed = new Date(input.latestMetricDate);
    if (!Number.isNaN(parsed.getTime())) {
      const diffMs = now.getTime() - parsed.getTime();
      stalenessDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    }
  }

  const isFresh = stalenessDays !== null && stalenessDays <= maxFreshDays;
  const hasVerifiedMapping =
    input.mappedAccountsCount > 0 && input.verifiedConnectionsCount > 0;

  // Case 1: No provider mappings exist in account_mappings
  if (input.mappedAccountsCount === 0) {
    if (hasHistoricalData) {
      return {
        certificationState: 'HISTORICAL_UNVERIFIED',
        isCertified: false,
        isLiveSyncVerified: false,
        hasHistoricalData: true,
        latestMetricDate: input.latestMetricDate,
        stalenessDays,
        reason: `Historical records exist (latest: ${
          input.latestMetricDate || 'unknown'
        }), but 0 active provider mappings or live connections are configured.`,
      };
    }

    return {
      certificationState: 'UNMAPPED',
      isCertified: false,
      isLiveSyncVerified: false,
      hasHistoricalData: false,
      latestMetricDate: null,
      stalenessDays: null,
      reason: 'No provider accounts mapped and no telemetry records present.',
    };
  }

  // Case 2: Mappings exist, but no telemetry has been ingested yet
  if (!hasHistoricalData) {
    return {
      certificationState: 'MAPPED_PENDING_SYNC',
      isCertified: false,
      isLiveSyncVerified: false,
      hasHistoricalData: false,
      latestMetricDate: null,
      stalenessDays: null,
      reason: 'Provider account mapping saved; awaiting initial verified ingestion.',
    };
  }

  // Case 3: Mappings and telemetry exist, but data is older than the freshness window
  if (!isFresh) {
    return {
      certificationState: 'STALE_MAPPED',
      isCertified: false,
      isLiveSyncVerified: false,
      hasHistoricalData: true,
      latestMetricDate: input.latestMetricDate,
      stalenessDays,
      reason: `Mapped telemetry is stale (${stalenessDays} days old; latest period ${input.latestMetricDate}).`,
    };
  }

  // Case 4: Verified mapping + verified connection + fresh telemetry + DB certification flag
  if (hasVerifiedMapping && isFresh && input.dbIsCertifiedFlag) {
    return {
      certificationState: 'CERTIFIED_LIVE',
      isCertified: true,
      isLiveSyncVerified: true,
      hasHistoricalData: true,
      latestMetricDate: input.latestMetricDate,
      stalenessDays,
      reason: 'Verified provider mappings and current telemetry confirmed.',
    };
  }

  return {
    certificationState: 'HISTORICAL_UNVERIFIED',
    isCertified: false,
    isLiveSyncVerified: false,
    hasHistoricalData: true,
    latestMetricDate: input.latestMetricDate,
    stalenessDays,
    reason: 'Telemetry present but live provider connection verification is incomplete.',
  };
}
