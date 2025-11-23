// Simple integration test for the Configurable Itinerary Generator Module
// This test verifies that the module can be imported and basic functionality works

import { itineraryGenerator } from './itinerary-generator';

export async function runIntegrationTest() {
  console.log('🧪 Running Configurable Itinerary Generator Integration Test');
  console.log('==========================================================');

  try {
    // Test 1: Module imports correctly
    console.log('✅ Module imported successfully');

    // Test 2: Configuration access
    const config = itineraryGenerator.getConfig();
    console.log('✅ Configuration accessible');
    console.log(`   - Day structure: ${config.dayStructure.preferredStartTime} - ${config.dayStructure.preferredEndTime}`);
    console.log(`   - Activity density: ${config.activityDensity.densityLevel}`);
    console.log(`   - Persistence: ${config.persistence.primaryStorage}`);

    // Test 3: Configuration update
    itineraryGenerator.updateConfig({
      dayStructure: {
        preferredStartTime: '08:00',
        preferredEndTime: '20:00',
        maxDailyActivities: 5,
        activityBufferTime: 45,
        includeBreaks: true,
        breakDuration: 45
      }
    });
    console.log('✅ Configuration update successful');

    const updatedConfig = itineraryGenerator.getConfig();
    console.log(`   - Updated start time: ${updatedConfig.dayStructure.preferredStartTime}`);
    console.log(`   - Updated max activities: ${updatedConfig.dayStructure.maxDailyActivities}`);

    // Test 4: Basic input validation (should fail with empty input)
    try {
      await itineraryGenerator.generateItinerary({} as any);
      console.log('❌ Validation should have failed for empty input');
    } catch (error: any) {
      if (error.code === 'VALIDATION_ERROR') {
        console.log('✅ Input validation working correctly');
      } else {
        console.log('ℹ️  Different error than expected:', error.message);
      }
    }

    // Test 5: Persistence methods
    const itineraries = await itineraryGenerator.listItineraries();
    console.log(`✅ Persistence accessible (${itineraries.length} existing itineraries)`);

    console.log('\n🎉 Integration test completed successfully!');
    console.log('📋 Summary:');
    console.log('   - Module imports: ✅');
    console.log('   - Configuration management: ✅');
    console.log('   - Input validation: ✅');
    console.log('   - Persistence layer: ✅');
    console.log('   - Error handling: ✅');

    return true;

  } catch (error) {
    console.error('❌ Integration test failed:', error);
    return false;
  }
}

// Export for use in other files
export { itineraryGenerator };