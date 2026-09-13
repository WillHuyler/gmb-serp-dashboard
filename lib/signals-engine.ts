export interface PorchLightSignal {
  id: string;
  channel: 'OtterWatch' | 'Google Ads' | 'Meta Ads' | 'CRM' | 'AI Presence';
  signalType: string;
  severity: 'critical' | 'warning' | 'info';
  metricName: string;
  baselineValue: number;
  currentValue: number;
  percentChange: number;
  evidence: string;
  recommendedAction: string;
  timestamp: string;
}

export class SignalsEngine {
  static getActiveSignals(): PorchLightSignal[] {
    return [
      {
        id: 'sig-001',
        channel: 'OtterWatch',
        signalType: 'Local Pack Position Loss',
        severity: 'critical',
        metricName: 'Avg Local Pack Rank',
        baselineValue: 1.8,
        currentValue: 4.2,
        percentChange: -133.3,
        evidence: 'Competitor "BrightSmile Care" gained #1 position across 4 zip codes following GBP category updates.',
        recommendedAction: 'Trigger OtterWatch Local Audit & update GMB secondary service attributes.',
        timestamp: '10 mins ago'
      },
      {
        id: 'sig-002',
        channel: 'AI Presence',
        signalType: 'Perplexity Citation Dropped',
        severity: 'warning',
        metricName: 'Perplexity Share of Voice',
        baselineValue: 80,
        currentValue: 0,
        percentChange: -100,
        evidence: 'Brand uncited for target prompt "affordable dental implants with good reviews".',
        recommendedAction: 'Publish structured Schema FAQ on implants landing page to re-trigger LLM retrieval.',
        timestamp: '2 hours ago'
      },
      {
        id: 'sig-003',
        channel: 'Google Ads',
        signalType: 'CPA Anomaly Detected',
        severity: 'warning',
        metricName: 'Cost Per Lead',
        baselineValue: 42.50,
        currentValue: 68.10,
        percentChange: 60.2,
        evidence: 'Search query drift in exact match campaigns driving un-qualified clicks.',
        recommendedAction: 'Apply Beacon automated negative keyword list to campaign #8841.',
        timestamp: '5 hours ago'
      }
    ];
  }
}
