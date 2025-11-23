// Budget-as-a-Plan (BaaP) API Route
// Provides REST API access to the BaaP system

import { NextRequest, NextResponse } from 'next/server';
import { baaPOrchestrator } from '@/lib/ml/baap-orchestrator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'generate_contract':
        const result = await baaPOrchestrator.generateBaaPContract(params);
        return NextResponse.json(result);

      case 'predict_adherence':
        const prediction = await baaPOrchestrator.predictAdherence(params);
        return NextResponse.json({ success: true, prediction });

      case 'optimize_plan':
        const optimization = await baaPOrchestrator.optimizePlan(params);
        return NextResponse.json({ success: true, optimization });

      case 'assess_risks':
        const riskAssessment = await baaPOrchestrator.assessRisks(params);
        return NextResponse.json({ success: true, riskAssessment });

      case 'generate_contingencies':
        const contingencies = await baaPOrchestrator.generateContingencies(params);
        return NextResponse.json({ success: true, contingencies });

      case 'validate_contract':
        const validation = baaPOrchestrator.validateContract(params.contract);
        return NextResponse.json({ success: true, validation });

      case 'sign_contract':
        const signedContract = baaPOrchestrator.signContract(params.contract, params.signature);
        return NextResponse.json({ success: true, contract: signedContract });

      case 'get_contract_summary':
        const summary = baaPOrchestrator.getContractSummary(params.contract);
        return NextResponse.json({ success: true, summary });

      case 'health_check':
        const health = await baaPOrchestrator.healthCheck();
        return NextResponse.json({ success: true, health });

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('[BaaP API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'health_check':
        const health = await baaPOrchestrator.healthCheck();
        return NextResponse.json({ success: true, health });

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('[BaaP API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}