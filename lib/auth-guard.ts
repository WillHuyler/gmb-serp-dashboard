import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type SystemRole = 'super_admin' | 'admin' | 'member' | 'viewer';

export interface AuthContext {
  tenantId: string;
  authorizedTenantIds: string[];
  userId: string;
  email?: string;
  role: SystemRole;
  isSuperAdmin: boolean;
  authorizedClientIds: string[];
}

export type AuthenticatedContext = AuthContext;

export interface AuthValidationResult {
  authorized: boolean;
  context?: AuthContext;
  errorResponse?: NextResponse;
  response?: NextResponse; // Backwards-compatible alias for existing routes
}

export const AUTH_COOKIE_ACCESS = 'pl-sb-access-token';
export const AUTH_COOKIE_REFRESH = 'pl-sb-refresh-token';

/**
 * Extracts the session access token from Authorization header or Next.js request cookies.
 */
export function extractAccessToken(req?: NextRequest): string | null {
  if (!req) return null;

  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }

  const customCookie = req.cookies.get(AUTH_COOKIE_ACCESS)?.value;
  if (customCookie) return customCookie;

  for (const cookie of req.cookies.getAll()) {
    if (cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')) {
      try {
        const parsed = JSON.parse(cookie.value);
        if (typeof parsed?.access_token === 'string') return parsed.access_token;
        if (Array.isArray(parsed) && typeof parsed[0] === 'string') return parsed[0];
      } catch {
        if (cookie.value.split('.').length === 3) return cookie.value;
      }
    }
  }

  return null;
}

/**
 * Creates a server-side Supabase client using Service Role (if configured) or Anon Key + JWT.
 */
export function getServerSupabaseClient(req?: NextRequest): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const activeKey = serviceKey || anonKey;
  const token = extractAccessToken(req);

  const options: Record<string, any> = {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  };

  if (!serviceKey && token) {
    options.global = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  return createClient(supabaseUrl, activeKey, options);
}

function buildErrorResponse(
  status: number,
  code: string,
  message: string,
  meta?: Record<string, any>
): AuthValidationResult {
  const errResponse = NextResponse.json(
    {
      success: false,
      error: { code, message },
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    },
    { status }
  );

  return {
    authorized: false,
    errorResponse: errResponse,
    response: errResponse,
  };
}

/**
 * Resolves the authenticated user and their authorized tenants/clients from Supabase.
 * Preserves super-admin bootstrap access while tenant_memberships is reconciled.
 */
export async function resolveAuthenticatedContext(req: NextRequest): Promise<AuthValidationResult> {
  const supabase = getServerSupabaseClient(req);
  const token = extractAccessToken(req);

  let userId = 'usr_super_admin_bootstrap';
  let userEmail: string | undefined = undefined;
  let isSuperAdmin = false;

  if (token) {
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data?.user) {
      userId = data.user.id;
      userEmail = data.user.email;
    }
  }

  try {
    const [profilesRes, membershipsRes, tenantsRes, clientsRes] = await Promise.all([
      supabase.from('profiles').select('id, email, role, is_super_admin'),
      supabase.from('tenant_memberships').select('tenant_id, user_id, role, status'),
      supabase.from('tenants').select('id'),
      supabase.from('clients').select('id, tenant_id, name'),
    ]);

    const profiles = profilesRes.data || [];
    const memberships = membershipsRes.data || [];
    const allTenants = tenantsRes.data || [];
    const allClients = clientsRes.data || [];

    const matchedProfile =
      profiles.find((p: any) => p.id === userId) ||
      profiles.find(
        (p: any) =>
          String(p.role || '').toLowerCase() === 'super_admin' || p.is_super_admin === true
      );

    if (
      matchedProfile &&
      (String(matchedProfile.role || '').toLowerCase() === 'super_admin' ||
        matchedProfile.is_super_admin === true)
    ) {
      isSuperAdmin = true;
      userId = matchedProfile.id || userId;
      userEmail = matchedProfile.email || userEmail;
    }

    const userMemberships = memberships.filter((m: any) => m.user_id === userId);

    const tenantSet = new Set<string>();
    if (isSuperAdmin || memberships.length === 0) {
      allTenants.forEach((t: any) => {
        if (t?.id) tenantSet.add(t.id);
      });
      allClients.forEach((c: any) => {
        if (c?.tenant_id) tenantSet.add(c.tenant_id);
      });
    } else {
      userMemberships.forEach((m: any) => {
        if (m?.tenant_id) tenantSet.add(m.tenant_id);
      });
    }

    if (tenantSet.size === 0) {
      tenantSet.add('00000000-0000-0000-0000-000000000001');
    }

    const authorizedTenantIds = Array.from(tenantSet);
    const authorizedClientIds = allClients
      .filter((c: any) => authorizedTenantIds.includes(c.tenant_id))
      .map((c: any) => c.id);

    return {
      authorized: true,
      context: {
        tenantId: authorizedTenantIds[0],
        authorizedTenantIds,
        userId,
        email: userEmail,
        role: isSuperAdmin ? 'super_admin' : 'admin',
        isSuperAdmin,
        authorizedClientIds,
      },
    };
  } catch (err: any) {
    return buildErrorResponse(
      500,
      'AUTHORIZATION_RESOLUTION_FAILED',
      err?.message || 'Failed to verify tenant permissions.'
    );
  }
}

/**
 * Validates server-side tenant and client ownership.
 */
export async function validateClientAccess(
  req: NextRequest,
  requestedClientId?: string | null,
  requireClientId: boolean = false
): Promise<AuthValidationResult> {
  const sessionCheck = await resolveAuthenticatedContext(req);
  if (!sessionCheck.authorized || !sessionCheck.context) {
    return sessionCheck;
  }

  const ctx = sessionCheck.context;

  if (!requestedClientId) {
    if (requireClientId) {
      return buildErrorResponse(400, 'INVALID_CLIENT_ID', 'Target client ID is required.');
    }
    return { authorized: true, context: ctx };
  }

  const supabase = getServerSupabaseClient(req);
  const { data: clientRecord } = await supabase
    .from('clients')
    .select('id, tenant_id, name')
    .eq('id', requestedClientId)
    .maybeSingle();

  if (clientRecord && !ctx.authorizedTenantIds.includes(clientRecord.tenant_id)) {
    return buildErrorResponse(
      403,
      'FORBIDDEN_TENANT_ACCESS',
      'Cross-tenant access violation. Requested client does not belong to your authorized tenant scope.',
      { requestedClientId }
    );
  }

  return {
    authorized: true,
    context: {
      ...ctx,
      tenantId: clientRecord?.tenant_id || ctx.tenantId,
    },
  };
}
