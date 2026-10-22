import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { evaluateTenantAccess, evaluateClientAccessPolicy } from './auth-policy';

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

const fail = (status: number, error: string, message: string): AuthValidationResult => {
  const r = NextResponse.json({ success: false, error, message }, { status });
  return { authorized: false, status, errorResponse: r, response: r };
};

export function extractAccessToken(req: NextRequest): string | null {
  const h = req.headers.get('authorization') || req.headers.get('Authorization');
  if (h?.startsWith('Bearer ')) return h.slice(7).trim() || null;
  for (const c of req.cookies.getAll()) {
    if (c.name === AUTH_COOKIE_ACCESS && c.value) return c.value;
    if (c.name.startsWith('sb-') && c.name.endsWith('-auth-token') && c.value) {
      try {
        const p = JSON.parse(c.value);
        return Array.isArray(p) ? p[0] : (p?.access_token || null);
      } catch {
        if (c.value.split('.').length === 3) return c.value;
      }
    }
  }
  return null;
}

export function getServerSupabaseClient(token?: string | null): SupabaseClient {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const k = token ? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '') : (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
  const o: any = { auth: { persistSession: false, autoRefreshToken: false } };
  if (token) o.global = { headers: { Authorization: `Bearer ${token}` } };
  return createClient(u, k, o);
}

export async function requireAuthenticatedSession(req: NextRequest, reqTenantId?: string | null): Promise<AuthValidationResult> {
  const token = extractAccessToken(req);
  if (!token) return fail(401, 'UNAUTHENTICATED', 'Authentication required.');
  const uClient = getServerSupabaseClient(token);
  const mClient = getServerSupabaseClient();
  const { data: { user }, error: aErr } = await uClient.auth.getUser(token);
  if (aErr || !user) return fail(401, 'INVALID_SESSION', 'Invalid session.');

  const [{ data: prof }, { data: mems }] = await Promise.all([
    mClient.from('profiles').select('id, role, is_super_admin').eq('id', user.id).maybeSingle(),
    mClient.from('tenant_memberships').select('tenant_id').eq('user_id', user.id),
  ]);
  const isSuperAdmin = Boolean(prof?.is_super_admin || prof?.role === 'super_admin' || prof?.role === 'PLATFORM_SUPER_ADMIN');
  let tIds = Array.from(new Set((mems || []).map((m: any) => m.tenant_id).filter(Boolean))) as string[];
  if (isSuperAdmin && !tIds.length) {
    const { data: tRows } = await mClient.from('tenants').select('id');
    tIds = (tRows || []).map((t: any) => t.id);
  }
  const dec = evaluateTenantAccess({ userId: user.id, email: user.email, isSuperAdmin, authorizedTenantIds: tIds }, reqTenantId);
  if (!dec.allowed) return fail(dec.status, dec.code, dec.message);

  const { data: cRows } = await mClient.from('clients').select('id').in('tenant_id', tIds.length ? tIds : [dec.effectiveTenantId]);
  const cIds = (cRows || []).map((c: any) => c.id);
  return {
    authorized: true,
    status: 200,
    context: { userId: user.id, email: user.email, role: isSuperAdmin ? 'PLATFORM_SUPER_ADMIN' : (prof?.role || 'member'), tenantId: dec.effectiveTenantId, authorizedTenantIds: tIds, authorizedClientIds: cIds, isSuperAdmin },
    supabase: mClient,
  };
}

export const resolveAuthenticatedContext = requireAuthenticatedSession;

export async function validateClientAccess(req: NextRequest, clientId?: string | null, reqTenantId?: string | null): Promise<AuthValidationResult> {
  const s = await requireAuthenticatedSession(req, reqTenantId);
  if (!s.authorized || !s.context || !s.supabase || !clientId) return s;
  const { data: row, error } = await s.supabase.from('clients').select('id, tenant_id').eq('id', clientId).maybeSingle();
  if (error) return fail(500, 'CLIENT_LOOKUP_FAILED', 'Lookup error.');
  const d = evaluateClientAccessPolicy({ userId: s.context.userId, email: s.context.email, isSuperAdmin: s.context.isSuperAdmin, authorizedTenantIds: s.context.authorizedTenantIds }, row, reqTenantId);
  if (!d.allowed) return fail(d.status, d.code, d.message);
  return { ...s, context: { ...s.context, tenantId: d.effectiveTenantId } };
}
// EOF
