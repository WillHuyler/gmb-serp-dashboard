// Diff for lib/auth-guard.ts
export function getUserScopedSupabaseClient(accessToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables.');
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

export function getServerSupabaseClient(req?: NextRequest) {
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
