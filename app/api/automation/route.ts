import { NextRequest, NextResponse } from 'next/server';
import {
  validateClientAccess,
  getUserScopedSupabaseClient,
  getServerSupabaseClient,
} from '../../../lib/auth-guard';

export const dynamic = 'force-dynamic';

export interface VerifiedExecutionLogItem {
  executionId: string;
  clientId: string;
  ruleId: string;
  status: 'SUCCEEDED' | 'FAILED' | 'RECORDED';
  completedAt: string;
  summary: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('clientId');

  if (!clientId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MISSING_CLIENT_ID',
          message: 'clientId query parameter is required.',
        },
      },
      { status: 400 }
    );
  }

  const authCheck = await validateClientAccess(req, clientId, true);
  if (!authCheck.authorized || !authCheck.context) {
    return authCheck.errorResponse!;
  }

  const { tenantId, accessToken } = authCheck.context;

  try {
    const userSupabase = accessToken
      ? getUserScopedSupabaseClient(accessToken)
      : getServerSupabaseClient(req);

    // 1. Verify client ownership and certification state under RLS
    const { data: clientRow, error: clientErr } = await userSupabase
      .from('clients')
      .select('id, name, tenant_id, is_certified, data_certification_status')
      .eq('id', clientId)
      .eq('tenant_id', tenantId)
      .single();

    if (clientErr || !clientRow) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CLIENT_NOT_FOUND_OR_FORBIDDEN',
            message: 'Authorized client record not found.',
          },
        },
        { status: 404 }
      );
    }

    // 2. Query client-scoped execution history from public.api_execution_logs
    //    Wait for CR-026 RLS policy on api_execution_logs; surface policy/query warnings transparently
    const { data: rawLogs, error: logsErr } = await userSupabase
      .from('api_execution_logs')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(25);

    const executionHistory: VerifiedExecutionLogItem[] = [];

    if (!logsErr && Array.isArray(rawLogs)) {
      for (const row of rawLogs) {
        const executionId = row.id ? String(row.id) : null;
        const rowClientId = row.client_id ? String(row.client_id) : null;
        const ruleId =
          row.rule_id || row.job_name || row.endpoint || row.provider || null;
        const completedAt =
          row.completed_at || row.executed_at || row.created_at || null;
        const rawStatus = String(row.status || '').toUpperCase();

        // CR-025 / CR-026: A record is only valid if executionId, clientId, ruleId, and completedAt exist
        if (executionId && rowClientId === clientId && ruleId && completedAt) {
          const isExplicitSuccess =
            (rawStatus === 'SUCCEEDED' || rawStatus === 'SUCCESS') &&
            !row.error_message;
          const isExplicitFailure =
            rawStatus === 'FAILED' ||
            rawStatus === 'ERROR' ||
            Boolean(row.error_message);

          executionHistory.push({
            executionId,
            clientId: rowClientId,
            ruleId: String(ruleId),
            status: isExplicitSuccess
              ? 'SUCCEEDED'
              : isExplicitFailure
              ? 'FAILED'
              : 'RECORDED',
            completedAt: String(completedAt),
            summary:
              row.error_message ||
              row.status_message ||
              `Verified execution (${String(ruleId)})`,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      clientId,
      tenantId,
      isClientCertified: Boolean(clientRow.is_certified),
      rulePersistenceAvailable: false,
      setupRequired: true,
      setupReason:
        'Client-scoped alert rule persistence is not yet provisioned in the database schema. Zero simulated rules are shown.',
      rules: [],
      cronInfrastructure: {
        endpoint: '/api/cron/daily-etl',
        scheduleDescription:
          'System cron endpoint (distinct from human-configurable client alert rules)',
        automatedActionsBlocked: !clientRow.is_certified,
      },
      executionHistory,
      diagnostics: {
        rlsPolicyActiveOnExecutionLogs: !logsErr,
        queryWarning: logsErr ? logsErr.message : null,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'AUTOMATION_QUERY_ERROR',
          message: err?.message || 'Failed to load automation state.',
        },
      },
      { status: 500 }
    );
  }
}
