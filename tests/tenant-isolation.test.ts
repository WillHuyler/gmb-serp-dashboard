import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

describe('CRITICAL: Tenant Isolation & Multi-Tenant Security Suite', () => {
  const tenantBetaId = '99999999-9999-9999-9999-999999999999';

  test('Public client query enforcing RLS filters non-authorized tenant rows', async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('tenant_id', tenantBetaId);

    // RLS Policy MUST return zero rows for unauthorized tenant queries
    expect(data?.length || 0).toBe(0);
  });

  test('Keyword Telemetry prevents cross-tenant data leakage', async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data } = await supabase
      .from('keyword_library')
      .select('*, clients!inner(tenant_id)')
      .eq('clients.tenant_id', tenantBetaId);

    expect(data?.length || 0).toBe(0);
  });
});
