export interface PitchScenario {
  targetIncrease: string;
  targetMetric: string;
  strategies: {
    name: string;
    focus: string;
    projectedResult: string;
    estimatedCost: string;
    timeline: string;
    confidenceLevel: string;
  }[];
}

export const DEMO_PITCH_SCENARIOS: Record<string, PitchScenario> = {
  'apex-dental': {
    targetIncrease: '+20%',
    targetMetric: 'Qualified Leads',
    strategies: [
      {
        name: 'Strategy A — Local Optimization & AI FAQ',
        focus: 'Most Efficient (Low Spend Add)',
        projectedResult: '+24 to +28 Qualified Leads / mo',
        estimatedCost: '+$450 / month',
        timeline: '2–3 weeks',
        confidenceLevel: '92% (High Correlation)'
      },
      {
        name: 'Strategy B — Google Ads Aggressive Capture',
        focus: 'Fastest Result Velocity',
        projectedResult: '+30 to +35 Leads / mo',
        estimatedCost: '+$1,800 / month',
        timeline: '5–7 days',
        confidenceLevel: '78% (Medium Confidence)'
      }
    ]
  }
};
