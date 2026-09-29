export interface CanonicalMetricValue {
  metricId: 'SPEND' | 'INTERACTIONS' | 'PHONE_CALLS' | 'DIRECTIONS' | 'WEBSITE_CLICKS' | 'LEADS' | 'CPL' | 'LOCAL_RANK';
  rawNumerator?: number;
  rawDenominator?: number;
  calculatedValue: number | null;
  displayFormatted: string;
  status: 'CERTIFIED' | 'UNCERTIFIED' | 'NOT_CONNECTED' | 'STALE' | 'INSUFFICIENT_DATA';
  provenance: {
    tenantId: string;
    clientId: string;
    provider: string;
    externalAccountId?: string;
    ingestionRunId?: string;
    lastSyncedAt?: string;
  };
}

/**
 * Standardizes raw provider telemetry into certified canonical metric objects.
 */
export function normalizeMetric(
  metricId: CanonicalMetricValue['metricId'],
  rawValue: number | null,
  client: { id: string; tenant_id: string; is_certified: boolean },
  provider: string,
  externalAccountId?: string,
  ingestionRunId?: string
): CanonicalMetricValue {
  // Fail-Closed Gate: If provider is unmapped or client is uncertified
  if (!externalAccountId || !client.is_certified) {
    return {
      metricId,
      calculatedValue: null,
      displayFormatted: externalAccountId ? 'UNCERTIFIED' : 'NOT CONNECTED',
      status: externalAccountId ? 'UNCERTIFIED' : 'NOT_CONNECTED',
      provenance: {
        tenantId: client.tenant_id,
        clientId: client.id,
        provider,
        externalAccountId,
      },
    };
  }

  // Certified Record Output
  if (rawValue === null || rawValue === undefined) {
    return {
      metricId,
      calculatedValue: null,
      displayFormatted: '—',
      status: 'INSUFFICIENT_DATA',
      provenance: {
        tenantId: client.tenant_id,
        clientId: client.id,
        provider,
        externalAccountId,
        ingestionRunId,
        lastSyncedAt: new Date().toISOString(),
      },
    };
  }

  const formatted =
    metricId === 'SPEND' || metricId === 'CPL'
      ? `$${rawValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : metricId === 'LOCAL_RANK'
      ? `#${rawValue.toFixed(1)}`
      : rawValue.toLocaleString('en-US');

  return {
    metricId,
    calculatedValue: rawValue,
    displayFormatted: formatted,
    status: 'CERTIFIED',
    provenance: {
      tenantId: client.tenant_id,
      clientId: client.id,
      provider,
      externalAccountId,
      ingestionRunId,
      lastSyncedAt: new Date().toISOString(),
    },
  };
}
