import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenant_id, client_id, keyword_id, serp_rank, previous_rank } = body;

    if (!tenant_id || !client_id || !keyword_id || serp_rank === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: tenant_id, client_id, keyword_id, serp_rank' },
        { status: 400 }
      );
    }

    // 1. Record rank update in rank_history
    const { error: rankError } = await supabase.from('rank_history').insert([
      {
        keyword_id,
        serp_rank,
        created_at: new Date().toISOString(),
      },
    ]);

    if (rankError) {
      return NextResponse.json({ error: rankError.message }, { status: 500 });
    }

    // 2. Automated Anomaly Detection: Flag displacement out of Local Pack (Position > 3)
    if (previous_rank && previous_rank <= 3 && serp_rank > 3) {
      const dropDelta = serp_rank - previous_rank;
      
      await supabase.from('signals').insert([
        {
          tenant_id,
          client_id,
          severity: 'CRITICAL',
          signal_type: 'LOCAL_PACK_DISPLACEMENT',
          title: `Local Pack Loss (+${dropDelta} Positions)`,
          message: `Keyword #${keyword_id} dropped from Position #${previous_rank} to #${serp_rank}, losing Top 3 Local Pack placement.`,
          recommended_action: 'Audit target GBP categories and check local citation consistency immediately.',
          is_resolved: false,
        },
      ]);
    }

    return NextResponse.json({ success: true, processed_at: new Date().toISOString() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
