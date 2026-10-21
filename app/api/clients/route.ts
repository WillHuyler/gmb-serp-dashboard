import { NextRequest, NextResponse } from 'next/server';
import { resolveAuthenticatedContext, getServerSupabaseClient } from '../../../lib/auth-guard';
import { normalizeVerifiedClientRecord, JoinedAccountMapping } from '../../../lib/client-row-normalizer';
import { ClientProfile } from '../../../lib/client-context';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authCheck = await resolveAuthenticatedContext(req);
  if (!authCheck.authorized || !authCheck.context) {
    return authCheck.errorResponse!;
  }

  const { authorizedTenantIds } = authCheck.context;

  try {
    const supabase = getServerSupabaseClient(req);

    // Query only verified columns on public.clients
    const { data: clientRows, error: clientErr } = await supabase
      .from('clients')
      .select('id, tenant_id, name, domain, timezone, currency, is_certified, created_at')
      .in('tenant_id', authorizedTenantIds)
      .order('name', { ascending: true });

    if (clientErr) {
      return NextResponse.json(
        { success: false, error: { code: 'DB_QUERY_FAILED', message: clientErr.message } },
        { status: 500 }
      );
    }

    const clientIds = (clientRows || []).map((c: any) => c.id);
    let joinedMappings: JoinedAccountMapping[] = [];
    const clientsWithMetrics = new Set<string>();

    if (clientIds.length > 0) {
      const [mapRes, externalRes, metricsRes] = await Promise.all([
        supabase
          .from('account_mappings')
          .select('id, tenant_id, client_id, external_account_id, mapping_role, mapping_confidence, is_confirmed, include_in_command_center, created_at')
          .in('client_id', clientIds)
          .in('tenant_id', authorizedTenantIds),
        supabase
          .from('external_accounts')
          .select('id, provider, external_account_id, descriptive_name, account_type, status'),
        supabase
          .from('daily_client_metrics')
          .select('client_id')
          .in('client_id', clientIds)
          .limit(500),
      ]);

      const externalMap = new Map<string, any>();
      (externalRes.data || []).forEach((ext: any) => {
        externalMap.set(ext.id, ext);
      });

      joinedMappings = (mapRes.data || []).map((m: any) => ({
        ...m,
        external_account: externalMap.get(m.external_account_id) || null,
      }));

      (metricsRes.data || []).forEach((m: any) => {
        if (m?.client_id) clientsWithMetrics.add(m.client_id);
      });
    }

    const normalized: ClientProfile[] = (clientRows || []).map((row: any) => {
      const clientMaps = joinedMappings.filter((m) => m.client_id === row.id);
      return normalizeVerifiedClientRecord(row, clientMaps, clientsWithMetrics.has(row.id));
    });

    return NextResponse.json({
      success: true,
      clients: normalized,
      meta: {
        totalCount: normalized.length,
        certifiedCount: normalized.filter((c) => c.is_certified).length,
        authorizedTenantIds,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'CLIENTS_LOAD_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await resolveAuthenticatedContext(req);
  if (!authCheck.authorized || !authCheck.context) {
    return authCheck.errorResponse!;
  }

  const { tenantId: primaryTenantId, authorizedTenantIds } = authCheck.context;

  try {
    const body = await req.json();
    const { name, domain, timezone, currency, requested_tenant_id } = body || {};

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_CLIENT_NAME', message: 'A valid client name (min 2 chars) is required.' },
        },
        { status: 400 }
      );
    }

    let targetTenantId = primaryTenantId;
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

    const supabase = getServerSupabaseClient(req);

    // Strictly insert verified public.clients schema columns only
    const insertPayload: Record<string, any> = {
      tenant_id: targetTenantId,
      name: name.trim(),
      domain: typeof domain === 'string' && domain.trim() !== '' ? domain.trim() : null,
      timezone: typeof timezone === 'string' && timezone.trim() !== '' ? timezone.trim() : 'America/New_York',
      currency: typeof currency === 'string' && currency.trim() !== '' ? currency.trim() : 'USD',
      is_certified: false,
    };

    const { data: inserted, error: insertErr } = await supabase
      .from('clients')
      .insert([insertPayload])
      .select('id, tenant_id, name, domain, timezone, currency, is_certified, created_at')
      .single();

    if (insertErr || !inserted) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'CLIENT_CREATE_FAILED', message: insertErr?.message || 'Failed to insert client.' },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        client: normalizeVerifiedClientRecord(inserted, [], false),
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
