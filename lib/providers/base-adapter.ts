import { NextRequest } from 'next/server';

export interface DiscoveredAccount {
  externalAccountId: string;
  descriptiveName: string;
  accountType: string; // e.g., 'SEARCH', 'PAID_SOCIAL', 'ANALYTICS_PROPERTY'
  currency?: string;
  timezone?: string;
  parentManagerId?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED';
}

export interface SyncOptions {
  tenantId: string;
  clientId: string;
  externalAccountId: string;
  startDate: string; // ISO date 'YYYY-MM-DD'
  endDate: string;   // ISO date 'YYYY-MM-DD'
  ingestionRunId: string;
}

export interface TelemetryRecord {
  tenantId: string;
  clientId: string;
  externalAccountId: string;
  provider: string;
  metricId: string;
  metricValue: number;
  periodDate: string;
  ingestionRunId: string;
  isCertified: boolean;
  metadata?: Record<string, any>;
}

export interface ProviderAdapter {
  providerId: string;
  
  /** Initiates OAuth authorization URL generation */
  getAuthorizationUrl(tenantId: string, redirectUri: string): Promise<string>;
  
  /** Exchanges auth code for access/refresh tokens and persists credentials */
  handleCallback(code: string, tenantId: string): Promise<{ success: boolean; connectionId: string }>;
  
  /** Queries provider API for all accessible accounts/properties */
  discoverResources(connectionId: string): Promise<DiscoveredAccount[]>;
  
  /** Executes client-scoped telemetry pull for a verified mapping */
  syncTelemetry(options: SyncOptions): Promise<{ success: boolean; records: TelemetryRecord[]; errors?: string[] }>;
  
  /** Verifies token health and API response status */
  checkHealth(connectionId: string): Promise<{ status: 'LIVE' | 'DEGRADED' | 'EXPIRED' | 'DISCONNECTED'; message: string }>;
}
