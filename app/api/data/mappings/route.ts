import { NextRequest, NextResponse } from 'next/server';
import { validateClientAccess, getServerSupabaseClient } from '../../../../lib/auth-guard';

export const dynamic = 'force-dynamic';

const ALLOWED_MAPPING_ROLES = new Set([
  'PRIMARY_MARKETING',
  'SECONDARY_MARKETING',
  'RECRUITING',
  'BRAND',
  'CORPORATE',
  'LOCATION',
  'EXCLUDED',
]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('clientId');

  const authCheck = await validateClientAccess(req, clientId, true);
  if (!authCheck.authorized || !authCheck.context) {
    return authCheck.errorResponse!;
  }

  try {
    const supabase = getServerSupabaseClient(req);
    const { data: mappings, error } = await supabase
      .from('account_mappings')
      .select('id, tenant_id, client_id, external_account_id, mapping_role, mapping_confidence, is_confirmed, include_in_command_center, created_at')
      .eq('client_id', clientId!)
      .eq('tenant_id', authCheck.context.tenantId);

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'MAPPINGS_QUERY_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      mappings: mappings || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'MAPPINGS_GET_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      client_id,
      external_account_id,
      mapping_role = 'PRIMARY_MARKETING',
      include_in_command_center = true,
    } = body || {};

    if (!client_id || !external_account_id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_PARAMETERS',
            message: 'Both client_id and external_account_id (UUID from external_accounts) are required.',
          },
        },
        { status: 400 }
      );
    }

    // 1. Verify caller session, client existence (404), and tenant ownership (403)
    const authCheck = await validateClientAccess(req, client_id, true);
    if (!authCheck.authorized || !authCheck.context) {
      return authCheck.errorResponse!;
    }

    const verifiedTenantId = authCheck.context.tenantId;
    const supabase = getServerSupabaseClient(req);

    // 2. Resolve external_account_id in public.external_accounts (by UUID id or provider external_account_id string)
    let { data: externalAccount, error: extErr } = await supabase
      .from('external_accounts')
      .select('id, connection_id, provider, external_account_id, descriptive_name, status')
      .eq('id', external_account_id)
      .maybeSingle();

    if (!externalAccount && !extErr) {
      const fallbackLookup = await supabase
        .from('external_accounts')
        .select('id, connection_id, provider, external_account_id, descriptive_name, status')
        .eq('external_account_id', external_account_id)
        .maybeSingle();
      externalAccount = fallbackLookup.data;
    }

    if (!externalAccount) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EXTERNAL_ACCOUNT_NOT_FOUND',
            message: `Discovered external account '${external_account_id}' does not exist in external_accounts.`,
          },
        },
        { status: 404 }
      );
    }

    // 3. Verify that the parent provider_connection belongs to the same tenant
    if (externalAccount.connection_id) {
      const { data: connRow } = await supabase
        .from('provider_connections')
        .select('id, tenant_id')
        .eq('id', externalAccount.connection_id)
        .maybeSingle();

      if (connRow && connRow.tenant_id !== verifiedTenantId) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CROSS_TENANT_RESOURCE_VIOLATION',
              message: 'Cannot map an external provider account belonging to another tenant.',
            },
          },
          { status: 403 }
        );
      }
    }

    const validatedRole = ALLOWED_MAPPING_ROLES.has(mapping_role)
      ? mapping_role
      : 'PRIMARY_MARKETING';

    // 4. Insert strictly using verified public.account_mappings columns
    const insertPayload = {
      tenant_id: verifiedTenantId,
      client_id,
      external_account_id: externalAccount.id,
      mapping_role: validatedRole,
      mapping_confidence: 100.0,
      is_confirmed: true,
      include_in_command_center: Boolean(include_in_command_center),
    };

    const { data: mapping, error: insertError } = await supabase
      .from('account_mappings')
      .upsert([insertPayload], { onConflict: 'client_id,external_account_id' })
      .select('id, tenant_id, client_id, external_account_id, mapping_role, mapping_confidence, is_confirmed, include_in_command_center, created_at')
      .single();

    if (insertError || !mapping) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'MAPPING_INSERT_FAILED', message: insertError?.message || 'Failed to persist mapping.' },
        },
        { status: 500 }
      );
    }

    // CR-003 INVARIANT: Do NOT mark public.clients.is_certified = true here.
    // Certification requires verified provider ingestion and validated telemetry records.
    return NextResponse.json(
      {
        success: true,
        mapping: {
          ...mapping,
          external_account: externalAccount,
        },
        certificationStatus: 'MAPPED_PENDING_INGESTION',
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'MAPPING_POST_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}
