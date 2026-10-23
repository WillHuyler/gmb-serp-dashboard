import { NextRequest, NextResponse } from 'next/server';
import { validateClientAccess, getServerSupabaseClient } from '../../../../lib/auth-guard';
import {
  normalizeVerifiedClientRecord,
  JoinedAccountMapping,
  RawIntegrationAccountRow,
} from '../../../../lib/client-row-normalizer';

export const dynamic = 'force-dynamic';

const VERIFIED_CLIENT_COLUMNS =
  'id, name, store_code, address, created_at, organization_id, tenant_id, data_certification_status, domain, is_certified';

async function loadJoinedRelations(
  supabase: any,
  tenantId: string,
  clientId: string
): Promise<{
  joinedMappings: JoinedAccountMapping[];
  integrationAccounts: RawIntegrationAccountRow[];
  hasTelemetry: boolean;
}> {
  const [mapRes, intAccRes, metricsRes] = await Promise.all([
    supabase
      .from('account_mappings')
      .select('id, tenant_id, client_id, external_account_id, mapping_role, mapping_confidence, is_confirmed, include_in_command_center, created_at')
      .eq('client_id', clientId)
      .eq('tenant_id', tenantId),
    supabase
      .from('integration_accounts')
      .select('id, tenant_id, client_id, provider, provider_account_id, auth_status, last_sync_at, last_success_sync_at, sync_error_message, created_at')
      .eq('client_id', clientId)
      .eq('tenant_id', tenantId),
    supabase
      .from('daily_client_metrics')
      .select('client_id')
      .eq('client_id', clientId)
      .limit(1),
  ]);

  const rawMappings = mapRes.data || [];
  const extIds = rawMappings.map((m: any) => m.external_account_id).filter(Boolean);

  const externalMap = new Map<string, any>();
  if (extIds.length > 0) {
    const { data: extRows } = await supabase
      .from('external_accounts')
      .select('id, connection_id, provider, external_account_id, descriptive_name, account_type, status, tenant_id')
      .in('id', extIds);
    (extRows || []).forEach((e: any) => externalMap.set(e.id, e));
  }

  const joinedMappings: JoinedAccountMapping[] = rawMappings.map((m: any) => ({
    ...m,
    external_account: externalMap.get(m.external_account_id) || null,
  }));

  return {
    joinedMappings,
    integrationAccounts: (intAccRes.data || []) as RawIntegrationAccountRow[],
    hasTelemetry: (metricsRes.data || []).length > 0,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const clientId = params.id;
  const authCheck = await validateClientAccess(req, clientId, true);
  if (!authCheck.authorized || !authCheck.context) {
    return authCheck.errorResponse!;
  }

  try {
    const supabase = getServerSupabaseClient(req);
    const { data: clientRow, error: clientErr } = await supabase
      .from('clients')
      .select(VERIFIED_CLIENT_COLUMNS)
      .eq('id', clientId)
      .eq('tenant_id', authCheck.context.tenantId)
      .single();

    if (clientErr || !clientRow) {
      return NextResponse.json(
        { success: false, error: { code: 'CLIENT_NOT_FOUND', message: 'Client record not found.' } },
        { status: 404 }
      );
    }

    const { joinedMappings, integrationAccounts, hasTelemetry } = await loadJoinedRelations(
      supabase,
      authCheck.context.tenantId,
      clientId
    );

    return NextResponse.json({
      success: true,
      client: normalizeVerifiedClientRecord(
        clientRow,
        joinedMappings,
        integrationAccounts,
        hasTelemetry
      ),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'CLIENT_FETCH_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const clientId = params.id;
  const authCheck = await validateClientAccess(req, clientId, true);
  if (!authCheck.authorized || !authCheck.context) {
    return authCheck.errorResponse!;
  }

  try {
    const body = await req.json();
    const { name, address, domain, store_code, organization_id } = body || {};

    const updatePayload: Record<string, any> = {};

    if (typeof name === 'string') {
      if (name.trim().length < 2) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_NAME', message: 'Client name must be at least 2 characters.' } },
          { status: 400 }
        );
      }
      updatePayload.name = name.trim();
    }

    if (address !== undefined) {
      updatePayload.address = typeof address === 'string' && address.trim() !== '' ? address.trim() : null;
    }

    if (domain !== undefined) {
      updatePayload.domain = typeof domain === 'string' && domain.trim() !== '' ? domain.trim() : null;
    }

    if (store_code !== undefined) {
      updatePayload.store_code = typeof store_code === 'string' && store_code.trim() !== '' ? store_code.trim() : null;
    }

    if (organization_id !== undefined) {
      updatePayload.organization_id = typeof organization_id === 'string' && organization_id.trim() !== '' ? organization_id.trim() : null;
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EMPTY_UPDATE',
            message: 'No valid public.clients schema fields provided (name, address, domain, store_code, organization_id).',
          },
        },
        { status: 400 }
      );
    }

    const supabase = getServerSupabaseClient(req);
    const { data: updated, error: updateErr } = await supabase
      .from('clients')
      .update(updatePayload)
      .eq('id', clientId)
      .eq('tenant_id', authCheck.context.tenantId)
      .select(VERIFIED_CLIENT_COLUMNS)
      .single();

    if (updateErr || !updated) {
      return NextResponse.json(
        { success: false, error: { code: 'CLIENT_UPDATE_FAILED', message: updateErr?.message || 'Update failed.' } },
        { status: 500 }
      );
    }

    const { joinedMappings, integrationAccounts, hasTelemetry } = await loadJoinedRelations(
      supabase,
      authCheck.context.tenantId,
      clientId
    );

    return NextResponse.json({
      success: true,
      client: normalizeVerifiedClientRecord(
        updated,
        joinedMappings,
        integrationAccounts,
        hasTelemetry
      ),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'CLIENT_PATCH_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}
