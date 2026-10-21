import { NextRequest, NextResponse } from 'next/server';
import { validateClientAccess, getServerSupabaseClient } from '../../../../../lib/auth-guard';
import { normalizeVerifiedClientRecord } from '../../../../../lib/client-row-normalizer';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const clientId = params.id;
  const authCheck = await validateClientAccess(req, clientId, true);
  if (!authCheck.authorized || !authCheck.context) {
    return authCheck.errorResponse!;
  }

  const tenantId = authCheck.context.tenantId;

  try {
    const supabase = getServerSupabaseClient(req);

    const [clientRes, mappingsRes, integrationAccountsRes, metricsRes] = await Promise.all([
      supabase
        .from('clients')
        .select('id, tenant_id, name, domain, timezone, currency, is_certified, created_at')
        .eq('id', clientId)
        .eq('tenant_id', tenantId)
        .single(),
      supabase
        .from('account_mappings')
        .select('id, tenant_id, client_id, external_account_id, mapping_role, mapping_confidence, is_confirmed, include_in_command_center, created_at')
        .eq('client_id', clientId)
        .eq('tenant_id', tenantId),
      supabase
        .from('integration_accounts')
        .select('*')
        .eq('client_id', clientId),
      supabase
        .from('daily_client_metrics')
        .select('client_id')
        .eq('client_id', clientId)
        .eq('tenant_id', tenantId)
        .limit(1),
    ]);

    if (clientRes.error || !clientRes.data) {
      return NextResponse.json(
        { success: false, error: { code: 'CLIENT_NOT_FOUND', message: 'Client not found.' } },
        { status: 404 }
      );
    }

    const rawMappings = mappingsRes.data || [];
    const extIds = rawMappings.map((m: any) => m.external_account_id).filter(Boolean);

    const externalMap = new Map<string, any>();
    if (extIds.length > 0) {
      const { data: extRows } = await supabase
        .from('external_accounts')
        .select('id, connection_id, provider, external_account_id, descriptive_name, account_type, status, currency, timezone, discovered_at')
        .in('id', extIds);
      (extRows || []).forEach((e: any) => externalMap.set(e.id, e));
    }

    const joinedMappings = rawMappings.map((m: any) => ({
      ...m,
      external_account: externalMap.get(m.external_account_id) || null,
    }));

    const hasVerifiedTelemetry = (metricsRes.data || []).length > 0;
    const normalizedClient = normalizeVerifiedClientRecord(
      clientRes.data,
      joinedMappings,
      hasVerifiedTelemetry
    );

    return NextResponse.json({
      success: true,
      clientId,
      tenantId,
      isCertified: normalizedClient.is_certified,
      hasVerifiedTelemetry,
      accountMappings: joinedMappings,
      integrationAccounts: integrationAccountsRes.data || [],
      resolvedMappings: normalizedClient.mappings,
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
