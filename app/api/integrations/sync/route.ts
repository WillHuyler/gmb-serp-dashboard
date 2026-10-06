import { NextRequest, NextResponse } from 'next/server';
import { validateClientAccess } from '@/lib/auth-guard';
import { CANONICAL_CLIENTS } from '@/lib/client-context';

export interface IntegrationSyncPayload {
  clientId: string;
  provider: 
    | 'gmb'
    | 'google_ads'
    | 'ga4'
    | 'gsc'
    | 'meta_ads'
    | 'bing_webmaster'
    | 'clarity'
    | 'brightlocal';
  externalAccountId: string;
  telemetryData: Record<string, any>;
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const body: IntegrationSyncPayload = await req.json();

    const { clientId, provider, externalAccountId, telemetryData } = body;

    // 1. Enforce Server-Side Tenant Scoping Security Gate
    const accessCheck = await validateClientAccess(authHeader, clientId);
    if (!accessCheck.authorized) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED_TENANT_ACCESS', message: accessCheck.message },
        { status: 403 }
      );
    }

    // 2. Validate Target Client Identity in Canonical Registry
    const client = CANONICAL_CLIENTS.find((c) => c.id === clientId);
    if (!client) {
      return NextResponse.json(
        { error: 'CLIENT_NOT_FOUND', message: `Client ID ${clientId} does not exist in Canonical Registry.` },
        { status: 404 }
      );
    }

    // 3. Provider Mapping Verification
    const mappingKeys: Record<string, keyof typeof client.mappings> = {
      gmb: 'gmb_account_id',
      google_ads: 'google_ads_id',
      ga4: 'ga4_property_id',
      gsc: 'gsc_site_url',
      meta_ads: 'meta_act_id',
      bing_webmaster: 'bing_webmaster_site_url',
      clarity: 'clarity_project_id',
      brightlocal: 'brightlocal_location_id',
    };

    const mappedKey = mappingKeys[provider];
    const registeredId = client.mappings?.[mappedKey];

    if (!registeredId) {
      return NextResponse.json(
        {
          error: 'PROVIDER_NOT_MAPPED',
          message: `Provider ${provider} is not mapped for ${client.name}. Please configure account IDs in Settings.`,
        },
        { status: 400 }
      );
    }

    // 4. Ingestion Process & Telemetry Persistence (Mock Pipeline Output)
    return NextResponse.json({
      status: 'SYNC_SUCCESS',
      timestamp: new Date().toISOString(),
      client: {
        id: client.id,
        name: client.name,
        is_certified: client.is_certified,
      },
      provider,
      externalAccountId,
      recordsIngested: Object.keys(telemetryData).length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'PIPELINE_ERROR', message: error.message || 'Internal sync failure' },
      { status: 500 }
    );
  }
}
