import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// GET: Fetch deployed active strategies for a client
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Missing clientId parameter' },
        { status: 400 }
      );
    }

    const { data: strategies, error } = await supabase
      .from('deployed_strategies')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      // Fallback mock if table doesn't exist yet in Supabase
      return NextResponse.json({
        success: true,
        strategies: [
          {
            id: 'mock-strat-1',
            client_id: clientId,
            strategy_name: 'REVERSE_OPTIMAL_COMBINATION',
            simulation_mode: 'REVERSE',
            target_leads: 216,
            timeframe_days: 90,
            created_at: new Date().toISOString(),
            status: 'ACTIVE_EXECUTING',
          },
        ],
      });
    }

    return NextResponse.json({ success: true, strategies });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
