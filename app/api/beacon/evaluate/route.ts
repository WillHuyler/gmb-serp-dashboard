import { NextRequest, NextResponse } from 'next/server';
import { DecisionEngine } from '../../../lib/decision-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenant_id, client_id } = body;

    if (!tenant_id || !client_id) {
      return NextResponse.json({ error: 'Missing tenant_id or client_id' }, { status: 400 });
    }

    // Run anomaly rules against SERP history
    const interventions = await DecisionEngine.evaluateRankAnomalies(tenant_id, client_id);

    // Persist alerts to real-time signals stream
    await DecisionEngine.persistInterventions(interventions);

    return NextResponse.json({
      success: true,
      evaluated_count: interventions.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Evaluation engine failure' }, { status: 500 });
  }
}
