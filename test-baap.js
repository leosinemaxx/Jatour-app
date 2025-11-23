// Simple test for BaaP system
// Run with: node test-baap.js

const { baaPOrchestrator } = require('./lib/ml/baap-orchestrator.ts');

async function testBaaP() {
  console.log('Testing BaaP system...');

  try {
    // Test health check
    const health = await baaPOrchestrator.healthCheck();
    console.log('Health check result:', health);

    // Test basic contract generation with minimal data
    const testInput = {
      userId: 'test-user-123',
      preferences: {
        budget: 5000000,
        days: 3,
        travelers: 2,
        accommodationType: 'moderate',
        cities: ['Jakarta', 'Bandung'],
        interests: ['culture', 'food'],
        themes: ['adventure'],
        startDate: '2025-12-01',
        constraints: {}
      },
      guaranteeTarget: 0.95,
      maxBudgetIncrease: 0.2
    };

    console.log('Testing contract generation...');
    const result = await baaPOrchestrator.generateBaaPContract(testInput);

    console.log('Contract generation result:', {
      success: result.success,
      adherenceGuarantee: result.summary?.adherenceGuarantee,
      totalBudget: result.summary?.totalBudget,
      riskLevel: result.summary?.riskLevel,
      errors: result.errors,
      warnings: result.warnings
    });

    if (result.success && result.contract) {
      console.log('Contract ID:', result.contract.contractId);
      console.log('Guarantee level:', result.contract.guarantee.level);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testBaaP();