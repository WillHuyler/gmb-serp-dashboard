import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GET as getSession, POST as postSession, DELETE as deleteSession } from '../../app/api/auth/session/route';
import { GET as getClients } from '../../app/api/clients/route';
import { GET as getAutomation } from '../../app/api/automation/route';
import { GET as getAggregate } from '../../app/api/telemetry/aggregate/route';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://llilzgnpdnpbclmtaqth.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

describe('CR-026 Release Certification & Multi-Principal RLS Verification', () => {
  it('1. Unauthenticated / anonymous principal is denied across all protected API routes (401)', async () => {
    const clientsReq = new NextRequest('http://localhost:3000/api/clients');
    const clientsRes = await getClients(clientsReq);
    expect(clientsRes.status).toBe(401);

    const autoReq = new NextRequest(
      'http://localhost:3000/api/automation?clientId=db2c2c46-d16b-48bd-9bf9-d530e61ca2b4'
    );
    const autoRes = await getAutomation(autoReq);
    expect(autoRes.status).toBe(401);

    const aggReq = new NextRequest(
      'http://localhost:3000/api/telemetry/aggregate?clientId=db2c2c46-d16b-48bd-9bf9-d530e61ca2b4'
    );
    const aggRes = await getAggregate(aggReq);
    expect(aggRes.status).toBe(401);
  });

  it('2. Anonymous Supabase client (anon role) cannot read protected tables directly via PostgREST', async () => {
    if (!SUPABASE_ANON_KEY) return;
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });

    const { data: clientsData, error: clientsErr } = await anonClient
      .from('clients')
      .select('id, name')
      .limit(5);

    // Anon access is revoked or returns 0 rows under RLS
    expect(clientsErr !== null || (clientsData || []).length === 0).toBe(true);
  });

  it('3. Session lifecycle rejects forged access tokens (401) and clears cookies on DELETE', async () => {
    const forgedPost = new NextRequest('http://localhost:3000/api/auth/session', {
      method: 'POST',
      body: JSON.stringify({ access_token: 'forged.jwt.token', refresh_token: 'invalid' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const postRes = await postSession(forgedPost);
    expect(postRes.status).toBe(401);

    const delRes = await deleteSession();
    expect(delRes.status).toBe(200);
    const body = await delRes.json();
    expect(body.authenticated).toBe(false);
  });

  it('4. Expired/missing access token with invalid refresh token triggers clean 401 logout', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/session', {
      method: 'GET',
      headers: {
        cookie: 'pl-sb-access-token=expired_token; pl-sb-refresh-token=invalid_refresh_token',
      },
    });
    const res = await getSession(req);
    expect(res.status).toBe(401);
    const payload = await res.json();
    expect(payload.authenticated).toBe(false);
  });
});
