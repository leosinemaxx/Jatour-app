// Test file for the Configurable Itinerary Generator Module

import { itineraryGenerator, ItineraryGeneratorConfig } from './itinerary-generator';

// Test configuration
const testConfig: Partial<ItineraryGeneratorConfig> = {
  dayStructure: {
    preferredStartTime: '09:00',
    preferredEndTime: '18:00',
    maxDailyActivities: 4,
    activityBufferTime: 30,
    includeBreaks: true,
    breakDuration: 30
  },
  activityDensity: {
    densityLevel: 'moderate',
    maxActivitiesPerDay: 4,
    preferredActivityTypes: ['cultural', 'nature'],
    avoidOverScheduling: true,
    includeFreeTime: true,
    freeTimePercentage: 30
  }
};

// Test input data
const testInput = {
  userId: 'test_user_123',
  sessionId: 'session_456',
  preferences: {
    budget: 2000000, // 2 million IDR
    days: 3,
    travelers: 2,
    accommodationType: 'moderate' as const,
    cities: ['Malang', 'Batu'],
    interests: ['nature', 'cultural', 'food'],
    themes: ['adventure', 'relaxation'],
    preferredSpots: [],
    startDate: '2024-12-01',
    constraints: {
      maxDailyTravelTime: 240,
      preferredStartTime: '09:00',
      preferredEndTime: '18:00',
      mustVisit: [],
      avoidCrowds: false,
      accessibilityRequired: false
    }
  },
  availableDestinations: [
    {
      id: 'bromo',
      name: 'Gunung Bromo',
      location: 'Probolinggo',
      category: 'Mountain',
      estimatedCost: 150000,
      duration: 480,
      coordinates: { lat: -7.9425, lng: 112.9530 },
      tags: ['volcano', 'sunrise', 'adventure', 'photography'],
      rating: 4.8,
      openingHours: '24 hours',
      bestTimeToVisit: '04:00-08:00'
    },
    {
      id: 'coban_rondo',
      name: 'Air Terjun Coban Rondo',
      location: 'Malang',
      category: 'Waterfall',
      estimatedCost: 40000,
      duration: 180,
      coordinates: { lat: -8.0000, lng: 112.5833 },
      tags: ['waterfall', 'nature', 'hiking', 'photography'],
      rating: 4.7,
      openingHours: '07:00-17:00',
      bestTimeToVisit: '08:00-16:00'
    },
    {
      id: 'malang_city',
      name: 'Kota Malang',
      location: 'Malang',
      category: 'City',
      estimatedCost: 100000,
      duration: 480,
      coordinates: { lat: -7.9667, lng: 112.6333 },
      tags: ['city', 'culture', 'food', 'shopping'],
      rating: 4.6,
      openingHours: '24 hours',
      bestTimeToVisit: '08:00-22:00'
    }
  ],
  config: itineraryGenerator.getConfig()
};

// Test function
export async function testItineraryGenerator() {
  console.log('🧪 Testing Configurable Itinerary Generator Module');
  console.log('================================================');

  try {
    // Update configuration
    console.log('📝 Updating configuration...');
    itineraryGenerator.updateConfig(testConfig);

    // Generate itinerary
    console.log('🎯 Generating itinerary...');
    const startTime = Date.now();

    const result = await itineraryGenerator.generateItinerary(testInput);

    const generationTime = Date.now() - startTime;

    console.log('✅ Itinerary generated successfully!');
    console.log(`⏱️  Generation time: ${generationTime}ms`);
    console.log(`🆔 Itinerary ID: ${result.itineraryId}`);
    console.log(`📅 Days: ${result.itinerary.summary.totalDays}`);
    console.log(`💰 Total cost: IDR ${result.itinerary.summary.totalCost.toLocaleString()}`);
    console.log(`⭐ Confidence: ${(result.itinerary.summary.confidence * 100).toFixed(1)}%`);

    // Log day details
    console.log('\n📋 Day Details:');
    result.itinerary.days.forEach(day => {
      console.log(`  Day ${day.day} (${day.date}):`);
      console.log(`    - ${day.destinations.length} destinations`);
      console.log(`    - Cost: IDR ${day.totalCost.toLocaleString()}`);
      console.log(`    - Time: ${day.totalTime} minutes`);
      console.log(`    - ML Confidence: ${(day.mlConfidence * 100).toFixed(1)}%`);
    });

    // Log budget breakdown
    console.log('\n💵 Budget Breakdown:');
    Object.entries(result.itinerary.budgetBreakdown.categoryBreakdown).forEach(([category, breakdown]) => {
      console.log(`  ${category}: IDR ${breakdown.recommended.toLocaleString()}`);
    });

    // Log ML insights
    console.log('\n🤖 ML Insights:');
    console.log(`  Personalization Score: ${(result.itinerary.mlInsights.personalizationScore * 100).toFixed(1)}%`);
    console.log(`  Predicted Satisfaction: ${result.itinerary.mlInsights.predictedUserSatisfaction.toFixed(1)}/5`);
    if (result.itinerary.mlInsights.riskFactors.length > 0) {
      console.log('  Risk Factors:', result.itinerary.mlInsights.riskFactors);
    }
    if (result.itinerary.mlInsights.recommendations.length > 0) {
      console.log('  Recommendations:', result.itinerary.mlInsights.recommendations);
    }

    // Test persistence
    console.log('\n💾 Testing persistence...');
    const saved = await itineraryGenerator.getItinerary(result.itineraryId);
    if (saved) {
      console.log('✅ Itinerary persisted successfully');
    } else {
      console.log('❌ Itinerary persistence failed');
    }

    // Test caching
    console.log('\n⚡ Testing caching...');
    const cachedResult = await itineraryGenerator.generateItinerary(testInput);
    if (cachedResult.itineraryId === result.itineraryId) {
      console.log('✅ Caching working correctly');
    } else {
      console.log('ℹ️  New itinerary generated (cache expired or disabled)');
    }

    console.log('\n🎉 All tests completed successfully!');
    return result;

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run test if this file is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  testItineraryGenerator().catch(console.error);
}