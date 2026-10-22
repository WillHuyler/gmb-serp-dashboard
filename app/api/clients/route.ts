import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AUTHORITATIVE_CLIENT_REGISTRY } from '../../../lib/client-context';

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

export async function GET() {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({
      success: true,
      source: 'AUTHORITATIVE_FALLBACK',
      clients: AUTHORITATIVE_CLIENT_REGISTRY,
    });
  }

  try {
    const [
      { data: dbClients, error: clientsErr },
      { data: zipRows },
      { data: dmRows },
    ] = await Promise.all([
      supabase
        .from('clients')
        .select(
          'id, name, store_code, address, created_at, organization_id, tenant_id, data_certification_status, domain, is_certified'
        )
        .order('name', { ascending: true }),
      supabase.from('zip_rankings').select('client_id, zip_code'),
      supabase.from('daily_metrics').select('client_id'),
    ]);

    if (clientsErr || !dbClients || dbClients.length === 0) {
      return NextResponse.json({
        success: true,
        source: 'AUTHORITATIVE_FALLBACK',
        clients: AUTHORITATIVE_CLIENT_REGISTRY,
      });
    }

    const zipsByClient = new Map<string, string[]>();
    (zipRows || []).forEach((r: any) => {
      if (r.client_id && r.zip_code) {
        const list = zipsByClient.get(r.client_id) || [];
        if (!list.includes(r.zip_code)) list.push(r.zip_code);
        zipsByClient.set(r.client_id, list);
      }
    });

    const clientsWithDm = new Set((dmRows || []).map((r: any) => r.client_id));

    const merged = dbClients.map((row: any) => {
      const match = AUTHORITATIVE_CLIENT_REGISTRY.find((c) => c.id === row.id);
      const dbZips = zipsByClient.get(row.id) || [];
      const isCert = Boolean(row.is_certified) && clientsWithDm.has(row.id);

      return {
        id: row.id,
        tenant_id: row.tenant_id || '00000000-0000-0000-0000-000000000001',
        name: row.name,
        store_code: row.store_code || null,
        address: row.address || null,
        domain: row.domain || match?.domain || null,
        is_certified: isCert,
        data_certification_status: row.data_certification_status || 'DATA_REVIEW_REQUIRED',
        type: row.name === 'ABC Motors' ? 'TEST' : 'REAL',
        service_areas: dbZips.length > 0 ? dbZips : match?.service_areas || [],
        mappings:
          match?.mappings ||
          (row.store_code ? { gmb_location_id: row.store_code } : {}),
      };
    });

    return NextResponse.json({
      success: true,
      source: 'SUPABASE_LIVE',
      clients: merged,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      source: 'AUTHORITATIVE_FALLBACK',
      clients: AUTHORITATIVE_CLIENT_REGISTRY,
      warning: err.message,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, tenantId, address, domain, storeCode } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'INVALID_CLIENT_NAME: Client name is required' },
        { status: 400 }
      );
    }

    const effectiveTenantId = tenantId || '00000000-0000-0000-0000-000000000001';
    const supabase = getSupabase();

    if (supabase) {
      const { data, error } = await supabase
        .from('clients')
        .insert([
          {
            tenant_id: effectiveTenantId,
            name: name.trim(),
            address: address || null,
            domain: domain || null,
            store_code: storeCode || null,
            is_certified: false,
            data_certification_status: 'DATA_REVIEW_REQUIRED',
          },
        ])
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json({
          success: true,
          client: {
            ...data,
            type: 'REAL',
            service_areas: [],
            mappings: data.store_code ? { gmb_location_id: data.store_code } : {},
          },
        });
      }
    }

    return NextResponse.json(
      { success: false, error: 'DATABASE_INSERT_FAILED' },
      { status: 500 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'INTERNAL_SERVER_ERROR' },
      { status: 500 }
    );
  }
}
