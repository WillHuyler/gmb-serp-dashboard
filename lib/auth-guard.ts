import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface AuthenticatedContext {
  userId: string;
  email?: string;
  role: string;
  tenantId: string;
  authorizedTenantIds: string[];
  accessToken: string;
  [key: string]: any;
}

export interface AuthGuardResult {
  authorized: boolean;
  context?: AuthenticatedContext;
  supabase?: SupabaseClient;
  errorResponse?: NextResponse;
  response?: NextResponse;
  [key: string]: any;
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

/**
 * User-facing server Supabase client NEVER falls back to SUPABASE_SERVICE_ROLE_KEY.
 * Evaluates against the user's JWT so PostgreSQL RLS is enforced.
 */
export function getServerSupabaseClient(req?: NextRequest): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  if (req) {
    const cookieToken = req.cookies.get('pl-sb-access-token')?.value;
    const headerAuth = req.headers.get('authorization');
    const bearerToken = headerAuth?.startsWith('Bearer ')
      ? headerAuth.slice(7).trim()
      : cookieToken;

    if (bearerToken) {
      return getUserScopedSupabaseClient(bearerToken);
    }
  }

  return createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Dedicated Service-Role client restricted strictly to verified background cron jobs.
 * Requires a matching CRON_SECRET header.
 */
export function getAuthorizedCronServiceClient(req: NextRequest): {
  authorized: boolean;
  supabase?: SupabaseClient;
  errorResponse?: NextResponse;
} {
  const cronSecret = process.env.CRON_SECRET;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const authHeader = req.headers.get('authorization');
  const providedSecret = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : req.headers.get('x-cron-secret');

  if (!cronSecret || !providedSecret || providedSecret !== cronSecret) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED_CRON_INVOCATION',
            message: 'Valid CRON_SECRET authorization is required for background ETL execution.',
          },
        },
        { status: 401 }
      ),
    };
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        {
          success: false,
