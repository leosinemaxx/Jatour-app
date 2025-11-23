import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // This endpoint provides WebSocket connection information
    // The actual WebSocket connection is handled by the backend gateway

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const wsUrl = backendUrl.replace(/^http/, 'ws') + '/expenses';

    return NextResponse.json({
      websocketUrl: wsUrl,
      namespace: '/expenses',
      events: {
        subscribeToExpenses: 'subscribeToExpenses',
        getExpenseAnalytics: 'getExpenseAnalytics',
        expenseCreated: 'expenseCreated',
        budgetThreshold: 'budgetThreshold',
        transactionSynced: 'transactionSynced'
      },
      message: 'Use the websocketUrl to establish WebSocket connection for real-time expense updates'
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to get real-time connection info' }, { status: 500 });
  }
}