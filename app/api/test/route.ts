import { NextRequest, NextResponse } from 'next/server';
import { itineraryManagementEngine } from '@/lib/ml/itinerary-management-engine';

export async function GET(request: NextRequest) {
  try {
    console.log('[Test API] Starting comprehensive test suite');

    // Run the automated tests
    const testResults = await itineraryManagementEngine.runTests();

    console.log('[Test API] Test suite completed');

    return NextResponse.json({
      success: true,
      results: testResults,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Test API] Test execution failed:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testSuite, testName } = body;

    console.log(`[Test API] Running specific test: ${testSuite}:${testName}`);

    const result = await itineraryManagementEngine.testingFrameworkInstance.runSpecificTest(
      testSuite,
      testName,
      itineraryManagementEngine
    );

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Test API] Specific test execution failed:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}