import { NextRequest, NextResponse } from 'next/server';
import {
  resolveAuthenticatedContext,
  getUserScopedSupabaseClient,
  getServerSupabaseClient,
} from '../../../lib/auth-guard';
import {
  normalizeVerifiedClientRecord,
  JoinedAccountMapping,
  RawIntegrationAccountRow,
} from '../../../lib/client-row-normalizer';
import { ClientProfile } from '../../../lib/client-context';

export const dynamic = 'force-dynamic';

const VERIFIED_CLIENT_COLUMNS =
  'id, name, store_code, address, created_at, organization_id, tenant_id, data_certification_status, domain, is_certified';

export async function GET(req: NextRequest) {
  const authCheck = await resolveAuthenticatedContext(req);
  if (!authCheck.authorized || !authCheck.context) {
    return authCheck.errorResponse!;
  }

  const { authorizedTenantIds, accessToken, userId, email, role } = authCheck.context;
  const warnings: string[] = [];

  try {
    // Prefer user-scoped RLS client; fall back to server client if configured
    let supabase = getUserScopedSupabaseClient(accessToken);
    try {
      supabase = getServerSupabaseClient(req);
    } catch {
      // User-scoped JWT client is active and passes strict_tenant_clients_policy via RLS
    }

    // 1. Primary Authoritative Query: public.clients (MUST succeed independently)
    const { data: clientRows, error: clientErr } = await supabase
      .from('clients')
      .select(VERIFIED_CLIENT_COLUMNS)
      .in('tenant_id', authorizedTenantIds)
      .order('name', { ascending: true });

    if (clientErr) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CLIENT_REGISTRY_QUERY_FAILED',
            message: `Database error loading clients: ${clientErr.message}`,
          },
        },
        { status: 500 }
      );
    }

    const safeClientRows = clientRows || [];
    const clientIds = safeClientRows.map((c: any) => c.id);

    let joinedMappings: JoinedAccountMapping[] = [];
    let integrationAccounts: RawIntegrationAccountRow[] = [];
    const clientsWithMetrics = new Set<string>();

    // 2. Supplementary Queries: Isolated in fault-tolerant blocks so they NEVER break client loading
    if (clientIds.length > 0) {
      const [mapSettled, extSettled, intSettled, metricsSettled] = await Promise.allSettled([
        supabase
          .from('account_mappings')
          .select(
            'id, tenant_id, client_id, external_account_id, mapping_role, mapping_confidence, is_confirmed, include_in_command_center, created_at'
          )
          .in('client_id', clientIds),
        supabase
          .from('external_accounts')
          .select(
            'id, connection_id, provider, external_account_id, descriptive_name, account_type, status, tenant_id'
          )
          .in('tenant_id', authorizedTenantIds),
        supabase
          .from('integration_accounts')
          .select(
            'id, tenant_id, client_id, provider, provider_account_id, auth_status, last_sync_at, last_success_sync_at, sync_error_message, created_at'
          )
          .in('client_id', clientIds),
        supabase
          .from('daily_client_metrics')
          .select('client_id')
          .in('client_id', clientIds)
          .limit(300),
      ]);

      const externalMap = new Map<string, any>();
      if (extSettled.status === 'fulfilled' && !extSettled.value.error) {
        (extSettled.value.data || []).forEach((ext: any) => {
          externalMap.set(ext.id, ext);
        });
      } else {
        warnings.push('external_accounts supplementary lookup unavailable');
      }

      if (mapSettled.status === 'fulfilled' && !mapSettled.value.error) {
        joinedMappings = (mapSettled.value.data || []).map((m: any) => ({
          ...m,
          external_account: externalMap.get(m.external_account_id) || null,
        }));
      } else {
        warnings.push('account_mappings supplementary lookup unavailable');
      }

      if (intSettled.status === 'fulfilled' && !intSettled.value.error) {
        integrationAccounts = (intSettled.value.data || []) as RawIntegrationAccountRow[];
      } else {
        warnings.push('integration_accounts supplementary lookup unavailable');
      }

      if (metricsSettled.status === 'fulfilled' && !metricsSettled.value.error) {
        (metricsSettled.value.data || []).forEach((m: any) => {
          if (m?.client_id) clientsWithMetrics.add(m.client_id);
        });
      } else {
        warnings.push('daily_client_metrics supplementary lookup unavailable');
      }
    }

    const normalized: ClientProfile[] = safeClientRows.map((row: any) => {
      const clientMaps = joinedMappings.filter((m) => m.client_id === row.id);
      const clientIntAccs = integrationAccounts.filter((ia) => ia.client_id === row.id);
      return normalizeVerifiedClientRecord(
        row,
        clientMaps,
        clientIntAccs,
        clientsWithMetrics.has(row.id)
      );
    });

    return NextResponse.json({
      success: true,
      clients: normalized,
      user: {
        id: userId,
        email: email || 'Authenticated User',
        role,
      },
      meta: {
        totalCount: normalized.length,
        certifiedCount: normalized.filter((c) => c.is_certified).length,
        authorizedTenantIds,
        warnings,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CLIENTS_LOAD_ERROR',
          message: err?.message || 'Unexpected error loading client registry.',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await resolveAuthenticatedContext(req);
  if (!authCheck.authorized || !authCheck.context) {
    return authCheck.errorResponse!;
  }

  const { tenantId: primaryTenantId, authorizedTenantIds, accessToken } = authCheck.context;

  try {
    const body = await req.json();
    const { name, address, domain, store_code, organization_id, requested_tenant_id } =
      body || {};

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CLIENT_NAME',
            message: 'A valid client name (min 2 chars) is required.',
          },
        },
        { status: 400 }
      );
    }

    // Prefer tenant 00000000-0000-0000-0000-000000000001 if authorized so new clients join the main portfolio
    const defaultPortfolioTenant = authorizedTenantIds.includes(
      '00000000-0000-0000-0000-000000000001'
    )
      ? '00000000-0000-0000-0000-000000000001'
      : primaryTenantId;

    let targetTenantId = defaultPortfolioTenant;
    if (requested_tenant_id) {
      if (!authorizedTenantIds.includes(requested_tenant_id)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN_TENANT_ASSIGNMENT',
              message: 'Cannot create a client in an unauthorized tenant.',
            },
          },
          { status: 403 }
        );
      }
      targetTenantId = requested_tenant_id;
    }

    let supabase = getUserScopedSupabaseClient(accessToken);
    try {
      supabase = getServerSupabaseClient(req);
    } catch {
      // Use user-scoped client
    }

    const insertPayload: Record<string, any> = {
      tenant_id: targetTenantId,
      name: name.trim(),
      address: typeof address === 'string' && address.trim() !== '' ? address.trim() : null,
      domain: typeof domain === 'string' && domain.trim() !== '' ? domain.trim() : null,
      store_code:
        typeof store_code === 'string' && store_code.trim() !== '' ? store_code.trim() : null,
      organization_id:
        typeof organization_id === 'string' && organization_id.trim() !== ''
          ? organization_id.trim()
          : null,
      data_certification_status: 'DATA_REVIEW_REQUIRED',
      is_certified: false,
    };

    const { data: inserted, error: insertErr } = await supabase
      .from('clients')
      .insert([insertPayload])
      .select(VERIFIED_CLIENT_COLUMNS)
      .single();

    if (insertErr || !inserted) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CLIENT_CREATE_FAILED',
            message: insertErr?.message || 'Failed to insert client.',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        client: normalizeVerifiedClientRecord(inserted, [], [], false),
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'CLIENT_POST_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}
