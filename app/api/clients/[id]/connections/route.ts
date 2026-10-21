import { NextRequest, NextResponse } from 'next/server';
import { validateClientAccess } from '../../../../../lib/auth-guard';
import {
  createServiceRoleSupabaseClient,
  createUserScopedSupabaseClient,
  extractAccessToken,
} from '../../../../../lib/supabase/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const clientId = params.id;
  const authCheck = await validateClientAccess(req, clientId);
  if (!authCheck.authorized || !authCheck.context) {
    return authCheck.errorResponse!;
  }

  try {
    let supabase;
    try {
      supabase = createServiceRoleSupabaseClient();
    } catch {
      supabase = createUserScopedSupabaseClient(extractAccessToken(req)!);
    }

    const [clientRes, mappingsRes, integrationAccountsRes] = await Promise.all([
      supabase
        .from('clients')
        .select('id, tenant_id, name, is_certified, mappings')
        .eq('id', clientId)
        .eq('tenant_id', authCheck.context.tenantId)
        .single(),
      supabase
        .from('account_mappings')
        .select('*')
        .eq('client_id', clientId),
      supabase
        .from('integration_accounts')
        .select('*')
        .eq('client_id', clientId),
    ]);

    if (clientRes.error || !clientRes.data) {
      return NextResponse.json(
        { success: false, error: { code: 'CLIENT_NOT_FOUND', message: 'Client not found.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      clientId,
      tenantId: authCheck.context.tenantId,
      isCertified: Boolean(clientRes.data.is_certified && (mappingsRes.data?.length || 0) > 0),
      accountMappings: mappingsRes.data || [],
      integrationAccounts: integrationAccountsRes.data || [],
      legacyMappingsField: clientRes.data.mappings || {},
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'CONNECTIONS_FETCH_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}
