import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateClientAccess } from '../../../../lib/auth-guard';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('clientId');

  // Enforce server-side tenant & client authorization
  const authCheck = await validateClientAccess(req, clientId || undefined);
  if (!authCheck.authorized) {
    return authCheck.errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  if (!clientId) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'MISSING_CLIENT_ID', message: 'clientId query parameter is required.' },
      },
      { status: 400 }
    );
  }

  try {
    // Query client-scoped AI recommendations from the signals ledger
    const { data: signals, error } = await supabase
      .from('signals')
      .select('*')
      .eq('client_id', clientId)
      .eq('tenant_id', authCheck.context?.tenantId || '00000000-0000-0000-0000-000000000001')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      clientId,
      recommendations: signals || [],
      meta: {
        timestamp: new Date().toISOString(),
        provenance: 'SUPABASE_SIGNALS_LEDGER',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RECOMMENDATIONS_FETCH_FAILED',
          message: err.message || 'Failed to retrieve recommendations.',
        },
      },
      { status: 500 }
    );
  }
}
}
