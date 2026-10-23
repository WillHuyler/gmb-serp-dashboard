import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const ACCESS_COOKIE = 'pl-sb-access-token';
const REFRESH_COOKIE = 'pl-sb-refresh-token';

function createAnonSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function clearAuthCookies(res: NextResponse) {
  res.cookies.set(ACCESS_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  res.cookies.set(REFRESH_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

function setAuthCookies(
  res: NextResponse,
  accessToken: string,
  refreshToken?: string | null
) {
  res.cookies.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  });

  if (refreshToken) {
    res.cookies.set(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 14, // 14 days
    });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createAnonSupabase();
    const accessToken = req.cookies.get(ACCESS_COOKIE)?.value;
    const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;

    if (accessToken) {
      const { data: userData, error: userErr } = await supabase.auth.getUser(accessToken);
      if (!userErr && userData?.user) {
        return NextResponse.json({
          authenticated: true,
          refreshed: false,
          user: {
            id: userData.user.id,
            email: userData.user.email || 'Authenticated User',
          },
        });
      }
    }

    // Access token missing or expired -> attempt refresh if refresh token exists
    if (refreshToken) {
      const { data: refreshData, error: refreshErr } =
        await supabase.auth.refreshSession({ refresh_token: refreshToken });

      if (!refreshErr && refreshData?.session?.access_token && refreshData.user) {
        const res = NextResponse.json({
          authenticated: true,
          refreshed: true,
          user: {
            id: refreshData.user.id,
            email: refreshData.user.email || 'Authenticated User',
          },
        });
        setAuthCookies(
          res,
          refreshData.session.access_token,
          refreshData.session.refresh_token
        );
        return res;
      }
    }

    // Both access and refresh tokens are missing or invalid -> clean logout
    const unauthRes = NextResponse.json(
      {
        authenticated: false,
        error: {
          code: 'SESSION_EXPIRED_OR_MISSING',
          message: 'Authentication required. Please sign in.',
        },
      },
      { status: 401 }
    );
    clearAuthCookies(unauthRes);
    return unauthRes;
  } catch (err: any) {
    return NextResponse.json(
      {
        authenticated: false,
        error: { code: 'SESSION_CHECK_FAILED', message: err?.message || 'Session error.' },
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { access_token, refresh_token } = body || {};

    if (!access_token || typeof access_token !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'MISSING_TOKEN', message: 'access_token is required.' },
        },
        { status: 400 }
      );
    }

    const supabase = createAnonSupabase();
    const { data: userData, error: userErr } = await supabase.auth.getUser(access_token);

    if (userErr || !userData?.user) {
      const invalidRes = NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ACCESS_TOKEN',
            message: 'Provided access token could not be verified by Supabase Auth.',
          },
        },
        { status: 401 }
      );
      clearAuthCookies(invalidRes);
      return invalidRes;
    }

    const res = NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: userData.user.id,
        email: userData.user.email || 'Authenticated User',
      },
    });
    setAuthCookies(res, access_token, refresh_token);
    return res;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'SESSION_ESTABLISH_FAILED', message: err?.message } },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true, authenticated: false });
  clearAuthCookies(res);
  return res;
}
