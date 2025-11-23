import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const date = searchParams.get('date');
    const passengers = searchParams.get('passengers');
    const vehicleType = searchParams.get('vehicleType') as 'car' | 'motorcycle' | 'taxi' | 'bus';
    const budget = searchParams.get('budget');

    if (!from || !to) {
      return NextResponse.json(
        {
          error: 'Missing required parameters',
          required: ['from', 'to']
        },
        { status: 400 }
      );
    }

    // Call NestJS backend
    const backendUrl = `${process.env.NESTJS_API_URL || 'http://localhost:3001'}/price-comparison/transportation`;

    const requestBody = {
      from,
      to,
      date: date || undefined,
      passengers: passengers ? parseInt(passengers) : undefined,
      vehicleType: vehicleType || undefined,
      budget: budget ? parseInt(budget) : undefined,
    };

    console.log('🚗 Transportation comparison request:', requestBody);

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Transportation comparison successful:', data.length, 'results');

    return NextResponse.json(data);

  } catch (error) {
    console.error('🚨 Transportation comparison API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to compare transportation prices',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Call NestJS backend
    const backendUrl = `${process.env.NESTJS_API_URL || 'http://localhost:3001'}/price-comparison/transportation`;

    console.log('🚗 Transportation comparison POST request:', body);

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Transportation comparison successful:', data.length, 'results');

    return NextResponse.json(data);

  } catch (error) {
    console.error('🚨 Transportation comparison API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to compare transportation prices',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}