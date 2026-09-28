export interface OutcomeScenario {
  targetGrowth: string; // e.g., "+10%", "+15%", "+20%", "+25%"
  modeledLeads: number;
  projectedRevenue: string;
  recommendedActions: Array<{
    channel: string;
    action: string;
    estimatedCost: string;
    impactScore: string;
  }>;
}

export interface ScenarioResult {
  status: 'CERTIFIED' | 'PARTIAL' | 'UNCERTIFIED';
  clientName: string;
  message?: string;
  scenarios?: OutcomeScenario[];
}

/**
 * Calculates Outcome Lab scenario models only when the active client's baseline is CERTIFIED.
 * Enforces Fail-Closed behavior for uncertified clients.
 */
export function getOutcomeLabScenarios(
  clientId: string,
  clientName: string,
  isCertified: boolean
): ScenarioResult {
  if (!isCertified) {
    return {
      status: 'UNCERTIFIED',
      clientName,
      message: 'MODEL NOT READY — UNCERTIFIED BASELINE. Required API sources (Google Ads, GA4) are unmapped or pending account connection.',
    };
  }

  // Certified baseline scenario models
  return {
    status: 'CERTIFIED',
    clientName,
    scenarios: [
      {
        targetGrowth: '+10%',
        modeledLeads: 198,
        projectedRevenue: '$138,600',
        recommendedActions: [
          { channel: 'Google Ads', action: 'Scale High-Intent Local Keywords', estimatedCost: '+$350/mo', impactScore: 'High' },
          { channel: 'GMB', action: 'Increase Weekly Post Frequency to 3x', estimatedCost: '$0', impactScore: 'Medium' },
        ],
      },
      {
        targetGrowth: '+15%',
        modeledLeads: 207,
        projectedRevenue: '$144,900',
        recommendedActions: [
          { channel: 'Google Ads', action: 'Expand Radius Targeting by +5 Miles', estimatedCost: '+$550/mo', impactScore: 'High' },
          { channel: 'Meta Ads', action: 'Launch Retargeting Campaign for Website Visitors', estimatedCost: '+$250/mo', impactScore: 'Medium' },
        ],
      },
      {
        targetGrowth: '+20%',
        modeledLeads: 216,
        projectedRevenue: '$151,200',
        recommendedActions: [
          { channel: 'Google Ads', action: 'Capture Search Impression Share in ZIP 53211', estimatedCost: '+$750/mo', impactScore: 'Very High' },
          { channel: 'Reputation', action: 'Trigger Automated Review Request Workflows', estimatedCost: '$0', impactScore: 'High' },
        ],
      },
      {
        targetGrowth: '+25%',
        modeledLeads: 225,
        projectedRevenue: '$157,500',
        recommendedActions: [
          { channel: 'Google Ads', action: 'Max Conversions Bidding on Tier 1 Keywords', estimatedCost: '+$1,100/mo', impactScore: 'Very High' },
          { channel: 'Meta Ads', action: 'Broad Audience Lookalike Campaign', estimatedCost: '+$400/mo', impactScore: 'High' },
        ],
      },
    ],
  };
}
