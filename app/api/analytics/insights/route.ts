import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const period = searchParams.get('period') || 'month';
  const compareWith = searchParams.get('compareWith');
  const categories = searchParams.get('categories');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    // Forward to NestJS backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const backendParams = new URLSearchParams({
      period,
      ...(compareWith && { compareWith }),
      ...(categories && { categories })
    });

    const response = await fetch(`${backendUrl}/analytics/insights/${userId}?${backendParams}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Backend service error' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics insights' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, period = 'month', categories, compareWith } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Forward to NestJS backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const backendParams = new URLSearchParams({
      period,
      ...(compareWith && { compareWith }),
      ...(categories && { categories: categories.join(',') })
    });

    const response = await fetch(`${backendUrl}/analytics/insights/${userId}?${backendParams}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Backend service error' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to generate analytics insights' }, { status: 500 });
  }
}