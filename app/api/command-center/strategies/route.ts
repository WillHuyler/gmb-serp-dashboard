import { NextRequest, NextResponse } from 'next/server';
import { validateClientAccess } from '../../../../lib/auth-guard';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const clientId = body?.clientId || req.nextUrl.searchParams.get('clientId') || undefined;

    const authCheck = await validateClientAccess(req, clientId);
    if (!authCheck.authorized) {
      return authCheck.errorResponse || authCheck.response || NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { context } = authCheck;

    return NextResponse.json({
      success: true,
      tenantId: context?.tenantId,
      clientId,
      strategies: [
        {
          id: 'strat_01',
          type: 'SERP_ACCELERATION',
          title: 'Local Map Pack Geo-Grid Expansion',
          impact: '+18% Top-3 Visibility',
        },
      ],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'STRATEGY_GENERATION_FAILED', message: err.message },
      { status: 500 }
    );
  }
}
