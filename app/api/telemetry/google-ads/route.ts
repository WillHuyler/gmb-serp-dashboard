import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateClientAccess } from '../../../../lib/auth-guard';
import { CANONICAL_CLIENTS } from '../../../../lib/client-context';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, startDate, endDate, rawTelemetry } = body;

    // 1. Enforce Server-Side Tenant & Client Scoping Security Gate
    const authCheck = await validateClientAccess(req, clientId || undefined);
    if (!authCheck.authorized) {
      return authCheck.errorResponse || NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const tenantId = authCheck.context?.tenantId || '00000000-0000-0000-0000-000000000001';

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'MISSING_CLIENT_ID', message: 'clientId parameter is required.' },
        { status: 400 }
      );
    }

    // 2. Validate Client Context in Canonical Registry
    const activeClient = CANONICAL_CLIENTS.find((c) => c.id === clientId);
    if (!activeClient) {
      return NextResponse.json(
        { success: false, error: 'CLIENT_NOT_FOUND', message: `Client ID ${clientId} not registered in Canonical Roster.` },
        { status: 404 }
      );
    }

    // 3. Verify Google Ads Provider Account Mapping
    const googleAdsId = activeClient.mappings?.google_ads_id;
    if (!googleAdsId) {
      return NextResponse.json(
        {
          success: false,
          status: 'NOT_CONNECTED',
          message: `Google Ads is not mapped for ${activeClient.name}. Ingestion halted safely.`,
          meta: { tenantId, clientId, provider: 'GOOGLE_ADS', isCertified: false },
        },
        { status: 200 }
      );
    }

    // 4. Generate Provenance Batch Metadata
    const ingestionRunId = `ingest_gads_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const metricDate = startDate || new Date().toISOString().split('T')[0];

    // Normalize Metrics Payload
    const spend = rawTelemetry?.spend ?? 0;
    const impressions = rawTelemetry?.impressions ?? 0;
    const clicks = rawTelemetry?.clicks ?? 0;
    const conversions = rawTelemetry?.conversions ?? 0;

    // 5. Upsert Telemetry into Supabase
    const { data, error: dbError } = await supabase
      .from('paid_media_telemetry')
      .upsert(
        {
          tenant_id: tenantId,
          client_id: activeClient.id,
          provider: 'GOOGLE_ADS',
          external_account_id: googleAdsId,
          metric_date: metricDate,
          spend,
          impressions,
          clicks,
          conversions,
          ingestion_run_id: ingestionRunId,
          is_certified: activeClient.is_certified,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'client_id,provider,metric_date' }
      );

    if (dbError) {
      console.error('Database Ingestion Write Error:', dbError);
      return NextResponse.json(
        { success: false, error: 'DATABASE_WRITE_FAILED', message: dbError.message },
        { status: 500 }
      );
    }

    // 6. Return Standard Certification & Provenance Response Schema
    return NextResponse.json({
      success: true,
      status: activeClient.is_certified ? 'CERTIFIED_INGESTION_COMPLETE' : 'UNCERTIFIED_BASELINE_INGESTED',
      provenance: {
        tenantId,
        clientId: activeClient.id,
        clientName: activeClient.name,
        provider: 'GOOGLE_ADS',
        externalAccountId: googleAdsId,
        ingestionRunId,
        period: { startDate: metricDate, endDate: endDate || metricDate },
        syncedAt: new Date().toISOString(),
        isCertified: activeClient.is_certified,
      },
      summary: {
        records_processed: 1,
        spend,
        impressions,
        clicks,
        conversions,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'INGESTION_PIPELINE_ERROR', message: err.message || 'Internal failure' },
      { status: 500 }
    );
  }
}
