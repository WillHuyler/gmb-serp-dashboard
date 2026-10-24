import { NextRequest, NextResponse } from 'next/server';
import { resolveAuthenticatedContext } from '../../../lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const hasAuthAttempt =
    Boolean(req.cookies.get('pl-sb-access-token')?.value) ||
    Boolean(req.headers.get('authorization'));

  if (!hasAuthAttempt) {
    // Public liveness probe: zero internal client counts or provider metadata disclosed
    return NextResponse.json({
      status: 'ok',
      authenticated: false,
      timestamp: new Date().toISOString(),
    });
  }

  const authCheck = await resolveAuthenticatedContext(req);
  if (!authCheck.authorized || !authCheck.context || !authCheck.supabase) {
    return NextResponse.json(
      {
        status: 'ok',
        authenticated: false,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }

  const { supabase, context } = authCheck;
  const { count: authorizedClientCount } = await supabase
    .from('clients')
    .select('id', { count: 'exact', head: true })
    .in('tenant_id', context.authorizedTenantIds);

  return NextResponse.json({
    status: 'ok',
    authenticated: true,
    role: context.role,
    authorizedTenantCount: context.authorizedTenantIds.length,
    authorizedClientCount: authorizedClientCount ?? 0,
    timestamp: new Date().toISOString(),
  });
}
