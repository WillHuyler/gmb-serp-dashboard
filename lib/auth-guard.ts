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

export function getServerSupabaseClient(reqOrToken?: NextRequest | string | null): SupabaseClient {
  const token = typeof reqOrToken === 'string' ? reqOrToken : (reqOrToken ? extractAccessToken(reqOrToken) : null);
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const o: any = { auth: { persistSession: false, autoRefreshToken: false } };
  if (token) o.global = { headers: { Authorization: `Bearer ${token}` } };
  return createClient(u, anon, o);
}

function getPrivilegedMetadataClient(): SupabaseClient {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(u, k, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function requireAuthenticatedSession(req: NextRequest, reqTenantId?: string | null): Promise<AuthValidationResult> {
  const token = extractAccessToken(req);
  if (!token) return fail(401, 'UNAUTHENTICATED', 'Authentication required.');
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!u || !anon) return fail(503, 'AUTH_UNAVAILABLE', 'Supabase env missing.');

  const uClient = getServerSupabaseClient(token);
  const { data: { user }, error: aErr } = await uClient.auth.getUser(token);
  if (aErr || !user) return fail(401, 'INVALID_SESSION', 'Invalid or expired session.');

  // Privileged client created ONLY after user session is verified
  const mClient = getPrivilegedMetadataClient();
  const [profRes, memsRes] = await Promise.all([
    mClient.from('profiles').select('id, tenant_id, email, role, created_at').eq('id', user.id).maybeSingle(),
    mClient.from('tenant_memberships').select('tenant_id, role').eq('user_id', user.id),
  ]);
  if (profRes.error || memsRes.error) {
    return fail(500, 'IDENTITY_RESOLUTION_FAILED', profRes.error?.message || memsRes.error?.message || 'Profile lookup failed.');
  }

  const prof = profRes.data;
  const roleStr = String(prof?.role || '');
  const isSuperAdmin = roleStr === 'PLATFORM_SUPER_ADMIN' || roleStr === 'super_admin';

  const memberTenants = (memsRes.data || []).map((m: any) => m.tenant_id).filter(Boolean);
  if (prof?.tenant_id) memberTenants.push(prof.tenant_id);
  let tIds = Array.from(new Set(memberTenants)) as string[];

  if (isSuperAdmin) {
    const tRes = await mClient.from('tenants').select('id');
    if (tRes.error) return fail(500, 'TENANT_LOOKUP_FAILED', tRes.error.message);
    const allTenants = (tRes.data || []).map((t: any) => t.id);
    tIds = Array.from(new Set([...tIds, ...allTenants]));
  }

  const dec = evaluateTenantAccess({ userId: user.id, email: user.email, isSuperAdmin, authorizedTenantIds: tIds }, reqTenantId);
  if (!dec.allowed) return fail(dec.status, dec.code, dec.message);

  const cRes = await mClient.from('clients').select('id').in('tenant_id', tIds.length ? tIds : [dec.effectiveTenantId]);
  if (cRes.error) return fail(500, 'CLIENT_SCOPE_LOOKUP_FAILED', cRes.error.message);
  const cIds = (cRes.data || []).map((c: any) => c.id);

  return {
    authorized: true,
    status: 200,
    context: { userId: user.id, email: user.email, role: isSuperAdmin ? 'PLATFORM_SUPER_ADMIN' : (roleStr || 'member'), tenantId: dec.effectiveTenantId, authorizedTenantIds: tIds, authorizedClientIds: cIds, isSuperAdmin },
    supabase: mClient,
  };
}

export const resolveAuthenticatedContext = requireAuthenticatedSession;

export async function validateClientAccess(req: NextRequest, clientId?: string | null, reqTenantOrFlag?: string | boolean | null): Promise<AuthValidationResult> {
  const reqTenantId = typeof reqTenantOrFlag === 'string' ? reqTenantOrFlag : null;
  const s = await requireAuthenticatedSession(req, reqTenantId);
  if (!s.authorized || !s.context || !s.supabase || !clientId) return s;
  const { data: row, error } = await s.supabase.from('clients').select('id, tenant_id').eq('id', clientId).maybeSingle();
  if (error) return fail(500, 'CLIENT_LOOKUP_FAILED', error.message);
  const d = evaluateClientAccessPolicy({ userId: s.context.userId, email: s.context.email, isSuperAdmin: s.context.isSuperAdmin, authorizedTenantIds: s.context.authorizedTenantIds }, row, reqTenantId);
  if (!d.allowed) return fail(d.status, d.code, d.message);
  return { ...s, context: { ...s.context, tenantId: d.effectiveTenantId } };
}
// EOF
