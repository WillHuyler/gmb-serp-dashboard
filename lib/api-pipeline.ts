import { Client } from './client-context';

export async function triggerPlatformSync(
  client: Client,
  provider:
    | 'gmb'
    | 'google_ads'
    | 'ga4'
    | 'gsc'
    | 'meta_ads'
    | 'bing_webmaster'
    | 'clarity'
    | 'brightlocal',
  telemetryData: Record<string, any> = {}
) {
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

  const externalAccountId = client.mappings?.[mappingKeys[provider]] || '';

  const response = await fetch('/api/integrations/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${client.tenant_id}`,
    },
    body: JSON.stringify({
      clientId: client.id,
      provider,
      externalAccountId,
      telemetryData,
    }),
  });

  return await response.json();
}
