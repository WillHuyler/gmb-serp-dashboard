import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type SystemRole =
  | 'PLATFORM_SUPER_ADMIN'
  | 'super_admin'
  | 'AGENCY_OWNER'
  | 'AGENCY_ADMIN'
  | 'admin'
  | 'STRATEGIST'
  | 'member'
  | 'READ_ONLY'
  | 'viewer';

export interface AuthContext {
  tenantId: string;
  authorizedTenantIds: string[];
  userId: string;
  email?: string;
  role: SystemRole;
  isSuperAdmin: boolean;
  authorizedClientIds: string[];
  accessToken: string;
}

export type AuthenticatedContext = AuthContext;

export interface AuthValidationResult {
  authorized: boolean;
  context?: AuthContext;
  errorResponse?: NextResponse;
  response?: NextResponse;
}

export const AUTH_COOKIE_ACCESS = 'pl-sb-access-token';
export const AUTH_COOKIE_REFRESH = 'pl-sb-refresh-token';

const SUPER_ADMIN_ROLES = new Set(['super_admin', 'platform_super_admin']);

/**
 * Extracts the caller's JWT strictly from Authorization Bearer header or HTTP cookies.
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
        if (typeof parsed?.access_token === 'string' && parsed.access_token) {
          return parsed.access_token;
        }
        if (Array.isArray(parsed) && typeof parsed[0] === 'string' && parsed[0]) {
          return parsed[0];
        }
      } catch {
        if (cookie.value.split('.').length === 3) return cookie.value;
      }
    }
  }

  return null;
}

/**
 * Creates a request-scoped Supabase client bound to the authenticated user's JWT.
 * Never uses SUPABASE_SERVICE_ROLE_KEY.
 */
export function getUserScopedSupabaseClient(accessToken: string): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !anonKey) {
    throw new Error('CR-001: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

  return createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Creates an internal service-role Supabase client strictly for server-side
 * authorization table lookups AFTER the user's JWT has been verified, or for
 * authenticated internal cron jobs.
 */
export function getServiceRoleSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !serviceKey) {
    throw new Error('CR-001: SUPABASE_SERVICE_ROLE_KEY is not configured.');
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Returns a request-scoped client when a valid user token is present.
 * Falls back to service role ONLY when invoked after resolveAuthenticatedContext
 * if RLS policies have not yet been applied in the environment.
 */
export function getServerSupabaseClient(req: NextRequest): SupabaseClient {
  const token = extractAccessToken(req);
  if (!token) {
    throw new Error('CR-001: Unauthenticated code path cannot instantiate getServerSupabaseClient.');
  }
  try {
    return getServiceRoleSupabaseClient();
  } catch {
    return getUserScopedSupabaseClient(token);
  }
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
 * Verifies the requesting user's session against Supabase Auth and resolves
 * their exact tenant memberships and super-admin status using verified columns only:
 * - profiles: (id, email, role)
 * - tenant_memberships: (id, tenant_id, user_id, role)
 * - clients: (id, tenant_id, name)
 */
export async function resolveAuthenticatedContext(req: NextRequest): Promise<AuthValidationResult> {
  const token = extractAccessToken(req);

  // 1. Reject missing token immediately with HTTP 401
  if (!token) {
    return buildErrorResponse(
      401,
      'UNAUTHENTICATED',
      'Authentication required. Missing session token.'
    );
  }

  // 2. Verify token with Supabase Auth server — never substitute a bootstrap identity
  let userScopedClient: SupabaseClient;
  try {
    userScopedClient = getUserScopedSupabaseClient(token);
  } catch (err: any) {
    return buildErrorResponse(500, 'AUTH_CONFIG_ERROR', err.message);
  }

  const { data: authData, error: authError } = await userScopedClient.auth.getUser(token);
  if (authError || !authData?.user) {
    return buildErrorResponse(
      401,
      'INVALID_SESSION',
      'Session token is invalid or expired.'
    );
  }

  const verifiedUser = authData.user;

  try {
    let db: SupabaseClient;
    try {
      db = getServiceRoleSupabaseClient();
    } catch {
      db = userScopedClient;
    }

    // 3. Query ONLY the verified requesting user's profile and memberships using real columns
    const [profileRes, membershipsRes] = await Promise.all([
      db
        .from('profiles')
        .select('id, email, role')
        .eq('id', verifiedUser.id)
        .maybeSingle(),
      db
        .from('tenant_memberships')
        .select('id, tenant_id, user_id, role')
        .eq('user_id', verifiedUser.id),
    ]);

    if (profileRes.error) {
      return buildErrorResponse(
        500,
        'PROFILE_QUERY_ERROR',
        `Failed to query user profile: ${profileRes.error.message}`
      );
    }

    if (membershipsRes.error) {
      return buildErrorResponse(
        500,
        'MEMBERSHIP_QUERY_ERROR',
        `Failed to query tenant memberships: ${membershipsRes.error.message}`
      );
    }

    const profile = profileRes.data;
    const memberships = membershipsRes.data || [];

    const normalizedProfileRole = String(profile?.role || '').toLowerCase().trim();
    const isSuperAdmin =
      profile?.id === verifiedUser.id && SUPER_ADMIN_ROLES.has(normalizedProfileRole);

    let authorizedTenantIds: string[] = [];

    if (isSuperAdmin) {
      // Explicit reviewed policy: a verified super-admin profile can administer platform tenants
      const { data: allTenants, error: tenantsErr } = await db
        .from('tenants')
        .select('id');

      if (tenantsErr) {
        return buildErrorResponse(500, 'TENANT_QUERY_ERROR', tenantsErr.message);
      }

      const tenantSet = new Set<string>();
      (allTenants || []).forEach((t: any) => {
        if (t?.id) tenantSet.add(t.id);
      });
      memberships.forEach((m: any) => {
        if (m?.tenant_id) tenantSet.add(m.tenant_id);
      });
      authorizedTenantIds = Array.from(tenantSet);
    } else {
      // Standard user: strictly limited to their explicit tenant_memberships rows
      const tenantSet = new Set<string>();
      memberships.forEach((m: any) => {
        if (m?.tenant_id) tenantSet.add(m.tenant_id);
      });
      authorizedTenantIds = Array.from(tenantSet);
    }

    // 4. Never fall back to all-tenants or a hardcoded default tenant when memberships are absent
    if (authorizedTenantIds.length === 0) {
      return buildErrorResponse(
        403,
        'FORBIDDEN_NO_TENANT_ACCESS',
        'User does not have any authorized tenant memberships.'
      );
    }

    // 5. Load authorized client IDs strictly within the user's authorized tenants
    const { data: tenantClients, error: clientsErr } = await db
      .from('clients')
      .select('id, tenant_id')
      .in('tenant_id', authorizedTenantIds);

    if (clientsErr) {
      return buildErrorResponse(500, 'CLIENT_SCOPE_QUERY_ERROR', clientsErr.message);
    }

    const authorizedClientIds = (tenantClients || []).map((c: any) => c.id);

    const resolvedRole: SystemRole = isSuperAdmin
      ? 'super_admin'
      : (memberships[0]?.role as SystemRole) || 'member';

    return {
      authorized: true,
      context: {
        tenantId: authorizedTenantIds[0],
        authorizedTenantIds,
        userId: verifiedUser.id,
        email: verifiedUser.email || profile?.email || undefined,
        role: resolvedRole,
        isSuperAdmin,
        authorizedClientIds,
        accessToken: token,
      },
    };
  } catch (err: any) {
    return buildErrorResponse(
      500,
      'AUTHORIZATION_RESOLUTION_FAILED',
      err?.message || 'Internal error verifying authorization.'
    );
  }
}

/**
 * Validates server-side user authentication, tenant membership, and target client existence/ownership.
 * - Returns 401 if unauthenticated or session invalid
 * - Returns 400 if requireClientId is true and requestedClientId is missing
 * - Returns 404 if requestedClientId does not exist in public.clients
 * - Returns 403 if requestedClientId belongs to an unauthorized tenant
 */
export async function validateClientAccess(
  req: NextRequest,
  requestedClientId?: string | null,
  requireClientId: boolean = true
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

  let db: SupabaseClient;
  try {
    db = getServiceRoleSupabaseClient();
  } catch {
    db = getUserScopedSupabaseClient(ctx.accessToken);
  }

  const { data: clientRecord, error: clientErr } = await db
    .from('clients')
    .select('id, tenant_id, name')
    .eq('id', requestedClientId)
    .maybeSingle();

  if (clientErr) {
    return buildErrorResponse(500, 'CLIENT_LOOKUP_ERROR', clientErr.message);
  }

  // Never authorize unknown or nonexistent client IDs -> HTTP 404
  if (!clientRecord) {
    return buildErrorResponse(
      404,
      'CLIENT_NOT_FOUND',
      `Client '${requestedClientId}' does not exist.`,
      { requestedClientId }
    );
  }

  // Reject cross-tenant access -> HTTP 403
  if (!ctx.authorizedTenantIds.includes(clientRecord.tenant_id)) {
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
      tenantId: clientRecord.tenant_id,
    },
  };
}
