import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenant_id, client_id } = body;

    if (!tenant_id || !client_id) {
      return NextResponse.json({ error: 'Missing tenant_id or client_id' }, { status: 400 });
    }

    // Scan keyword telemetry for rank drops
    const { data: keywords, error } = await supabase
      .from('keyword_library')
      .select(`
        id,
        keyword,
        rank_history (
          serp_rank,
          created_at
        )
      `)
      .eq('client_id', client_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const interventions: Array<{
      tenant_id: string;
      client_id: string;
      severity: string;
      signal_type: string;
      title: string;
      message: string;
      recommended_action: string;
      is_resolved: boolean;
      created_at: string;
    }> = [];

    (keywords || []).forEach((kw: any) => {
      const history = kw.rank_history || [];
      if (history.length < 2) return;

      const latestRank = history[0].serp_rank;
      const previousRank = history[1].serp_rank;

      if (previousRank <= 3 && latestRank > 3) {
        interventions.push({
          tenant_id,
          client_id,
          severity: 'CRITICAL',
          signal_type: 'SERP_PACK_DROP',
          title: `Local Pack Loss: ${kw.keyword}`,
          message: `Keyword "${kw.keyword}" dropped from position #${previousRank} to #${latestRank}, losing Top 3 Local Pack placement.`,
          recommended_action: 'Audit primary GBP category assignment and request immediate local citation sync.',
          is_resolved: false,
          created_at: new Date().toISOString(),
        });
      }
    });

    if (interventions.length > 0) {
      await supabase.from('signals').insert(interventions);
    }

    return NextResponse.json({
      success: true,
      evaluated_count: interventions.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Evaluation engine failure' }, { status: 500 });
  }
}
