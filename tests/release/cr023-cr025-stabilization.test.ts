import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import {
  buildDynamicReportingPresets,
  isValidIsoDateString,
} from '../../lib/reporting-period';
import { resolveAuthenticatedContext } from '../../lib/auth-guard';
import { GET as getAutomationRoute } from '../../app/api/automation/route';

describe('CR-023 / CR-024 / CR-025 Release Stabilization Suite', () => {
  it('CR-023: Anonymous request to /api/clients or /api/automation returns 401 without leaking client count', async () => {
    const req = new NextRequest('http://localhost:3000/api/clients');
    const authRes = await resolveAuthenticatedContext(req);
    expect(authRes.authorized).toBe(false);
    expect(authRes.errorResponse?.status).toBe(401);

    const autoReq = new NextRequest(
      'http://localhost:3000/api/automation?clientId=db2c2c46-d16b-48bd-9bf9-d530e61ca2b4'
    );
    const autoRes = await getAutomationRoute(autoReq);
    expect(autoRes.status).toBe(401);
  });

  it('CR-024: Calculates dynamic timezone-aware reporting presets relative to reference date', () => {
    const refDate = new Date('2026-10-23T16:00:00Z');
    const presets = buildDynamicReportingPresets('America/New_York', refDate);

    expect(presets.length).toBe(4);
    const mtd = presets.find((p) => p.presetId === 'MONTH_TO_DATE');
    const prevMonth = presets.find((p) => p.presetId === 'LAST_COMPLETE_MONTH');

    expect(mtd?.startDate).toBe('2026-10-01');
    expect(mtd?.endDate).toBe('2026-10-23');
    expect(prevMonth?.startDate).toBe('2026-09-01');
    expect(prevMonth?.endDate).toBe('2026-09-30');
  });

  it('CR-024: Validates ISO YYYY-MM-DD reporting dates strictly', () => {
    expect(isValidIsoDateString('2026-10-23')).toBe(true);
    expect(isValidIsoDateString('invalid-date')).toBe(false);
    expect(isValidIsoDateString('')).toBe(false);
  });
});
