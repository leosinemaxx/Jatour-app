// Configurable Itinerary Generator Module - Main Exports
// This module provides a complete, ML-powered itinerary generation system

export {
  ItineraryGenerator,
  itineraryGenerator,
  ConfigurationManager,
  ValidationEngine,
  PersistenceManager,
  DayStructureEngine,
  CostDistributionEngine,
  ActivityDensityManager,
  TransportationModeSelector,
  MealPreferenceEngine,
  ErrorRecoveryManager
} from './itinerary-generator';

export type {
  ItineraryGeneratorConfig,
  GeneratorInput,
  GeneratorOutput
} from './itinerary-generator';