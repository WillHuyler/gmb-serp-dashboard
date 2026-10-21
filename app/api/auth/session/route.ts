import { NextRequest, NextResponse } from 'next/server';
import {
  AUTH_COOKIE_ACCESS,
  AUTH_COOKIE_REFRESH,
  resolveAuthenticatedContext,
  getServerSupabaseClient,
} from '../../../../lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authCheck = await resolveAuthenticatedContext(req);
  if (!authCheck.authorized || !authCheck.context) {
    return authCheck.errorResponse!;
  }

  return NextResponse.json({
    success: true,
    user: {
      id: authCheck.context.userId,
      email: authCheck.context.email,
      role: authCheck.context.role,
      isSuperAdmin: authCheck.context.isSuperAdmin,
    },
    tenantId: authCheck.context.tenantId,
    authorizedTenantIds: authCheck.context.authorizedTenantIds,
    authorizedClientCount: authCheck.context.authorizedClientIds.length,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { accessToken, refreshToken } = body || {};

    if (!accessToken || typeof accessToken !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_TOKEN', message: 'Access token is required.' } },
        { status: 400 }
      );
    }

    const supabase = getServerSupabaseClient(req);
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: error?.message || 'Invalid session token.' } },
        { status: 401 }
      );
    }

    const res = NextResponse.json({
      success: true,
      user: { id: data.user.id, email: data.user.email },
    });

    const isProd = process.env.NODE_ENV === 'production';

    res.cookies.set(AUTH_COOKIE_ACCESS, accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60,
    });

    if (refreshToken && typeof refreshToken === 'string') {
      res.cookies.set(AUTH_COOKIE_REFRESH, refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 14,
      });
    }

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'SESSION_SYNC_ERROR', message: 'Failed to establish session.' } },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(AUTH_COOKIE_ACCESS);
  res.cookies.delete(AUTH_COOKIE_REFRESH);
  return res;
}
