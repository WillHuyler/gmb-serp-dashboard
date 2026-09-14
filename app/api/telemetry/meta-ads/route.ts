import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenant_id, client_id, campaign_name, spend, impressions, clicks, conversions, recorded_at } = body;

    if (!tenant_id || !client_id) {
      return NextResponse.json({ error: 'Missing tenant_id or client_id' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('paid_media_telemetry')
      .insert([
        {
          tenant_id,
          client_id,
          platform: 'META_ADS',
          campaign_name: campaign_name || 'Meta Ads Campaign',
          spend: Number(spend) || 0,
          impressions: Number(impressions) || 0,
          clicks: Number(clicks) || 0,
          conversions: Number(conversions) || 0,
          recorded_at: recorded_at || new Date().toISOString(),
        },
      ]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      channel: 'META_ADS',
      ingested_at: new Date().toISOString(),
      record: data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to ingest Meta Ads telemetry' }, { status: 500 });
  }
}
