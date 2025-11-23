import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const budgetId = searchParams.get('budgetId');
    const userId = searchParams.get('userId');

    if (!budgetId || !userId) {
      return NextResponse.json(
        { error: 'budgetId and userId are required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/burn-rate/${budgetId}?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching burn rate:', error);
    return NextResponse.json(
      { error: 'Failed to fetch burn rate data' },
      { status: 500 }
    );
  }
}