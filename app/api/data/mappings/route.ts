import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { client_id, external_account_id, provider } = body;

    if (!client_id || !external_account_id) {
      return NextResponse.json(
        { success: false, error: 'Missing client_id or external_account_id' },
        { status: 400 }
      );
    }

    const { data: mapping, error } = await supabase
      .from('account_mappings')
      .insert([
        {
          client_id,
          external_account_id,
          provider: provider || 'GOOGLE_ADS',
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Mark client as certified upon valid connection mapping
    await supabase
      .from('clients')
      .update({ is_certified: true })
      .eq('id', client_id);

    return NextResponse.json({ success: true, mapping });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
