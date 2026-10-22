import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  VerifiedUserContext,
  evaluateTenantAccess,
  evaluateClientAccessPolicy,
} from './auth-policy';

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

export function extractAccessToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }

  const cookies = req.cookies.getAll();
  for (const cookie of cookies) {
    if (cookie.name === AUTH_COOKIE_ACCESS && cookie.value) {
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
        if (cookie.value.split('.').length === 3) {
          return cookie.value;
        }
      }
    }
  }

  return null;
}

export function getServerSupabaseClient(accessToken?: string | null): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (accessToken && url && anonKey) {
    return createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
  }

  const effectiveKey = serviceKey || anonKey;
  return createClient(url, effectiveKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function createScopedServerClient(accessToken: string): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !anonKey) return null;

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
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
      error
