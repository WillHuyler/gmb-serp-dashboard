import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { VerifiedUserContext, evaluateTenantAccess, evaluateClientAccessPolicy } from './auth-policy';

export const AUTH_COOKIE_ACCESS = 'sb-access-token';
export const AUTH_COOKIE_REFRESH = 'sb-refresh-token';

export interface AuthSessionContext {
  userId: string;
  email?: string | null;
  role?: string;
  tenantId: string;
  authorizedTenantIds: string[];
  authorizedClientIds: string[];
  isSuperAdmin: boolean;
}

export interface AuthValidationResult {
  authorized: boolean;
  status: number;
  context?: AuthSessionContext;
  supabase?: SupabaseClient;
  errorResponse?: NextResponse;
  response?: NextResponse;
}

function fail(status: number, error: string, message: string): AuthValidationResult {
  const res = NextResponse.json({ success: false, error, message }, { status });
  return { authorized: false, status, errorResponse: res, response: res };
}

export function extractAccessToken(req: NextRequest): string | null {
  const h = req.headers.get('authorization') || req.headers.get('Authorization');
  if (h?.startsWith('Bearer ')) return h.slice(7).trim() || null;
  for (const c of req.cookies.getAll()) {
    if (c.name === AUTH_COOKIE_ACCESS && c.value) return c.value;
    if (c.name.startsWith('sb-') && c.name.endsWith('-auth-token') && c.value) {
      try {
        const p = JSON.parse(c.value);
        if (Array.isArray(p) && typeof p[0] === 'string') return p[0];
        if (p?.access_token) return p.access_token;
      } catch {
        if (c.value.split('.').length === 3) return c.value;
      }
    }
  }
  return null;
}

export function getServerSupabaseClient(accessToken?: string | null): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const opts = accessToken
    ? { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    : { auth: { persistSession: false, autoRefreshToken: false } };
  return createClient(url, accessToken ? anonKey : (serviceKey || anonKey), opts);
}

export async function requireAuthenticatedSession(req: NextRequest, requestedTenantId?: string | null): Promise<AuthValidationResult> {
  const token = extractAccessToken(req);
  if (!token) return fail(401, 'UNAUTHENTICATED', 'Authentication required.');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !anonKey) return fail(503, 'AUTH_UNAVAILABLE', 'Supabase env missing.');

  const userClient = getServerSupabaseClient(token);
  const metaClient = getServerSupabaseClient();
  const { data: { user }, error: authErr } = await userClient.auth.getUser(token);
  if (authErr || !user) return fail(401, 'INVALID_SESSION', 'Invalid or expired session.');

  const [{ data: prof }, { data: mems }] = await Promise.all([
    metaClient.from('profiles').select('id, role, is_super_admin').eq('id', user.id).maybeSingle(),
    metaClient.from('tenant_memberships').select('tenant_id, role').eq('user_id', user.id),
  ]);

  const isSuperAdmin = Boolean(prof?.is_super_admin || prof?.role === 'super_admin' || prof?.role === 'PLATFORM_SUPER_ADMIN');
  let authorizedTenantIds = Array.from(new Set((mems || []).map((m: any) => m.tenant_id).filter(Boolean))) as string[];
  if (isSuperAdmin && authorizedTenantIds.length === 0) {
    const { data: tRows } = await metaClient.from('tenants').select('id');
    authorizedTenantIds = (tRows || []).map((t: any) => t.id);
  }

  const verifiedUser: VerifiedUserContext = { userId: user.id, email: user.email
