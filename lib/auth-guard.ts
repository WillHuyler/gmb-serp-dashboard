import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  VerifiedUserContext,
  evaluateTenantAccess,
  evaluateClientAccessPolicy,
} from './auth-policy';

export interface AuthSessionContext {
  userId: string;
  email?: string | null;
  tenantId: string;
  authorizedTenantIds: string[];
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

function extractAccessToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }

  // Inspect standard Supabase Auth cookies (sb-*-auth-token or sb-access-token)
  const cookies = req.cookies.getAll();
  for (const cookie of cookies) {
    if (cookie.name === 'sb-access-token' && cookie.value) {
      return cookie.value;
    }
    if (cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token') && cookie.value) {
      try {
        const parsed = JSON.parse(cookie.value);
        if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
          return parsed[0];
        }
        if (parsed && typeof parsed.access_token === 'string') {
          return parsed.access_token;
        }
      } catch {
        // If raw JWT string in cookie
        if (cookie.value.split('.').length === 3) {
          return cookie.value;
        }
      }
    }
  }

  return null;
}

function createScopedServerClient(accessToken: string): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !anonKey) return null;

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

function createInternalMetadataVerifier(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Resolves and verifies the caller's Supabase Auth session before any database query is allowed.
 * Never falls back to service-role data when no valid user token is present.
 */
export async function requireAuthenticatedSession(
  req: NextRequest,
  requestedTenantId?: string | null
): Promise<AuthValidationResult> {
  const token = extractAccessToken(req);
  if (!token) {
    const err = NextResponse.json(
      {
        success: false,
        error: 'UNAUTHENTICATED',
        message: 'Authentication required. No valid session token provided.',
      },
      { status: 401 }
    );
    return { authorized: false, status: 401, errorResponse: err, response: err };
  }

  const userScopedClient = createScopedServerClient(token);
  const metadataClient = createInternalMetadataVerifier();

  if (!userScopedClient || !metadataClient) {
    const err = NextResponse.json(
      {
        success: false,
        error: 'AUTH_INFRASTRUCTURE_UNAVAILABLE',
        message: 'Supabase authentication environment is not configured.',
      },
      { status: 503 }
    );
    return { authorized: false, status: 503, errorResponse: err, response: err };
  }

  const {
    data: { user },
    error: authError,
  } = await userScopedClient.auth.getUser(token);

  if (authError || !user) {
    const err = NextResponse.json(
      {
        success: false,
        error: 'INVALID_OR_EXPIRED_SESSION',
        message: 'Session token is invalid or expired.',
      },
      { status: 401 }
    );
    return { authorized: false, status: 401, errorResponse: err, response: err };
  }

  // Verify tenant memberships and profile super-admin role from server-side tables
  const [{ data: profileRow }, { data: membershipRows }] = await Promise.all([
    metadataClient
      .from('profiles')
      .select('id, role, is_super_admin')
      .eq('id', user.id)
      .maybeSingle(),
    metadataClient
      .from('tenant_memberships')
      .select('tenant_id, role')
      .eq('user_id', user.id),
  ]);

  const isSuperAdmin = Boolean(
    profileRow?.is_super_admin === true ||
      profileRow?.role === 'super_admin' ||
      profileRow?.role === 'PLATFORM_SUPER_ADMIN'
  );

  let authorizedTenantIds: string[] = Array.from(
    new Set(
      (membershipRows || [])
        .map((m: { tenant_id?: string }) => m.tenant_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  // Controlled bootstrap path for verified super_admin profile when tenant_memberships is empty
  if (isSuperAdmin && authorizedTenantIds.length === 0) {
    const { data: allTenants } = await metadataClient
      .from('tenants')
      .select('id');
    authorizedTenantIds = (allTenants || []).map((t: { id: string }) => t.id);
  }

  const verifiedUser: VerifiedUserContext = {
    userId: user.id,
    email: user.email,
    isSuperAdmin,
    authorizedTenantIds,
  };

  const decision = evaluateTenantAccess(verifiedUser, requestedTenantId);
  if (!decision.allowed) {
    const err = NextResponse.json(
      {
        success: false,
        error: decision.code,
        message: decision.message,
      },
      { status: decision.status }
    );
    return {
      authorized: false,
      status: decision.status,
      errorResponse: err,
      response: err,
    };
  }

  return {
    authorized: true,
    status: 200,
    context: {
      userId: user.id,
      email: user.email,
      tenantId: decision.effectiveTenantId,
      authorizedTenantIds,
      isSuperAdmin,
    },
    supabase: metadataClient,
  };
}

/**
 * Validates that the caller is authenticated AND authorized to access the specific clientId.
 */
export async function validateClientAccess(
  req: NextRequest,
  clientId?: string | null,
  requestedTenantId?: string | null
): Promise<AuthValidationResult> {
  const sessionCheck = await requireAuthenticatedSession(req, requestedTenantId);
  if (!sessionCheck.authorized || !sessionCheck.context || !sessionCheck.supabase) {
    return sessionCheck;
  }

  if (!clientId) {
    const err = NextResponse.json(
      {
        success: false,
        error: 'MISSING_CLIENT_ID',
        message: 'A target clientId is required.',
      },
      { status: 400 }
    );
    return { authorized: false, status: 400, errorResponse: err, response: err };
  }

  const { data: clientRow, error: clientErr } = await sessionCheck.supabase
    .from('clients')
    .select('id, tenant_id')
    .eq('id', clientId)
    .maybeSingle();

  if (clientErr) {
    const err = NextResponse.json(
      {
        success: false,
        error: 'CLIENT_LOOKUP_FAILED',
        message: 'Failed to verify client ownership.',
      },
      { status: 500 }
    );
    return { authorized: false, status: 500, errorResponse: err, response: err };
  }

  const decision = evaluateClientAccessPolicy(
    {
      userId: sessionCheck.context.userId,
      email: sessionCheck.context.email,
      isSuperAdmin: sessionCheck.context.isSuperAdmin,
      authorizedTenantIds: sessionCheck.context.authorizedTenantIds,
    },
    clientRow,
    requestedTenantId
  );

  if (!decision.allowed) {
    const err = NextResponse.json(
      {
        success: false,
        error: decision.code,
        message: decision.message,
      },
      { status: decision.status }
    );
    return {
      authorized: false,
      status: decision.status,
      errorResponse: err,
      response: err,
    };
  }

  return {
    authorized: true,
    status: 200,
    context: {
      ...sessionCheck.context,
      tenantId: decision.effectiveTenantId,
    },
    supabase: sessionCheck.supabase,
  };
}
