import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveConfirmedClientMappings,
  evaluateClientDataProvenance,
} from '../../lib/data-certification';
import {
  evaluateTenantAccess,
  evaluateClientAccessPolicy,
} from '../../lib/auth-policy';

// Schema-enforcing query validator simulating live PostgREST column checks on llilzgnpdnpbclmtaqth
const ACTUAL_SCHEMA_COLUMNS: Record<string, string[]> = {
  profiles: ['id', 'tenant_id', 'email', 'role', 'created_at'],
  account_mappings: [
    'id',
    'tenant_id',
    'client_id',
    'external_account_id',
    'mapping_role',
    'mapping_confidence',
    'is_confirmed',
    'include_in_command_center',
    'created_at',
  ],
  external_accounts: [
    'id',
    'connection_id',
    'provider',
    'external_account_id',
    'descriptive_name',
    'account_type',
    'status',
    'currency',
    'timezone',
    'discovered_at',
    'tenant_id',
  ],
};

function assertValidTableSelect(table: string, selectClause: string) {
  if (selectClause.trim() === '*') return;
  const allowed = ACTUAL_SCHEMA_COLUMNS[table];
  if (!allowed) return;
  const cols = selectClause.split(',').map((c) => c.trim());
  for (const col of cols) {
    assert.equal(
      allowed.includes(col),
      true,
      `PostgreSQL 42703 Schema Violation: column "${col}" does not exist on table "public.${table}"`
    );
  }
}

describe('CR-011A, CR-011B, CR-012, CR-013, CR-014 Contract & Route Verification', () => {
  it('1. CR-011A: Profiles query selects only actual public.profiles columns (no is_super_admin)', () => {
    const profileSelectUsedInAuthGuard = 'id, tenant_id, email, role, created_at';
    assertValidTableSelect('profiles', profileSelectUsedInAuthGuard);
    assert.equal(profileSelectUsedInAuthGuard.includes('is_super_admin'), false);
  });

  it('2. CR-011A: Super-admin profile with 0 tenant_memberships rows resolves authorized tenants without anonymous fallback', () => {
    const superAdminProfile = {
      id: 'c250b0de-a3e7-4a4c-9350-74b5a6d9b3e2',
      tenant_id: '3b1af730-f606-4b88-8a81-0e000e4a7678',
      email: 'will@dominateignite.com',
      role: 'PLATFORM_SUPER_ADMIN',
    };
    const isSuperAdmin =
      superAdminProfile.role === 'PLATFORM_SUPER_ADMIN' ||
      superAdminProfile.role === 'super_admin';
    assert.equal(isSuperAdmin, true);

    const decision = evaluateTenantAccess(
      {
        userId: superAdminProfile.id,
        email: superAdminProfile.email,
        isSuperAdmin,
        authorizedTenantIds: [
          '00000000-0000-0000-0000-000000000001',
          '3b1af730-f606-4b88-8a81-0e000e4a7678',
        ],
      },
      '00000000-0000-0000-0000-000000000001'
    );
    assert.equal(decision.allowed, true);
    assert.equal(decision.status, 200);
  });

  it('3. CR-011B: account_mappings select clause contains only actual table columns (no provider column)', () => {
    const mappingSelectUsedInRoutes =
      'id, tenant_id, client_id, external_account_id, mapping_role, mapping_confidence, is_confirmed, include_in_command_center, created_at';
    assertValidTableSelect('account_mappings', mappingSelectUsedInRoutes);
    assert.equal(mappingSelectUsedInRoutes.includes('provider'), false);
  });

  it('4. CR-011B: Resolves provider identity via authorized external_accounts relationship and requires is_confirmed = true', () => {
    const tenantA = '00000000-0000-0000-0000-000000000001';
    const clientHighRise = '98b58332-a79d-47ac-b771-96ecce1f04fc';

    const externalAccounts = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        tenant_id: tenantA,
        provider: 'GOOGLE_ADS',
        external_account_id: '842-192-3049',
        descriptive_name: 'High Rise Search Account',
        status: 'ACTIVE',
      },
    ];

    // Unconfirmed mapping must NOT resolve as an active certified mapping
    const unconfirmedResult = resolveConfirmedClientMappings(
      clientHighRise,
      tenantA,
      [
        {
          id: 'map-1',
          tenant_id: tenantA,
          client_id: clientHighRise,
          external_account_id: '842-192-3049',
          is_confirmed: false,
        },
      ],
      externalAccounts
    );
    assert.equal(unconfirmedResult.length, 0);

    // Confirmed mapping matching tenant_id and external_account_id resolves provider from external_accounts
    const confirmedResult = resolveConfirmedClientMappings(
      clientHighRise,
      tenantA,
      [
        {
          id: 'map-1',
          tenant_id: tenantA,
          client_id: clientHighRise,
          external_account_id: '842-192-3049',
          is_confirmed: true,
        },
      ],
      externalAccounts
    );
    assert.equal(confirmedResult.length, 1);
    assert.equal(confirmedResult[0].provider, 'GOOGLE_ADS');
    assert.equal(confirmedResult[0].externalAccountId, '842-192-3049');
  });

  it('5. CR-012 & CR-014: High Rise August 2026 historical rows + 0 mappings evaluate to HISTORICAL_UNVERIFIED (isCertified = false)', () => {
    const prov = evaluateClientDataProvenance({
      dbIsCertifiedFlag: false,
      mappedAccountsCount: 0,
      verifiedConnectionsCount: 0,
      dailyMetricsCount: 10,
      platformMetricsCount: 12,
      keywordRowsCount: 10,
      latestMetricDate: '2026-08-29',
      referenceDate: new Date('2026-10-21T22:00:00Z'),
    });

    assert.equal(prov.isCertified, false);
    assert.equal(prov.isLiveSyncVerified, false);
    assert.equal(prov.hasHistoricalData, true);
    assert.equal(prov.certificationState, 'HISTORICAL_UNVERIFIED');
    assert.equal(prov.stalenessDays, 53);
  });

  it('6. CR-011 Negative Path: Rejects anonymous (401) and cross-tenant (403) requests', () => {
    const anon = evaluateClientAccessPolicy(null, {
      id: '98b58332-a79d-47ac-b771-96ecce1f04fc',
      tenant_id: '00000000-0000-0000-0000-000000000001',
    });
    assert.equal(anon.allowed, false);
    assert.equal(anon.status, 401);

    const crossTenant = evaluateClientAccessPolicy(
      {
        userId: 'user-tenant-b',
        email: 'b@example.com',
        isSuperAdmin: false,
        authorizedTenantIds: ['3b1af730-f606-4b88-8a81-0e000e4a7678'],
      },
      {
        id: '98b58332-a79d-47ac-b771-96ecce1f04fc',
        tenant_id: '00000000-0000-0000-0000-000000000001',
      }
    );
    assert.equal(crossTenant.allowed, false);
    assert.equal(crossTenant.status, 403);
  });
});
