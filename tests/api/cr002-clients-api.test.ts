import { describe, it, expect } from 'vitest';
import { normalizeClientRow } from '../../app/api/clients/route';

describe('CR-002 Authoritative Client Registry & Certification Contract', () => {
  const TENANT_ID = '00000000-0000-0000-0000-000000000001';

  it('1. Never certifies a database client record that has zero mapped provider resources', () => {
    // Even if legacy database row has is_certified = true, 0 mappings must evaluate to false
    const legacyRow = {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      tenant_id: TENANT_ID,
      name: 'ABC Motors',
      is_certified: true,
      service_areas: ['30301'],
      mappings: {},
    };

    const normalized = normalizeClientRow(legacyRow, []);
    expect(normalized.is_certified).toBe(false);
    expect(normalized.mapped_resource_count).toBe(0);
  });

  it('2. Certifies a client only when both is_certified flag and valid account mappings exist', () => {
    const dbRow = {
      id: 'bf93fef0-fc60-4119-8ea2-68a274984355',
      tenant_id: TENANT_ID,
      name: 'High Rise Chimney Sweep & Service',
      is_certified: true,
      service_areas: ['53202', '53203'],
      mappings: {},
    };

    const accountMappings = [
      {
        client_id: dbRow.id,
        provider: 'gmb',
        external_account_id: 'locations/847291048291',
      },
      {
        client_id: dbRow.id,
        provider: 'google_ads',
        external_account_id: '123-456-7890',
      },
    ];

    const normalized = normalizeClientRow(dbRow, accountMappings);
    expect(normalized.is_certified).toBe(true);
    expect(normalized.mapped_resource_count).toBe(2);
    expect(normalized.mappings.gmb_location_id).toBe('locations/847291048291');
    expect(normalized.mappings.google_ads_id).toBe('123-456-7890');
  });

  it('3. Initializes newly onboarded clients in an unmapped, uncertified state', () => {
    const newlyCreatedRow = {
      id: '11111111-2222-3333-4444-555555555555',
      tenant_id: TENANT_ID,
      name: 'New Onboarding Client',
      is_certified: false,
      service_areas: ['18360'],
      mappings: {},
    };

    const normalized = normalizeClientRow(newlyCreatedRow, []);
    expect(normalized.is_certified).toBe(false);
    expect(normalized.status).toBe('onboarding');
    expect(normalized.mapped_resource_count).toBe(0);
  });
});
