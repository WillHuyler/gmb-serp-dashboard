import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizedCronServiceClient } from '../../../../lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cronAuth = getAuthorizedCronServiceClient(req);
  if (!cronAuth.authorized || !cronAuth.supabase) {
    return cronAuth.errorResponse!;
  }

  const supabase = cronAuth.supabase;
  const startedAt = new Date().toISOString();

  try {
    const { data: clients, error: clientsErr } = await supabase
      .from('clients')
      .select('id, name, tenant_id, is_certified, data_certification_status');

    if (clientsErr) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CRON_CLIENT_LOAD_FAILED',
            message: clientsErr.message,
          },
        },
        { status: 500 }
      );
    }

    const activeClients = clients || [];
    const results: Array<{
      clientId: string;
      clientName: string;
      mappedSources: number;
      status: 'SKIPPED_UNMAPPED' | 'AWAITING_PROVIDER_CREDENTIALS';
      executionLogId?: string | null;
    }> = [];

    for (const client of activeClients) {
      const { data: mappings } = await supabase
        .from('account_mappings')
        .select('id, external_account_id, is_confirmed')
        .eq('client_id', client.id)
        .eq('tenant_id', client.tenant_id)
        .eq('is_confirmed', true);

      const confirmedCount = (mappings || []).length;

      const logStatus =
        confirmedCount === 0 ? 'SKIPPED_UNMAPPED' : 'AWAITING_PROVIDER_CREDENTIALS';
      const statusMessage =
        confirmedCount === 0
          ? 'Client has 0 confirmed account_mappings; skipping ingestion without fabricating zero metrics.'
          : `Client has ${confirmedCount} confirmed mapping(s); live provider OAuth token required for external API pull.`;

      const { data: logRow } = await supabase
        .from('api_execution_logs')
        .insert([
          {
            client_id: client.id,
            endpoint: '/api/cron/daily-etl',
            status: logStatus,
            status_message: statusMessage,
            created_at: new Date().toISOString(),
          },
        ])
        .select('id')
        .maybeSingle();

      results.push({
        clientId: client.id,
        clientName: client.name,
        mappedSources: confirmedCount,
        status: logStatus,
        executionLogId: logRow?.id || null,
      });
    }

    return NextResponse.json({
      success: true,
      startedAt,
      completedAt: new Date().toISOString(),
      processedClients: results.length,
      results,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DAILY_ETL_EXECUTION_ERROR',
          message: err?.message || 'Unexpected error during daily ETL execution.',
        },
      },
      { status: 500 }
    );
  }
}
