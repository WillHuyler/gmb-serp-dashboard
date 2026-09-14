import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export interface CRMPayload {
  tenant_id: string;
  client_id: string;
  source: string; // e.g., 'HUBSPOT', 'SALESFORCE', 'HIGHLEVEL'
  total_leads: number;
  qualified_leads: number;
  closed_sales: number;
  total_revenue: number;
  recorded_at?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: CRMPayload = await req.json();
    const { tenant_id, client_id, source, total_leads, qualified_leads, closed_sales, total_revenue, recorded_at } = body;

    if (!tenant_id || !client_id) {
      return NextResponse.json({ error: 'Missing required tenant_id or client_id' }, { status: 400 });
    }

    const timestamp = recorded_at || new Date().toISOString();

    const { data, error } = await supabase
      .from('crm_telemetry')
      .upsert({
        tenant_id,
        client_id,
        source: source || 'CRM_PIPELINE',
        total_leads: total_leads || 0,
        qualified_leads: qualified_leads || 0,
        closed_sales: closed_sales || 0,
        total_revenue: total_revenue || 0,
        recorded_at: timestamp,
      }, { onConflict: 'tenant_id,client_id,recorded_at' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      channel: 'CRM_PIPELINE',
      ingested_at: timestamp,
      record: data
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'CRM ingestion pipeline failure' }, { status: 500 });
  }
}
