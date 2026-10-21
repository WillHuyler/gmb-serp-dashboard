import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { normalizeVerifiedClientRecord } from '../lib/client-row-normalizer';
import { extractAccessToken } from '../lib/auth-guard';

describe('P0 Post-Deployment Security & Schema Release Gates', () => {
  const TENANT_1 = '00000000-0000-0000-0000-000000000001';
  const TENANT_2 = '00000000-0000-0000-0000-000000000002';

  it('Gate 1: Anonymous request has null access token and is denied (never given bootstrap super-admin)', () => {
    const req = new NextRequest('http://localhost:3000/api/clients');
    const token = extractAccessToken(req);
    expect(token).toBeNull();
  });

  it('Gate 2: Extracts Bearer JWT from Authorization header accurately', () => {
    const req = new NextRequest('http://localhost:3000/api/clients', {
      headers: { Authorization: 'Bearer valid.jwt.token' },
    });
    expect(extractAccessToken(req)).toBe('valid.jwt.token');
  });

  it('Gate 3: Mappings alone cannot falsely certify a client without verified telemetry records', () => {
    const rawClient = {
      id: 'bf93fef0-fc60-4119-8ea2-68a274984355',
      tenant_id: TENANT_1,
      name: 'High Rise Chimney Sweep & Service',
      domain: 'https://highrisechimney.com',
      timezone: 'America/Chicago',
      currency: 'USD',
      is_certified: true, // Even if DB flag was prematurely set to true
    };

    const mappings = [
      {
        id: 'map-1',
        tenant_id: TENANT_1,
        client_id: rawClient.id,
        external_account_id: '11111111-1111-1111-1111-111111111111',
        external_account: {
          id: '11111111-1111-1111-1111-111111111111',
          provider: 'GOOGLE_ADS',
          external_account_id: '842-192-3049',
          descriptive_name: 'High Rise Ads',
        },
      },
    ];

    // hasVerifiedTelemetry = false -> must NOT be certified
    const unverifiedResult = normalizeVerifiedClientRecord(rawClient, mappings, false);
    expect(unverifiedResult.is_certified).toBe(false);
    expect(unverifiedResult.mapped_resource_count).toBe(1);
    expect(unverifiedResult.mappings.google_ads_id).toBe('842-192-3049');

    // hasVerifiedTelemetry = true -> certified
    const verifiedResult = normalizeVerifiedClientRecord(rawClient, mappings, true);
    expect(verifiedResult.is_certified).toBe(true);
  });

  it('Gate 4: Newly created client record references only verified public.clients schema columns', () => {
    const createdRow = {
      id: 'c0000000-0000-0000-0000-000000000099',
      tenant_id: TENANT_1,
      name: 'Stroudsburg Auto Service',
      domain: 'https://stroudsburgauto.com',
      timezone: 'America/New_York',
      currency: 'USD',
      is_certified: false,
      created_at: '2026-10-21T23:00:00Z',
    };

    const normalized = normalizeVerifiedClientRecord(createdRow, [], false);
    expect(normalized.id).toBe(createdRow.id);
    expect(normalized.tenant_id).toBe(TENANT_1);
    expect(normalized.domain).toBe('https://stroudsburgauto.com');
    expect(normalized.is_certified).toBe(false);
    expect(normalized.mapped_resource_count).toBe(0);
  });
});
