/**
 * CR-001 AUTHENTICATION PROTOTYPE — NOT INTEGRATED WITH APPLICATION ROUTES.
 *
 * Supabase project metadata confirms an Auth user table and a public.profile
 * linked to auth.users. The app does not yet propagate a verified user session.
 *
 * A Supabase access token MUST be issued by Supabase Auth. Do not treat a
 * provider OAuth code, tenant ID, email, client ID, or custom bearer string
 * as equivalent. Resolve tenant permissions in a separate, independently
 * verified server-side database authorization step.
 *
 * IMPORTANT: This module is prepared only on the isolated CR-001 branch.
 * Do not import it into a live route until authentication transport and RLS
 * remediation have both been approved and validated.
 */
import { createClient } from '@supabase/supabase-js';
import type { AuthenticatedPrincipal } from './cr001-authorization-policy';

export type PrincipalVerification =
  | { readonly ok: true; readonly principal: AuthenticatedPrincipal }
  | { readonly ok: false; readonly reason: 'AUTH_REQUIRED' | 'AUTH_INVALID' | 'AUTH_CONFIG_MISSING' };

/**
 * Verify an independently obtained Supabase Auth access token.
 * Calls Supabase Auth getUser(jwt), which performs remote verification.
 *
 * Not authorized to grant tenant/client access by itself. The caller must
 * resolve membership / verified admin role and check the specific resource.
 */
export async function verifySupabaseAccessToken(
  accessToken: unknown,
): Promise<PrincipalVerification> {
  if (typeof accessToken !== 'string' || !accessToken.trim()) {
    return { ok: false, reason: 'AUTH_REQUIRED' };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !publishableKey) {
    return { ok: false, reason: 'AUTH_CONFIG_MISSING' };
  }

  try {
    const supabase = createClient(url, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Supabase Auth authenticates the token; a caller-provided user ID
    // or JWT decoded without verification is NOT sufficient.
    const { data, error } = await supabase.auth.getUser(accessToken);
    const userId = data?.user?.id;

    if (error || !userId) {
      return { ok: false, reason: 'AUTH_INVALID' };
    }

    return { ok: true, principal: { userId } };
  } catch {
    // Do not include token or raw provider error in responses/logs.
    return { ok: false, reason: 'AUTH_INVALID' };
  }
}
