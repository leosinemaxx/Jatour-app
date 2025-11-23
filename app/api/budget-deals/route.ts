import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, itineraryId, trigger = 'manual_request', location, forceRefresh = false } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/budget-deal-orchestrator/orchestrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        itineraryId,
        trigger,
        location,
        forceRefresh
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching budget deals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budget deals' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const itineraryId = searchParams.get('itineraryId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/budget-deal-orchestrator/manual-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        itineraryId,
        location: searchParams.get('location'),
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching budget deals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budget deals' },
      { status: 500 }
    );
  }
}