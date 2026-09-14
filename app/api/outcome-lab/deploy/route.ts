import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenant_id, client_id, pathway_title, expected_lift, timeframe_days, target_goal } = body;

    if (!tenant_id || !client_id || !pathway_title) {
      return NextResponse.json({ error: 'Missing required strategy deployment parameters' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('signals')
      .insert([
        {
          tenant_id,
          client_id,
          severity: 'STRATEGIC_OBJECTIVE',
          signal_type: 'OUTCOME_TARGET_DEPLOYED',
          title: `Deployed Growth Target: ${pathway_title}`,
          message: `Target of ${target_goal} leads configured over ${timeframe_days} days requiring +${expected_lift}% acceleration.`,
          recommended_action: `Monitor weekly channel trajectory against +${expected_lift}% lift model.`,
          is_resolved: false,
          created_at: new Date().toISOString(),
        },
      ]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deployed_at: new Date().toISOString(),
      record: data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to deploy strategy pathway' }, { status: 500 });
  }
}
