import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export interface ProviderMetricsSummary {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpa: number;
  isIntegrated: boolean;
}

export class ProviderTelemetryService {
  /**
   * Evaluates Google Ads telemetry for a specific client entity.
   */
  static async getGoogleAdsSummary(tenantId: string, clientId: string): Promise<ProviderMetricsSummary> {
    const { data, error } = await supabase
      .from('raw_google_ads_telemetry')
      .select('cost, impressions, clicks, conversions')
      .eq('client_id', clientId);

    if (error || !data || data.length === 0) {
      return { spend: 0, impressions: 0, clicks: 0, conversions: 0, ctr: 0, cpc: 0, cpa: 0, isIntegrated: false };
    }

    const totals = data.reduce(
      (acc, curr) => ({
        spend: acc.spend + Number(curr.cost || 0),
        impressions: acc.impressions + Number(curr.impressions || 0),
        clicks: acc.clicks + Number(curr.clicks || 0),
        conversions: acc.conversions + Number(curr.conversions || 0),
      }),
      { spend: 0, impressions: 0, clicks: 0, conversions: 0 }
    );

    return {
      ...totals,
      ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
      cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
      cpa: totals.conversions > 0 ? totals.spend / totals.conversions : 0,
      isIntegrated: true,
    };
  }

  /**
   * Evaluates Search Console query and page exposure data.
   */
  static async getGSCSummary(tenantId: string, clientId: string) {
    const { data, error } = await supabase
      .from('raw_gsc_telemetry')
      .select('clicks, impressions, position')
      .eq('client_id', clientId);

    if (error || !data || data.length === 0) {
      return { totalClicks: 0, totalImpressions: 0, avgPosition: 0, isIntegrated: false };
    }

    const clicks = data.reduce((sum, r) => sum + Number(r.clicks || 0), 0);
    const impressions = data.reduce((sum, r) => sum + Number(r.impressions || 0), 0);
    const avgPosition = data.reduce((sum, r) => sum + Number(r.position || 0), 0) / data.length;

    return { totalClicks: clicks, totalImpressions: impressions, avgPosition, isIntegrated: true };
  }
}
