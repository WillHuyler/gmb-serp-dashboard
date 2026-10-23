import { NextRequest, NextResponse } from 'next/server';
import { validateClientAccess, getServerSupabaseClient } from '../../../lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('clientId');

  if (!clientId) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'MISSING_CLIENT_ID', message: 'clientId query parameter is required.' },
      },
      { status: 400 }
    );
  }

  const authCheck = await validateClientAccess(req, clientId, true);
  if (!authCheck.authorized || !authCheck.context) {
    return authCheck.errorResponse!;
  }

  const { tenantId } = authCheck.context;

  try {
    const supabase = getServerSupabaseClient(req);

    // Query real execution history from public.api_execution_logs
    const { data: rawLogs, error: logsErr } = await supabase
      .from('api_execution_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(25);

    const clientLogs = !logsErr && Array.isArray(rawLogs)
      ? rawLogs.filter(
          (row: any) =>
            row.client_id === clientId ||
            (row.tenant_id === tenantId && !row.client_id)
        )
      : [];

    // Normalize only genuinely verifiable execution records (must have id, timestamp, and status)
    const executionHistory = clientLogs
      .filter((row: any) => row.id && (row.created_at || row.completed_at || row.executed_at))
      .map((row: any) => ({
        executionId: String(row.id),
        clientId: row.client_id || clientId,
        ruleId: row.rule_id || row.endpoint || row.job_name || 'provider_sync',
        status:
          String(row.status || '').toUpperCase() === 'SUCCEEDED' ||
          String(row.status || '').toUpperCase() === 'SUCCESS' ||
          row.http_status === 200
            ? 'SUCCEEDED'
            : String(row.status || '').toUpperCase() === 'FAILED' ||
              String(row.status || '').toUpperCase() === 'ERROR'
            ? 'FAILED'
            : 'RECORDED',
        completedAt: row.completed_at || row.executed_at || row.created_at,
        summary: row.error_message || row.status_message || row.provider || 'Execution logged',
      }));

    // Check public.clients certification state (Automated actions blocked on uncertified telemetry)
    const { data: clientRow } = await supabase
      .from('clients')
      .select('id, name, is_certified, data_certification_status')
      .eq('id', clientId)
      .eq('tenant_id', tenantId)
      .single();

    return NextResponse.json({
      success: true,
      clientId,
      tenantId,
      isClientCertified: Boolean(clientRow?.is_certified),
      // CR-025 Requirement #2 & #3: No persistent client-scoped automation_rules table exists in the 46-table schema
      rulePersistenceAvailable: false,
      setupRequired: true,
      setupReason:
        'Client-scoped alert rule persistence is not yet provisioned in the database schema. Zero simulated rules are shown.',
      rules: [],
      cronInfrastructure: {
        endpoint: '/api/cron/daily-etl',
        scheduleDescription: 'System cron endpoint (distinct from client-configurable alert rules)',
        automatedActionsBlocked: !clientRow?.is_certified,
      },
      executionHistory,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'AUTOMATION_QUERY_ERROR', message: err?.message || 'Failed to load automation state.' },
      },
      { status: 500 }
    );
  }
}
