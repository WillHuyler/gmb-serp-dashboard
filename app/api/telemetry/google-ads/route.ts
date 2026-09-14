import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenant_id, client_id, account_id, campaign_id, impressions, clicks, cost, conversions, observed_at } = body;

    if (!tenant_id || !client_id || !account_id || !campaign_id) {
      return NextResponse.json({ error: 'Missing mandatory dimensions' }, { status: 400 });
    }

    const { error } = await supabase.from('raw_google_ads_telemetry').insert([
      {
        tenant_id,
        client_id,
        account_id,
        campaign_id,
        impressions: impressions || 0,
        clicks: clicks || 0,
        cost: cost || 0,
        conversions: conversions || 0,
        observed_at: observed_at || new Date().toISOString(),
      },
    ]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, ingested_at: new Date().toISOString() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
