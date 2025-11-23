import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const location = searchParams.get('location');
    const checkInDate = searchParams.get('checkInDate');
    const checkOutDate = searchParams.get('checkOutDate');
    const guests = searchParams.get('guests');
    const budget = searchParams.get('budget');

    if (!location || !checkInDate || !checkOutDate || !guests) {
      return NextResponse.json(
        {
          error: 'Missing required parameters',
          required: ['location', 'checkInDate', 'checkOutDate', 'guests']
        },
        { status: 400 }
      );
    }

    // Call NestJS backend
    const backendUrl = `${process.env.NESTJS_API_URL || 'http://localhost:3001'}/price-comparison/hotels`;

    const requestBody = {
      location,
      checkInDate,
      checkOutDate,
      guests: parseInt(guests),
      budget: budget ? parseInt(budget) : undefined,
    };

    console.log('🔍 Hotel comparison request:', requestBody);

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
    console.log('✅ Hotel comparison successful:', data.length, 'results');

    return NextResponse.json(data);

  } catch (error) {
    console.error('🚨 Hotel comparison API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to compare hotel prices',
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
    const backendUrl = `${process.env.NESTJS_API_URL || 'http://localhost:3001'}/price-comparison/hotels`;

    console.log('🔍 Hotel comparison POST request:', body);

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
    console.log('✅ Hotel comparison successful:', data.length, 'results');

    return NextResponse.json(data);

  } catch (error) {
    console.error('🚨 Hotel comparison API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to compare hotel prices',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}