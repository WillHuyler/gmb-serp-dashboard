export type DataCertificationState =
  | 'CERTIFIED_LIVE'
  | 'STALE_MAPPED'
  | 'HISTORICAL_UNVERIFIED'
  | 'MAPPED_PENDING_SYNC'
  | 'UNMAPPED';

export interface AccountMappingRecord {
  id: string;
  tenant_id: string;
  client_id: string;
  external_account_id: string;
  mapping_role?: string | null;
  mapping_confidence?: number | null;
  is_confirmed?: boolean | null;
  include_in_command_center?: boolean | null;
  created_at?: string;
}

export interface ExternalAccountRecord {
  id: string;
  tenant_id: string;
  connection_id?: string | null;
  provider: string;
  external_account_id: string;
  descriptive_name?: string | null;
  status?: string | null;
}

export interface ResolvedClientMapping {
  mappingId: string;
  clientId: string;
  tenantId: string;
  externalAccountId: string;
  provider: string;
  descriptiveName: string | null;
  isConfirmed: boolean;
}

export function resolveConfirmedClientMappings(
  clientId: string,
  tenantId: string,
  mappings: AccountMappingRecord[],
  externalAccounts: ExternalAccountRecord[]
): ResolvedClientMapping[] {
  const clientMaps = (mappings || []).filter(
    (m) => m.client_id === clientId && m.tenant_id === tenantId && m.is_confirmed === true
  );
  const tenantAccounts = (externalAccounts || []).filter(
    (ea) => ea.tenant_id === tenantId && (!ea.status || ea.status === 'ACTIVE')
  );

  const resolved: ResolvedClientMapping[] = [];
  for (const m of clientMaps) {
    const ea = tenantAccounts.find(
      (a) => a.id === m.external_account_id || a.external_account_id === m.external_account_id
    );
    if (ea && ea.provider) {
      resolved.push({
        mappingId: m.id,
        clientId,
        tenantId,
        externalAccountId: ea.external_account_id,
        provider: ea.provider.toUpperCase(),
        descriptiveName: ea.descriptive_name || null,
        isConfirmed: true,
      });
    }
  }
  return resolved;
}

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

export function evaluateClientDataProvenance(input: ProvenanceEvaluationInput): ProvenanceEvaluationResult {
  const now = input.referenceDate || new Date();
  const maxDays = input.freshnessThresholdDays ?? 7;
  const hasHistoricalData = (input.dailyMetricsCount + input.platformMetricsCount + input.keywordRowsCount) > 0;

  let stalenessDays: number | null = null;
  if (input.latestMetricDate) {
    const parsed = new Date(input.latestMetricDate);
    if (!Number.isNaN(parsed.getTime())) {
      stalenessDays = Math.max(0, Math.floor((now.getTime() - parsed.getTime()) / 86400000));
    }
  }

  const isFresh = stalenessDays !== null && stalenessDays <= maxDays;
  const hasVerifiedMapping = input.mappedAccountsCount > 0 && input.verifiedConnectionsCount > 0;

  if (input.mappedAccountsCount === 0) {
    if (hasHistoricalData) {
      return {
        certificationState: 'HISTORICAL_UNVERIFIED',
        isCertified: false,
        isLiveSyncVerified: false,
        hasHistoricalData: true,
        latestMetricDate: input.latestMetricDate,
        stalenessDays,
        reason: `Historical records present (latest: ${input.latestMetricDate || 'unknown'}), but 0 confirmed provider mappings exist.`,
      };
    }
    return {
      certificationState: 'UNMAPPED',
      isCertified: false,
      isLiveSyncVerified: false,
      hasHistoricalData: false,
      latestMetricDate: null,
      stalenessDays: null,
      reason: 'No confirmed provider accounts mapped and no telemetry records present.',
    };
  }

  if (!hasHistoricalData) {
    return {
      certificationState: 'MAPPED_PENDING_SYNC',
      isCertified: false,
      isLiveSyncVerified: false,
      hasHistoricalData: false,
      latestMetricDate: null,
      stalenessDays: null,
      reason: 'Confirmed provider mapping exists; awaiting initial verified ingestion.',
    };
  }

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

  if (hasVerifiedMapping && isFresh && input.dbIsCertifiedFlag) {
    return {
      certificationState: 'CERTIFIED_LIVE',
      isCertified: true,
      isLiveSyncVerified: true,
      hasHistoricalData: true,
      latestMetricDate: input.latestMetricDate,
      stalenessDays,
      reason: 'Confirmed provider mappings, active connections, and current telemetry verified.',
    };
  }

  return {
    certificationState: 'HISTORICAL_UNVERIFIED',
    isCertified: false,
    isLiveSyncVerified: false,
    hasHistoricalData: true,
    latestMetricDate: input.latestMetricDate,
    stalenessDays,
    reason: 'Telemetry present but active provider connection verification is incomplete.',
  };
}
// EOF
