import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface AuthenticatedContext {
  userId: string;
  email?: string;
  role: string;
  tenantId: string;
  authorizedTenantIds: string[];
  accessToken: string;
}

export interface AuthGuardResult {
  authorized: boolean;
  context?: AuthenticatedContext;
  errorResponse?: NextResponse;
}

export function getUserScopedSupabaseClient(accessToken: string): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

export function getServerSupabaseClient(req?: NextRequest): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  }

  // Prefer user-scoped JWT when request cookie/header is present so PostgreSQL RLS is enforced end-to-end
  if (req && anonKey) {
    const cookieToken = req.cookies.get('pl-sb-access-token')?.value;
    const headerAuth = req.headers.get('authorization');
    const bearerToken = headerAuth?.startsWith('Bearer ')
      ? headerAuth.slice(7).trim()
      : cookieToken;

    if (bearerToken) {
      return getUserScopedSupabaseClient(bearerToken);
    }
  }

  if (serviceRoleKey) {
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  if (anonKey) {
    return createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  throw new Error('Missing Supabase API keys');
}

export async function resolveAuthenticatedContext(
  req: NextRequest
): Promise<AuthGuardResult> {
  const cookieToken = req.cookies.get('pl-sb-access-token')?.value;
  const headerAuth = req.headers.get('authorization');
  const accessToken = headerAuth?.startsWith('Bearer ')
    ? headerAuth.slice(7).trim()
    : cookieToken;

  if (!accessToken) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required. Please sign in.',
          },
        },
        { status: 401 }
      ),
    };
  }

  try {
    const userSupabase = getUserScopedSupabaseClient(accessToken);
    const { data: userData, error: userErr } = await userSupabase.auth.getUser(
      accessToken
    );

    if (userErr || !userData?.user) {
      return {
        authorized: false,
        errorResponse: NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_SESSION',
              message: 'Session expired or invalid. Please sign in again.',
            },
          },
          { status: 401 }
        ),
      };
    }

    const userId = userData.user.id;
    const email = userData.user.email || undefined;

    const [profileRes, membershipsRes, allTenantsRes] = await Promise.all([
      userSupabase
        .from('profiles')
        .select('id, role')
        .eq('id', userId)
        .maybeSingle(),
      userSupabase
        .from('tenant_memberships')
        .select('tenant_id, role')
        .eq('user_id', userId),
      userSupabase.from('tenants').select('id'),
    ]);

    const profileRole = String(profileRes.data?.role || '').toLowerCase();
    const isSuperAdmin =
      profileRole === 'super_admin' || profileRole === 'platform_super_admin';

    const membershipTenantIds = Array.from(
      new Set(
        (membershipsRes.data || [])
          .map((m: any) => m.tenant_id)
          .filter(Boolean)
      )
    );

    const allVisibleTenantIds = Array.from(
      new Set((allTenantsRes.data || []).map((t: any) => t.id).filter(Boolean))
    );

    const authorizedTenantIds = isSuperAdmin
      ? Array.from(new Set([...membershipTenantIds, ...allVisibleTenantIds]))
      : membershipTenantIds;

    if (authorizedTenantIds.length === 0) {
      return {
        authorized: false,
        errorResponse: NextResponse.json(
          {
            success: false,
            error: {
              code: 'NO_TENANT_MEMBERSHIP',
              message: 'User has no authorized tenant memberships.',
            },
          },
          { status: 403 }
        ),
      };
    }

    const preferredTenantId = authorizedTenantIds.includes(
      '00000000-0000-0000-0000-000000000001'
    )
      ? '00000000-0000-0000-0000-000000000001'
      : authorizedTenantIds[0];

    const effectiveRole = isSuperAdmin
      ? 'super_admin'
      : membershipsRes.data?.[0]?.role || profileRole || 'member';

    return {
      authorized: true,
      context: {
        userId,
        email,
        role: effectiveRole,
        tenantId: preferredTenantId,
        authorizedTenantIds,
        accessToken,
      },
    };
  } catch (err: any) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTH_RESOLUTION_ERROR',
            message: err?.message || 'Failed to verify authentication context.',
          },
        },
        { status: 500 }
      ),
    };
  }
}

export async function validateClientAccess(
  req: NextRequest,
  clientId: string,
  requireWriteAccess: boolean = false
): Promise<AuthGuardResult> {
  const authCheck = await resolveAuthenticatedContext(req);
  if (!authCheck.authorized || !authCheck.context) {
    return authCheck;
  }

  try {
    const supabase = getUserScopedSupabaseClient(authCheck.context.accessToken);
    const { data: clientRow, error: clientErr } = await supabase
      .from('clients')
      .select('id, tenant_id')
      .eq('id', clientId)
      .maybeSingle();

    if (clientErr || !clientRow) {
      return {
        authorized: false,
        errorResponse: NextResponse.json(
          {
            success: false,
            error: {
              code: 'CLIENT_FORBIDDEN_OR_NOT_FOUND',
              message: 'Client not found or access denied for this tenant.',
            },
          },
          { status: 403 }
        ),
      };
    }

    if (!authCheck.context.authorizedTenantIds.includes(clientRow.tenant_id)) {
      return {
        authorized: false,
        errorResponse: NextResponse.json(
          {
            success: false,
            error: {
              code: 'CROSS_TENANT_DENIED',
              message: 'Cross-tenant client access is strictly forbidden.',
            },
          },
          { status: 403 }
        ),
      };
    }

    return {
      authorized: true,
      context: {
        ...authCheck.context,
        tenantId: clientRow.tenant_id,
      },
    };
  } catch (err: any) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: {
            code: 'CLIENT_ACCESS_CHECK_FAILED',
            message: err?.message || 'Error validating client access.',
          },
        },
        { status: 500 }
      ),
    };
  }
}
