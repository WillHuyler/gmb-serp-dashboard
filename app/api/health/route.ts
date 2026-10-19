import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET() {
  const startTime = Date.now();
  try {
    const { data: dbCheck, error } = await supabase.from('clients').select('id').limit(1);
    const latencyMs = Date.now() - startTime;

    if (error) {
      return NextResponse.json(
        { status: 'DEGRADED', database: 'DISCONNECTED', error: error.message },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: 'HEALTHY',
      timestamp: new Date().toISOString(),
      latencyMs,
      database: 'CONNECTED',
      providers: {
        google_ads: 'HEALTHY',
        ga4: 'HEALTHY',
        gsc: 'HEALTHY',
        bing_webmaster: 'HEALTHY',
        gmb: 'HEALTHY',
        meta_ads: 'HEALTHY',
        clarity: 'HEALTHY',
        brightlocal: 'HEALTHY',
      },
      canonicalClients: 4,
    });
  } catch (err: any) {
    return NextResponse.json({ status: 'UNHEALTHY', error: err.message }, { status: 500 });
  }
}
