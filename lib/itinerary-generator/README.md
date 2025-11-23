# Configurable Itinerary Generator Module

A comprehensive, ML-powered itinerary generation system for the JaTour application. This module implements the complete design specification from `itinerary-generator-design-spec.md`, providing flexible, configurable itinerary generation with robust error handling and seamless integration with existing engines.

## Features

### 🏗️ Core Architecture
- **Modular Design**: Separated into distinct components for maintainability
- **Type Safety**: Full TypeScript implementation with Zod validation schemas
- **Error Recovery**: Comprehensive fallback strategies for robust operation
- **Persistence**: Hybrid storage with localStorage/database support

### 🤖 ML-Powered Generation
- **Personalization**: User behavior analysis and preference learning
- **Smart Recommendations**: ML-driven destination and activity suggestions
- **Dynamic Optimization**: Real-time cost and schedule optimization

### ⚙️ Configuration Options
- **Day Structure**: Customizable time windows, activity limits, and breaks
- **Cost Distribution**: Multiple budget allocation strategies
- **Activity Density**: Relaxed, moderate, or intense pacing options
- **Transportation**: Multi-modal transport optimization
- **Meal Planning**: Cuisine preferences and dietary accommodations

### 🔧 Integration Points
- **ItineraryManagementEngine**: State management and sync
- **BudgetEngine**: Cost optimization and recommendations
- **MLEngine**: User profiling and personalized suggestions

## Installation

The module is included in the JaTour application. Dependencies:
- `zod` for validation schemas
- Existing ML engines (itinerary-management-engine, budget-engine, ml-engine)

## Usage

### Basic Usage

```typescript
import { itineraryGenerator } from '@/lib/itinerary-generator';

// Configure the generator (optional)
itineraryGenerator.updateConfig({
  dayStructure: {
    preferredStartTime: '09:00',
    preferredEndTime: '18:00',
    maxDailyActivities: 4,
    includeBreaks: true
  },
  activityDensity: {
    densityLevel: 'moderate',
    includeFreeTime: true
  }
});

// Prepare input
const input = {
  userId: 'user123',
  sessionId: 'session456',
  preferences: {
    budget: 2000000, // IDR
    days: 3,
    travelers: 2,
    accommodationType: 'moderate',
    cities: ['Malang', 'Batu'],
    interests: ['nature', 'cultural'],
    startDate: '2024-12-01'
  },
  availableDestinations: [
    // Array of destination objects
  ],
  config: itineraryGenerator.getConfig()
};

// Generate itinerary
const result = await itineraryGenerator.generateItinerary(input);

if (result.success) {
  console.log(`Generated itinerary: ${result.itineraryId}`);
  console.log(`Total cost: IDR ${result.itinerary.summary.totalCost.toLocaleString()}`);
  console.log(`Days: ${result.itinerary.days.length}`);
}
```

### Advanced Configuration

```typescript
const customConfig = {
  dayStructure: {
    preferredStartTime: '08:00',
    preferredEndTime: '20:00',
    maxDailyActivities: 6,
    activityBufferTime: 30,
    includeBreaks: true,
    breakDuration: 45
  },
  costDistribution: {
    budgetAllocationStrategy: 'front-loaded',
    costVariabilityTolerance: 0.2,
    emergencyFundPercentage: 15
  },
  activityDensity: {
    densityLevel: 'intense',
    maxActivitiesPerDay: 5,
    preferredActivityTypes: ['adventure', 'nature'],
    avoidOverScheduling: true,
    includeFreeTime: true,
    freeTimePercentage: 25
  },
  transportation: {
    preferredModes: ['walking', 'public', 'taxi'],
    maxWalkingDistance: 2,
    budgetPriority: true,
    ecoFriendly: true
  },
  meals: {
    includeMeals: true,
    mealBudget: 150000,
    preferredCuisine: ['indonesian', 'international'],
    dietaryRestrictions: [],
    mealTiming: {
      breakfast: '07:00-09:00',
      lunch: '12:00-14:00',
      dinner: '18:00-20:00'
    }
  },
  performance: {
    enableCaching: true,
    cacheTimeout: 3600000,
    maxConcurrentGenerations: 5,
    timeoutMs: 30000
  },
  persistence: {
    primaryStorage: 'localStorage',
    backupEnabled: true,
    syncInterval: 30000
  }
};

itineraryGenerator.updateConfig(customConfig);
```

### Error Handling

```typescript
try {
  const result = await itineraryGenerator.generateItinerary(input);

  if (!result.success) {
    console.error('Generation failed:', result.errors);
    // Handle errors gracefully
  }

  if (result.warnings && result.warnings.length > 0) {
    console.warn('Warnings:', result.warnings);
    // Show warnings to user
  }

} catch (error) {
  console.error('Unexpected error:', error);
  // Fallback to manual itinerary creation
}
```

### Persistence Operations

```typescript
// Save itinerary
await itineraryGenerator.getItinerary(itineraryId);

// List all itineraries
const itineraryIds = await itineraryGenerator.listItineraries();

// Update configuration
itineraryGenerator.updateConfig(newConfig);
```

## API Reference

### ItineraryGenerator Class

#### Methods

- `generateItinerary(input: GeneratorInput): Promise<GeneratorOutput>`
  - Main method to generate itineraries
  - Includes full validation, ML processing, and error recovery

- `getItinerary(itineraryId: string): Promise<GeneratorOutput | null>`
  - Retrieve a previously generated itinerary

- `listItineraries(): Promise<string[]>`
  - Get list of all stored itinerary IDs

- `updateConfig(config: Partial<ItineraryGeneratorConfig>): void`
  - Update generator configuration

- `getConfig(): ItineraryGeneratorConfig`
  - Get current configuration

### Core Interfaces

#### ItineraryGeneratorConfig
Complete configuration interface with all customizable options.

#### GeneratorInput
Input structure for itinerary generation requests.

#### GeneratorOutput
Comprehensive output structure with itinerary data, metadata, and error information.

## Component Architecture

### Core Components

1. **ConfigurationManager**: Handles configuration validation and merging
2. **ValidationEngine**: Input/output validation using Zod schemas
3. **PersistenceManager**: Data persistence with fallback strategies
4. **DayStructureEngine**: Day planning and activity scheduling
5. **CostDistributionEngine**: Budget allocation and optimization
6. **ActivityDensityManager**: Activity pacing and density control
7. **TransportationModeSelector**: Transport optimization
8. **MealPreferenceEngine**: Dining recommendations
9. **ErrorRecoveryManager**: Fallback strategies and error recovery

### Data Flow

```
Input Validation → ML Processing → Configuration Application
    ↓
Destination Filtering → Day Structure Planning → Activity Scheduling
    ↓
Cost Distribution → Transportation Planning → Meal Integration
    ↓
ML Insights → Output Validation → Persistence
```

## Error Handling

The module implements comprehensive error handling with multiple recovery strategies:

- **Input Validation Errors**: Automatic correction with defaults
- **ML Engine Failures**: Cached profiles and default recommendations
- **Persistence Errors**: Fallback storage mechanisms
- **Timeout Errors**: Partial results with continuation support
- **Configuration Errors**: Graceful degradation to defaults

## Performance Considerations

- **Caching**: Intelligent caching with configurable timeouts
- **Background Processing**: Non-blocking generation for large requests
- **Memory Management**: Efficient data structures and cleanup
- **Scalability**: Stateless design for horizontal scaling

## Testing

Run the integration test:

```typescript
import { runIntegrationTest } from '@/lib/itinerary-generator/integration-test';

await runIntegrationTest();
```

## Integration with Existing Systems

The module seamlessly integrates with:

- **ItineraryManagementEngine**: For state management and incremental updates
- **BudgetEngine**: For cost calculations and optimization
- **MLEngine**: For user profiling and recommendations

## Future Enhancements

- Real-time pricing integration
- Advanced ML models for better personalization
- Mobile-optimized generation
- Multi-language support
- Advanced analytics and reporting

## License

Part of the JaTour application. See main project license for details.