import { NextRequest, NextResponse } from 'next/server';
import { validateClientAccess } from '../../../../lib/auth-guard';
import {
  createServiceRoleSupabaseClient,
  createUserScopedSupabaseClient,
  extractAccessToken,
} from '../../../../lib/supabase/auth-server';
import { normalizeClientRow } from '../route';

export const dynamic = 'force-dynamic';

function getDbClient(req: NextRequest) {
  try {
    return createServiceRoleSupabaseClient();
  } catch {
    const token = extractAccessToken(req)!;
    return createUserScopedSupabaseClient(token);
  }
}

/**
 * GET /api/clients/:id
 * Retrieves a single authorized client record and its current mappings.
 */
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
    const supabase = getDbClient(req);
    const [clientRes, mapRes] = await Promise.all([
      supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .eq('tenant_id', authCheck.context.tenantId)
        .single(),
      supabase
        .from('account_mappings')
        .select('*')
        .eq('client_id', clientId),
    ]);

    if (clientRes.error || !clientRes.data) {
      return NextResponse.json(
        { success: false, error: { code: 'CLIENT_NOT_FOUND', message: 'Client record not found.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      client: normalizeClientRow(clientRes.data, mapRes.data || []),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'CLIENT_FETCH_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/clients/:id
 * Updates client details (name, address, service_areas).
 * Never allows direct tampering with tenant_id or synthetic certification bypass.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const clientId = params.id;
  const authCheck = await validateClientAccess(req, clientId);
  if (!authCheck.authorized || !authCheck.context) {
    return authCheck.errorResponse!;
  }

  try {
    const body = await req.json();
    const { name, address, service_areas } = body || {};

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

    if (typeof address === 'string') {
      updatePayload.address = address.trim();
    }

    if (Array.isArray(service_areas)) {
      updatePayload.service_areas = service_areas.map((z) => String(z).trim()).filter(Boolean);
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'EMPTY_UPDATE', message: 'No valid update fields provided.' } },
        { status: 400 }
      );
    }

    const supabase = getDbClient(req);
    const { data: updated, error: updateErr } = await supabase
      .from('clients')
      .update(updatePayload)
      .eq('id', clientId)
      .eq('tenant_id', authCheck.context.tenantId)
      .select('*')
      .single();

    if (updateErr || !updated) {
      return NextResponse.json(
        { success: false, error: { code: 'CLIENT_UPDATE_FAILED', message: updateErr?.message || 'Update failed.' } },
        { status: 500 }
      );
    }

    const { data: mapRows } = await supabase
      .from('account_mappings')
      .select('*')
      .eq('client_id', clientId);

    return NextResponse.json({
      success: true,
      client: normalizeClientRow(updated, mapRows || []),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'CLIENT_PATCH_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}
