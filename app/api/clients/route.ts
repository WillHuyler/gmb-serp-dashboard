import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function GET() {
  try {
    const { data: clients, error } = await supabase
      .from('clients')
      .select('id, tenant_id, name, domain, is_certified')
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, clients });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
