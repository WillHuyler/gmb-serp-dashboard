import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AUTHORITATIVE_CLIENT_REGISTRY, ClientProfile } from '../../../../lib/client-context';

export const dynamic = 'force-dynamic';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const clientId = params.id;
  const supabase = getSupabase();

  if (!supabase) {
    const fallback = AUTHORITATIVE_CLIENT_REGISTRY.find((c) => c.id === clientId);
    if (!fallback) {
      return NextResponse.json({ success: false, error: 'CLIENT_NOT_FOUND' }, { status: 404 });
    }
    return NextResponse.json({ success: true, client: fallback });
  }

  try {
    const { data: row, error } = await supabase
      .from('clients')
      .select('id, name, store_code, address, domain, tenant_id, is_certified, data_certification_status')
      .eq('id', clientId)
      .single();

    if (error || !row) {
      const fallback = AUTHORITATIVE_CLIENT_REGISTRY.find((c) => c.id === clientId);
      if (fallback) {
        return NextResponse.json({ success: true, client: fallback });
      }
      return NextResponse.json({ success: false, error: 'CLIENT_NOT_FOUND' }, { status: 404 });
    }

    const match = AUTHORITATIVE_CLIENT_REGISTRY.find((c) => c.id === row.id);
    const isCertified = Boolean(row.is_certified);

    const clientProfile: ClientProfile = {
      id: row.id,
      tenant_id: row.tenant_id || '00000000-0000-0000-0000-000000000001',
      name: row.name || 'Unnamed Client',
      store_code: row.store_code || null,
      address: row.address || null,
      domain: row.domain || match?.domain || null,
      status: isCertified ? 'active' : 'onboarding',
      is_certified: isCertified,
      data_certification_status: row.data_certification_status || 'DATA_REVIEW_REQUIRED',
      type: row.name === 'ABC Motors' ? 'TEST' : 'REAL',
      service_areas: match?.service_areas || [],
      mappings: match?.mappings || (row.store_code ? { gmb_location_id: row.store_code } : {}),
    };

    return NextResponse.json({
      success: true,
      client: clientProfile,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'CLIENT_FETCH_ERROR' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const clientId = params.id;
  const supabase = getSupabase();

  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'SUPABASE_NOT_CONFIGURED' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const updates: Record<string, any> = {};

    if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim();
    if (body.address !== undefined) updates.address = body.address;
    if (body.domain !== undefined) updates.domain = body.domain;
    if (body.store_code !== undefined) updates.store_code = body.store_code;
    if (typeof body.is_certified === 'boolean') updates.is_certified = body.is_certified;

    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', clientId)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: error?.message || 'UPDATE_FAILED' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      client: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'INTERNAL_SERVER_ERROR' },
      { status: 500 }
    );
  }
}
