import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateTenantAccess,
  evaluateClientAccessPolicy,
  VerifiedUserContext,
} from '../../lib/auth-policy';
import { evaluateClientDataProvenance } from '../../lib/data-certification';

const PRINCIPAL_ALPHA: VerifiedUserContext = {
  userId: '11111111-aaaa-4444-8888-111111111111',
  email: 'alpha@tenant-a.example.com',
  isSuperAdmin: false,
  authorizedTenantIds: ['00000000-0000-0000-0000-000000000001'],
};

const PRINCIPAL_BETA: VerifiedUserContext = {
  userId: '22222222-bbbb-4444-8888-222222222222',
  email: 'beta@tenant-b.example.com',
  isSuperAdmin: false,
  authorizedTenantIds: ['3b1af730-f606-4b88-8a81-0e000e4a7678'],
};

const CLIENT_HIGH_RISE_TENANT_A = {
  id: '98b58332-a79d-47ac-b771-96ecce1f04fc',
  tenant_id: '00000000-0000-0000-0000-000000000001',
};

describe('CR-011 & CR-012 Release Verification Suite', () => {
  it('1. Rejects anonymous requests to /api/clients and /api/telemetry/client-data with 401', () => {
    const tenantDecision = evaluateTenantAccess(null, null);
    assert.equal(tenantDecision.allowed, false);
    assert.equal(tenantDecision.status, 401);

    const clientDecision = evaluateClientAccessPolicy(null, CLIENT_HIGH_RISE_TENANT_A);
    assert.equal(clientDecision.allowed, false);
    assert.equal(clientDecision.status, 401);
  });

  it('2. Allows Principal Alpha to access Tenant A client (Positive Auth Path)', () => {
    const decision = evaluateClientAccessPolicy(
      PRINCIPAL_ALPHA,
      CLIENT_HIGH_RISE_TENANT_A
    );
    assert.equal(decision.allowed, true);
    assert.equal(decision.status, 200);
    if (decision.allowed) {
      assert.equal(
        decision.effectiveTenantId,
        '00000000-0000-0000-0000-000000000001'
      );
    }
  });

  it('3. Denies Principal Beta cross-tenant access to Tenant A client with 403 (Negative Auth Path)', () => {
    const decision = evaluateClientAccessPolicy(
      PRINCIPAL_BETA,
      CLIENT_HIGH_RISE_TENANT_A
    );
    assert.equal(decision.allowed, false);
    assert.equal(decision.status, 403);
    if (!decision.allowed) {
      assert.equal(decision.code, 'CROSS_TENANT_ACCESS_DENIED');
    }
  });

  it('4. CR-012: Refuses to certify High Rise when dbIsCertifiedFlag=true but 0 account_mappings exist', () => {
    const result = evaluateClientDataProvenance({
      dbIsCertifiedFlag: true,
      mappedAccountsCount: 0,
      verifiedConnectionsCount: 0,
      dailyMetricsCount: 10,
      platformMetricsCount: 12,
      keywordRowsCount: 10,
      latestMetricDate: '2026-08-29',
      referenceDate: new Date('2026-10-21T12:00:00Z'),
    });

    assert.equal(result.isCertified, false);
    assert.equal(result.isLiveSyncVerified, false);
    assert.equal(result.certificationState, 'HISTORICAL_UNVERIFIED');
    assert.equal(result.hasHistoricalData, true);
    assert.equal(result.stalenessDays, 53);
  });

  it('5. CR-012: Refuses to certify mapped client when telemetry is older than 7-day freshness window', () => {
    const result = evaluateClientDataProvenance({
      dbIsCertifiedFlag: true,
      mappedAccountsCount: 2,
      verifiedConnectionsCount: 1,
      dailyMetricsCount: 10,
      platformMetricsCount: 12,
      keywordRowsCount: 10,
      latestMetricDate: '2026-08-29',
      referenceDate: new Date('2026-10-21T12:00:00Z'),
    });

    assert.equal(result.isCertified, false);
    assert.equal(result.certificationState, 'STALE_MAPPED');
  });

  it('6. CR-012: Certifies client ONLY when mappings>0, connections>0, and latestMetricDate is fresh', () => {
    const result = evaluateClientDataProvenance({
      dbIsCertifiedFlag: true,
      mappedAccountsCount: 3,
      verifiedConnectionsCount: 2,
      dailyMetricsCount: 10,
      platformMetricsCount: 12,
      keywordRowsCount: 10,
      latestMetricDate: '2026-10-20',
      referenceDate: new Date('2026-10-21T12:00:00Z'),
    });

    assert.equal(result.isCertified, true);
    assert.equal(result.isLiveSyncVerified, true);
    assert.equal(result.certificationState, 'CERTIFIED_LIVE');
    assert.equal(result.stalenessDays, 1);
  });
});
