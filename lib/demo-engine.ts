export interface DemoTenantProfile {
  id: string;
  name: string;
  industry: string;
  monthlySpend: number;
  baselineConversions: number;
  evidenceGrade: 'A' | 'B' | 'C' | 'D';
  historicalData: number[];
}

export const DEMO_TENANTS: DemoTenantProfile[] = [
  {
    id: 'apex-dental',
    name: 'Apex Dental Group',
    industry: 'Healthcare / Local Pack',
    monthlySpend: 4500,
    baselineConversions: 145,
    evidenceGrade: 'A',
    historicalData: [132, 138, 140, 142, 145]
  },
  {
    id: 'summit-legal',
    name: 'Summit Law Partners',
    industry: 'Professional Services',
    monthlySpend: 12000,
    baselineConversions: 88,
    evidenceGrade: 'B',
    historicalData: [78, 82, 80, 85, 88]
  },
  {
    id: 'vanguard-hvac',
    name: 'Vanguard HVAC & Plumbing',
    industry: 'Home Services',
    monthlySpend: 8200,
    baselineConversions: 210,
    evidenceGrade: 'A',
    historicalData: [190, 195, 202, 208, 210]
  }
];
