
// Configurable Itinerary Generator Module
// Implements the complete itinerary generation pipeline with ML-powered personalization

import { z } from 'zod';
import { itineraryManagementEngine, ItineraryState } from '../ml/itinerary-management-engine';
import { budgetEngine, SmartBudgetRecommendation } from '../ml/intelligent-budget-engine';
import { mlEngine, UserPreferenceProfile } from '../ml/ml-engine';

// Core Interfaces from Design Specification

export interface ItineraryGeneratorConfig {
  // Day Structure Configuration
  dayStructure: {
    preferredStartTime: string; // "08:00"
    preferredEndTime: string; // "18:00"
    maxDailyActivities: number; // 4-8
    activityBufferTime: number; // minutes between activities
    includeBreaks: boolean;
    breakDuration: number; // minutes
  };

  // Cost Distribution
  costDistribution: {
    budgetAllocationStrategy: 'equal' | 'front-loaded' | 'back-loaded' | 'peak-day';
    costVariabilityTolerance: number; // 0-1
    emergencyFundPercentage: number; // 5-15%
    currency: string; // "IDR", "USD", etc.
  };

  // Activity Density
  activityDensity: {
    densityLevel: 'relaxed' | 'moderate' | 'intense';
    maxActivitiesPerDay: number;
    preferredActivityTypes: string[];
    avoidOverScheduling: boolean;
    includeFreeTime: boolean;
    freeTimePercentage: number; // 20-40%
  };

  // Transportation Modes
  transportation: {
    preferredModes: ('walking' | 'public' | 'taxi' | 'rental' | 'private')[];
    maxWalkingDistance: number; // km
    budgetPriority: boolean;
    ecoFriendly: boolean;
    accessibilityRequired: boolean;
  };

  // Meal Preferences
  meals: {
    includeMeals: boolean;
    mealBudget: number;
    preferredCuisine: string[];
    dietaryRestrictions: string[];
    mealTiming: {
      breakfast: string; // "07:00-09:00"
      lunch: string; // "12:00-14:00"
      dinner: string; // "18:00-20:00"
    };
  };

  // Performance & Scalability
  performance: {
    enableCaching: boolean;
    cacheTimeout: number; // ms
    maxConcurrentGenerations: number;
    timeoutMs: number;
    enableBackgroundProcessing: boolean;
  };

  // Persistence
  persistence: {
    primaryStorage: 'localStorage' | 'database' | 'hybrid';
    backupEnabled: boolean;
    syncInterval: number; // ms
    maxRetries: number;
  };
}

export interface GeneratorInput {
  userId: string;
  sessionId: string;
  preferences: {
    budget: number;
    days: number;
    travelers: number;
    accommodationType: 'budget' | 'moderate' | 'luxury';
    cities: string[];
    interests: string[];
    themes: string[];
    preferredSpots: string[];
    startDate: string;
    constraints?: {
      maxDailyTravelTime?: number;
      preferredStartTime?: string;
      preferredEndTime?: string;
      mustVisit?: string[];
      avoidCrowds?: boolean;
      accessibilityRequired?: boolean;
    };
  };
  availableDestinations: Array<{
    id: string;
    name: string;
    location: string;
    category: string;
    estimatedCost: number;
    duration: number;
    coordinates?: { lat: number; lng: number };
    tags: string[];
    rating: number;
    openingHours?: string;
    bestTimeToVisit?: string;
  }>;
  config: ItineraryGeneratorConfig;
  context?: {
    previousItineraryId?: string;
    userBehaviorData?: any[];
    weatherData?: any;
    realTimeUpdates?: any;
  };
}

export interface GeneratorOutput {
  success: boolean;
  itineraryId: string;
  itinerary: {
    summary: {
      totalDays: number;
      totalCost: number;
      totalDuration: number;
      confidence: number;
      generatedAt: number;
    };
    days: Array<{
      day: number;
      date: string;
      theme?: string;
      destinations: Array<{
        id: string;
        name: string;
        category: string;
        location: string;
        coordinates: { lat: number; lng: number };
        scheduledTime: string;
        duration: number;
        estimatedCost: number;
        rating: number;
        tags: string[];
        mlScore: number;
        predictedSatisfaction: number;
        crowdLevel?: 'low' | 'medium' | 'high';
        weatherSuitability?: number;
        bestTimeToVisit?: string;
        openingHours?: string;
        alternatives?: Array<{
          id: string;
          name: string;
          reason: string;
        }>;
      }>;
      meals?: Array<{
        type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
        time: string;
        recommendation: string;
        estimatedCost: number;
        location?: string;
      }>;
      accommodation?: {
        name: string;
        type: string;
        cost: number;
        location: string;
        rating: number;
        amenities: string[];
      };
      transportation?: {
        type: string;
        cost: number;
        route: string;
        duration: number;
        ecoFriendly: boolean;
      };
      totalCost: number;
      totalTime: number;
      mlConfidence: number;
      optimizationReasons: string[];
      freeTimeSlots?: Array<{
        start: string;
        end: string;
        duration: number;
        suggestion?: string;
      }>;
    }>;
    budgetBreakdown: {
      totalBudget: number;
      categoryBreakdown: {
        accommodation: { allocated: number; recommended: number; savings: number };
        transportation: { allocated: number; recommended: number; savings: number };
        food: { allocated: number; recommended: number; savings: number };
        activities: { allocated: number; recommended: number; savings: number };
        miscellaneous: { allocated: number; recommended: number; savings: number };
      };
      optimizations: Array<{
        type: string;
        category: string;
        potentialSavings: number;
        description: string;
        impact: 'low' | 'medium' | 'high';
      }>;
      confidence: number;
      reasoning: string[];
    };
    mlInsights: {
      personalizationScore: number;
      predictedUserSatisfaction: number;
      riskFactors: string[];
      recommendations: string[];
    };
    optimization: {
      timeOptimization: number;
      costOptimization: number;
      satisfactionOptimization: number;
      reasoning: string[];
    };
    costVariability: {
      seasonalAdjustments: Array<{
        destinationId: string;
        season: 'low' | 'shoulder' | 'high' | 'peak';
        multiplier: number;
        reason: string;
      }>;
      demandFactors: Array<{
        destinationId: string;
        demandLevel: 'low' | 'medium' | 'high' | 'extreme';
        multiplier: number;
        occupancyRate?: number;
      }>;
      currencyRates: Array<{
        from: string;
        to: string;
        rate: number;
        lastUpdated: number;
      }>;
      appliedDiscounts: Array<{
        type: string;
        percentage: number;
        applicableTo: string[];
        conditions: string;
      }>;
      realTimeUpdates: Array<{
        destinationId: string;
        originalPrice: number;
        currentPrice: number;
        changeReason: string;
        lastUpdated: number;
      }>;
    };
  };
  metadata: {
    generationTime: number;
    configUsed: ItineraryGeneratorConfig;
    engineVersions: {
      itinerary: string;
      budget: string;
      ml: string;
    };
    performanceMetrics: {
      cacheHits: number;
      apiCalls: number;
      processingTime: number;
    };
  };
  errors?: Array<{
    code: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
    recoverable: boolean;
  }>;
  warnings?: Array<{
    code: string;
    message: string;
    suggestion?: string;
  }>;
}

// Zod Validation Schemas

const ItineraryGeneratorConfigSchema = z.object({
  dayStructure: z.object({
    preferredStartTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    preferredEndTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    maxDailyActivities: z.number().min(1).max(10),
    activityBufferTime: z.number().min(0).max(120),
    includeBreaks: z.boolean(),
    breakDuration: z.number().min(15).max(120)
  }),
  costDistribution: z.object({
    budgetAllocationStrategy: z.enum(['equal', 'front-loaded', 'back-loaded', 'peak-day']),
    costVariabilityTolerance: z.number().min(0).max(1),
    emergencyFundPercentage: z.number().min(5).max(15),
    currency: z.string().min(1)
  }),
  activityDensity: z.object({
    densityLevel: z.enum(['relaxed', 'moderate', 'intense']),
    maxActivitiesPerDay: z.number().min(1).max(10),
    preferredActivityTypes: z.array(z.string()),
    avoidOverScheduling: z.boolean(),
    includeFreeTime: z.boolean(),
    freeTimePercentage: z.number().min(20).max(40)
  }),
  transportation: z.object({
    preferredModes: z.array(z.enum(['walking', 'public', 'taxi', 'rental', 'private'])),
    maxWalkingDistance: z.number().min(0),
    budgetPriority: z.boolean(),
    ecoFriendly: z.boolean(),
    accessibilityRequired: z.boolean()
  }),
  meals: z.object({
    includeMeals: z.boolean(),
    mealBudget: z.number().min(0),
    preferredCuisine: z.array(z.string()),
    dietaryRestrictions: z.array(z.string()),
    mealTiming: z.object({
      breakfast: z.string(),
      lunch: z.string(),
      dinner: z.string()
    })
  }),
  performance: z.object({
    enableCaching: z.boolean(),
    cacheTimeout: z.number().min(0),
    maxConcurrentGenerations: z.number().min(1),
    timeoutMs: z.number().min(1000),
    enableBackgroundProcessing: z.boolean()
  }),
  persistence: z.object({
    primaryStorage: z.enum(['localStorage', 'database', 'hybrid']),
    backupEnabled: z.boolean(),
    syncInterval: z.number().min(1000),
    maxRetries: z.number().min(0)
  })
});

const GeneratorInputSchema = z.object({
  userId: z.string().min(1),
  sessionId: z.string().min(1),
  preferences: z.object({
    budget: z.number().positive(),
    days: z.number().min(1).max(30),
    travelers: z.number().min(1).max(20),
    accommodationType: z.enum(['budget', 'moderate', 'luxury']),
    cities: z.array(z.string()),
    interests: z.array(z.string()),
    themes: z.array(z.string()),
    preferredSpots: z.array(z.string()),
    startDate: z.string(),
    constraints: z.object({
      maxDailyTravelTime: z.number().optional(),
      preferredStartTime: z.string().optional(),
      preferredEndTime: z.string().optional(),
      mustVisit: z.array(z.string()).optional(),
      avoidCrowds: z.boolean().optional(),
      accessibilityRequired: z.boolean().optional()
    }).optional()
  }),
  availableDestinations: z.array(z.object({
    id: z.string(),
    name: z.string(),
    location: z.string(),
    category: z.string(),
    estimatedCost: z.number(),
    duration: z.number(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number()
    }).optional(),
    tags: z.array(z.string()),
    rating: z.number(),
    openingHours: z.string().optional(),
    bestTimeToVisit: z.string().optional()
  })),
  config: ItineraryGeneratorConfigSchema,
  context: z.object({
    previousItineraryId: z.string().optional(),
    userBehaviorData: z.array(z.any()).optional(),
    weatherData: z.any().optional(),
    realTimeUpdates: z.any().optional()
  }).optional()
});

const GeneratorOutputSchema = z.object({
  success: z.boolean(),
  itineraryId: z.string(),
  itinerary: z.object({
    summary: z.object({
      totalDays: z.number(),
      totalCost: z.number(),
      totalDuration: z.number(),
      confidence: z.number(),
      generatedAt: z.number()
    }),
    days: z.array(z.object({
      day: z.number(),
      date: z.string(),
      theme: z.string().optional(),
      destinations: z.array(z.object({
        id: z.string(),
        name: z.string(),
        category: z.string(),
        location: z.string(),
        coordinates: z.object({
          lat: z.number(),
          lng: z.number()
        }),
        scheduledTime: z.string(),
        duration: z.number(),
        estimatedCost: z.number(),
        rating: z.number(),
        tags: z.array(z.string()),
        mlScore: z.number(),
        predictedSatisfaction: z.number(),
        crowdLevel: z.enum(['low', 'medium', 'high']).optional(),
        weatherSuitability: z.number().optional(),
        bestTimeToVisit: z.string().optional(),
        openingHours: z.string().optional(),
        alternatives: z.array(z.object({
          id: z.string(),
          name: z.string(),
          reason: z.string()
        })).optional()
      })),
      meals: z.array(z.object({
        type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
        time: z.string(),
        recommendation: z.string(),
        estimatedCost: z.number(),
        location: z.string().optional()
      })).optional(),
      accommodation: z.object({
        name: z.string(),
        type: z.string(),
        cost: z.number(),
        location: z.string(),
        rating: z.number(),
        amenities: z.array(z.string())
      }).optional(),
      transportation: z.object({
        type: z.string(),
        cost: z.number(),
        route: z.string(),
        duration: z.number(),
        ecoFriendly: z.boolean()
      }).optional(),
      totalCost: z.number(),
      totalTime: z.number(),
      mlConfidence: z.number(),
      optimizationReasons: z.array(z.string()),
      freeTimeSlots: z.array(z.object({
        start: z.string(),
        end: z.string(),
        duration: z.number(),
        suggestion: z.string().optional()
      })).optional()
    })),
    budgetBreakdown: z.object({
      totalBudget: z.number(),
      categoryBreakdown: z.object({
        accommodation: z.object({
          allocated: z.number(),
          recommended: z.number(),
          savings: z.number()
        }),
        transportation: z.object({
          allocated: z.number(),
          recommended: z.number(),
          savings: z.number()
        }),
        food: z.object({
          allocated: z.number(),
          recommended: z.number(),
          savings: z.number()
        }),
        activities: z.object({
          allocated: z.number(),
          recommended: z.number(),
          savings: z.number()
        }),
        miscellaneous: z.object({
          allocated: z.number(),
          recommended: z.number(),
          savings: z.number()
        })
      }),
      optimizations: z.array(z.object({
        type: z.string(),
        category: z.string(),
        potentialSavings: z.number(),
        description: z.string(),
        impact: z.enum(['low', 'medium', 'high'])
      })),
      confidence: z.number(),
      reasoning: z.array(z.string())
    }),
    mlInsights: z.object({
      personalizationScore: z.number(),
      predictedUserSatisfaction: z.number(),
      riskFactors: z.array(z.string()),
      recommendations: z.array(z.string())
    }),
    optimization: z.object({
      timeOptimization: z.number(),
      costOptimization: z.number(),
      satisfactionOptimization: z.number(),
      reasoning: z.array(z.string())
    }),
    costVariability: z.object({
      seasonalAdjustments: z.array(z.object({
        destinationId: z.string(),
        season: z.enum(['low', 'shoulder', 'high', 'peak']),
        multiplier: z.number(),
        reason: z.string()
      })),
      demandFactors: z.array(z.object({
        destinationId: z.string(),
        demandLevel: z.enum(['low', 'medium', 'high', 'extreme']),
        multiplier: z.number(),
        occupancyRate: z.number().optional()
      })),
      currencyRates: z.array(z.object({
        from: z.string(),
        to: z.string(),
        rate: z.number(),
        lastUpdated: z.number()
      })),
      appliedDiscounts: z.array(z.object({
        type: z.string(),
        percentage: z.number(),
        applicableTo: z.array(z.string()),
        conditions: z.string()
      })),
      realTimeUpdates: z.array(z.object({
        destinationId: z.string(),
        originalPrice: z.number(),
        currentPrice: z.number(),
        changeReason: z.string(),
        lastUpdated: z.number()
      }))
    })
  }),
  metadata: z.object({
    generationTime: z.number(),
    configUsed: ItineraryGeneratorConfigSchema,
    engineVersions: z.object({
      itinerary: z.string(),
      budget: z.string(),
      ml: z.string()
    }),
    performanceMetrics: z.object({
      cacheHits: z.number(),
      apiCalls: z.number(),
      processingTime: z.number()
    })
  }),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    severity: z.enum(['low', 'medium', 'high']),
    recoverable: z.boolean()
  })).optional(),
  warnings: z.array(z.object({
    code: z.string(),
    message: z.string(),
    suggestion: z.string().optional()
  })).optional()
});

// Core Components Implementation

export class ConfigurationManager {
  private configCache = new Map<string, ItineraryGeneratorConfig>();

  validateAndNormalizeConfig(config: any): { isValid: boolean; config?: ItineraryGeneratorConfig; errors?: string[] } {
    try {
      const validatedConfig = ItineraryGeneratorConfigSchema.parse(config);
      return { isValid: true, config: validatedConfig };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
        return { isValid: false, errors };
      }
      return { isValid: false, errors: ['Unknown validation error'] };
    }
  }

  getDefaultConfig(): ItineraryGeneratorConfig {
    return {
      dayStructure: {
        preferredStartTime: '08:00',
        preferredEndTime: '18:00',
        maxDailyActivities: 4,
        activityBufferTime: 30,
        includeBreaks: true,
        breakDuration: 30
      },
      costDistribution: {
        budgetAllocationStrategy: 'equal',
        costVariabilityTolerance: 0.2,
        emergencyFundPercentage: 10,
        currency: 'IDR'
      },
      activityDensity: {
        densityLevel: 'moderate',
        maxActivitiesPerDay: 4,
        preferredActivityTypes: [],
        avoidOverScheduling: true,
        includeFreeTime: true,
        freeTimePercentage: 30
      },
      transportation: {
        preferredModes: ['walking', 'public', 'taxi'],
        maxWalkingDistance: 2,
        budgetPriority: true,
        ecoFriendly: false,
        accessibilityRequired: false
      },
      meals: {
        includeMeals: true,
        mealBudget: 150000,
        preferredCuisine: [],
        dietaryRestrictions: [],
        mealTiming: {
          breakfast: '07:00-09:00',
          lunch: '12:00-14:00',
          dinner: '18:00-20:00'
        }
      },
      performance: {
        enableCaching: true,
        cacheTimeout: 3600000, // 1 hour
        maxConcurrentGenerations: 5,
        timeoutMs: 30000,
        enableBackgroundProcessing: false
      },
      persistence: {
        primaryStorage: 'localStorage',
        backupEnabled: true,
        syncInterval: 30000,
        maxRetries: 3
      }
    };
  }

  mergeConfigs(base: ItineraryGeneratorConfig, overrides: Partial<ItineraryGeneratorConfig>): ItineraryGeneratorConfig {
    return {
      ...base,
      ...overrides,
      dayStructure: { ...base.dayStructure, ...overrides.dayStructure },
      costDistribution: { ...base.costDistribution, ...overrides.costDistribution },
      activityDensity: { ...base.activityDensity, ...overrides.activityDensity },
      transportation: { ...base.transportation, ...overrides.transportation },
      meals: { ...base.meals, ...overrides.meals },
      performance: { ...base.performance, ...overrides.performance },
      persistence: { ...base.persistence, ...overrides.persistence }
    };
  }
}

export class ValidationEngine {
  validateInput(input: any): { isValid: boolean; input?: GeneratorInput; errors?: string[] } {
    try {
      const validatedInput = GeneratorInputSchema.parse(input);
      return { isValid: true, input: validatedInput };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
        return { isValid: false, errors };
      }
      return { isValid: false, errors: ['Unknown validation error'] };
    }
  }

  validateOutput(output: any): { isValid: boolean; output?: GeneratorOutput; errors?: string[] } {
    try {
      const validatedOutput = GeneratorOutputSchema.parse(output);
      return { isValid: true, output: validatedOutput };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
        return { isValid: false, errors };
      }
      return { isValid: false, errors: ['Unknown validation error'] };
    }
  }

  validateItineraryStructure(itinerary: any): { isValid: boolean; errors?: string[] } {
    const errors: string[] = [];

    if (!itinerary.days || !Array.isArray(itinerary.days)) {
      errors.push('Itinerary must have days array');
      return { isValid: false, errors };
    }

    if (itinerary.days.length === 0) {
      errors.push('Itinerary must have at least one day');
      return { isValid: false, errors };
    }

    for (let i = 0; i < itinerary.days.length; i++) {
      const day = itinerary.days[i];

      if (!day.destinations || !Array.isArray(day.destinations)) {
        errors.push(`Day ${i + 1} must have destinations array`);
      }

      if (day.destinations && day.destinations.length === 0) {
        errors.push(`Day ${i + 1} must have at least one destination`);
      }
    }

    return { isValid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  }
}

export class PersistenceManager {
  private config: ItineraryGeneratorConfig['persistence'];
  private indexedDB: IDBDatabase | null = null;
  private dbInitialized: boolean = false;
  private dbInitPromise: Promise<void> | null = null;

  constructor(config: ItineraryGeneratorConfig['persistence']) {
    this.config = config;
    this.initializeIndexedDB();
  }

  private async initializeIndexedDB(): Promise<void> {
    if (this.dbInitPromise) return this.dbInitPromise;

    this.dbInitPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        console.warn('[PersistenceManager] IndexedDB not supported or not in browser environment, falling back to localStorage');
        this.dbInitialized = false;
        resolve();
        return;
      }

      const request = indexedDB.open('ItineraryDB', 1);

      request.onerror = () => {
        console.warn('[PersistenceManager] IndexedDB initialization failed:', request.error);
        this.dbInitialized = false;
        resolve(); // Don't reject, just fall back to localStorage
      };

      request.onsuccess = (event) => {
        this.indexedDB = (event.target as IDBOpenDBRequest).result;
        this.dbInitialized = true;
        console.log('[PersistenceManager] IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('itineraries')) {
          const store = db.createObjectStore('itineraries', { keyPath: 'id' });
          store.createIndex('userId', 'userId', { unique: false });
          store.createIndex('savedAt', 'savedAt', { unique: false });
        }
      };
    });

    return this.dbInitPromise;
  }

  async save(itineraryId: string, data: GeneratorOutput): Promise<void> {
    const key = `itinerary_generator_${itineraryId}`;
    const serialized = JSON.stringify({
      id: itineraryId,
      ...data,
      savedAt: Date.now(),
      version: '1.0'
    });

    let primarySuccess = false;
    let backupSuccess = false;

    try {
      // Primary storage with retry mechanism
      for (let attempt = 1; attempt <= Math.min(this.config.maxRetries, 3); attempt++) {
        try {
          if (this.config.primaryStorage === 'database' && this.dbInitialized && this.indexedDB) {
            await this.saveToIndexedDB(itineraryId, JSON.parse(serialized));
            primarySuccess = true;
            console.log(`[PersistenceManager] Saved to IndexedDB: ${itineraryId} (attempt ${attempt})`);
            break;
          } else if (this.config.primaryStorage === 'localStorage' || this.config.primaryStorage === 'hybrid') {
            localStorage.setItem(key, serialized);
            primarySuccess = true;
            console.log(`[PersistenceManager] Saved to localStorage: ${itineraryId} (attempt ${attempt})`);
            break;
          }
        } catch (error) {
          console.warn(`[PersistenceManager] Primary storage attempt ${attempt} failed:`, error);
          if (attempt === Math.min(this.config.maxRetries, 3)) {
            throw error;
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
      }

      // Backup storage for hybrid mode
      if (this.config.backupEnabled && this.config.primaryStorage === 'hybrid') {
        try {
          if (this.dbInitialized && this.indexedDB && primarySuccess) {
            // If primary is localStorage, backup to IndexedDB
            await this.saveToIndexedDB(itineraryId, JSON.parse(serialized));
            backupSuccess = true;
          } else if (!this.dbInitialized || !this.indexedDB) {
            // If IndexedDB not available, backup to sessionStorage
            await this.saveToBackup(key, serialized);
            backupSuccess = true;
          }
        } catch (backupError) {
          console.warn('[PersistenceManager] Backup storage failed:', backupError);
          // Don't throw, backup failure shouldn't fail the whole operation
        }
      }

      if (!primarySuccess) {
        throw new Error('All primary storage attempts failed');
      }

      console.log(`[PersistenceManager] Successfully saved itinerary ${itineraryId}`);
    } catch (error) {
      console.error(`[PersistenceManager] Failed to save itinerary ${itineraryId}:`, error);
      throw new Error('Failed to persist itinerary data');
    }
  }

  async load(itineraryId: string): Promise<GeneratorOutput | null> {
    const key = `itinerary_generator_${itineraryId}`;

    try {
      let data = null;

      // Try primary storage first
      if (this.config.primaryStorage === 'database' && this.dbInitialized && this.indexedDB) {
        data = await this.loadFromIndexedDB(itineraryId);
      } else if (this.config.primaryStorage === 'localStorage' || this.config.primaryStorage === 'hybrid') {
        const stored = localStorage.getItem(key);
        if (stored) {
          data = JSON.parse(stored);
        }
      }

      // Try backup storage if primary failed
      if (!data && this.config.backupEnabled) {
        if (this.config.primaryStorage === 'hybrid') {
          // Try IndexedDB as backup if primary was localStorage
          if (this.dbInitialized && this.indexedDB) {
            data = await this.loadFromIndexedDB(itineraryId);
          }
        }
        // Try sessionStorage backup
        if (!data) {
          data = await this.loadFromBackup(key);
        }
      }

      if (data && this.isValidPersistedData(data)) {
        console.log(`[PersistenceManager] Loaded itinerary ${itineraryId}`);
        return data;
      }

      return null;
    } catch (error) {
      console.error(`[PersistenceManager] Failed to load itinerary ${itineraryId}:`, error);
      return null;
    }
  }

  private async saveToIndexedDB(itineraryId: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.indexedDB) {
        reject(new Error('IndexedDB not initialized'));
        return;
      }

      const transaction = this.indexedDB.transaction(['itineraries'], 'readwrite');
      const store = transaction.objectStore('itineraries');
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async loadFromIndexedDB(itineraryId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.indexedDB) {
        reject(new Error('IndexedDB not initialized'));
        return;
      }

      const transaction = this.indexedDB.transaction(['itineraries'], 'readonly');
      const store = transaction.objectStore('itineraries');
      const request = store.get(itineraryId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async saveToBackup(key: string, data: string): Promise<void> {
    // Enhanced backup: try multiple fallback storage options
    const backupOptions = [
      () => sessionStorage.setItem(`backup_${key}`, data),
      () => localStorage.setItem(`backup_${key}`, data),
      // Could add more backup options like sending to server
    ];

    for (const backupFn of backupOptions) {
      try {
        backupFn();
        return;
      } catch (error) {
        console.warn('[PersistenceManager] Backup option failed:', error);
      }
    }

    throw new Error('All backup options failed');
  }

  private async loadFromBackup(key: string): Promise<any> {
    // Try multiple backup sources
    const backupSources = [
      () => sessionStorage.getItem(`backup_${key}`),
      () => localStorage.getItem(`backup_${key}`),
    ];

    for (const sourceFn of backupSources) {
      try {
        const data = sourceFn();
        if (data) {
          return JSON.parse(data);
        }
      } catch (error) {
        console.warn('[PersistenceManager] Backup source failed:', error);
      }
    }

    return null;
  }

  private isValidPersistedData(data: any): boolean {
    return data && typeof data === 'object' && (data.itineraryId || data.id) && data.itinerary;
  }

  async delete(itineraryId: string): Promise<void> {
    const key = `itinerary_generator_${itineraryId}`;

    try {
      // Delete from primary storage
      if (this.config.primaryStorage === 'database' && this.dbInitialized && this.indexedDB) {
        await this.deleteFromIndexedDB(itineraryId);
      } else {
        localStorage.removeItem(key);
      }

      // Delete from backup storage
      if (this.config.backupEnabled) {
        if (this.config.primaryStorage === 'hybrid' && this.dbInitialized && this.indexedDB) {
          await this.deleteFromIndexedDB(itineraryId);
        }
        sessionStorage.removeItem(`backup_${key}`);
        localStorage.removeItem(`backup_${key}`);
      }

      console.log(`[PersistenceManager] Deleted itinerary ${itineraryId}`);
    } catch (error) {
      console.error(`[PersistenceManager] Failed to delete itinerary ${itineraryId}:`, error);
    }
  }

  private async deleteFromIndexedDB(itineraryId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.indexedDB) {
        reject(new Error('IndexedDB not initialized'));
        return;
      }

      const transaction = this.indexedDB.transaction(['itineraries'], 'readwrite');
      const store = transaction.objectStore('itineraries');
      const request = store.delete(itineraryId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async listItineraries(): Promise<string[]> {
    const keys: string[] = [];

    try {
      // Try IndexedDB first if available
      if (this.config.primaryStorage === 'database' && this.dbInitialized && this.indexedDB) {
        const allRecords = await this.getAllFromIndexedDB();
        keys.push(...allRecords.map(record => record.id || record.itineraryId));
      } else {
        // Fall back to localStorage enumeration
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('itinerary_generator_')) {
            keys.push(key.replace('itinerary_generator_', ''));
          }
        }
      }
    } catch (error) {
      console.error('[PersistenceManager] Failed to list itineraries:', error);
      // Fallback to localStorage
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('itinerary_generator_')) {
            keys.push(key.replace('itinerary_generator_', ''));
          }
        }
      } catch (fallbackError) {
        console.error('[PersistenceManager] Fallback listing also failed:', fallbackError);
      }
    }

    return keys;
  }

  private async getAllFromIndexedDB(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.indexedDB) {
        reject(new Error('IndexedDB not initialized'));
        return;
      }

      const transaction = this.indexedDB.transaction(['itineraries'], 'readonly');
      const store = transaction.objectStore('itineraries');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Health check method for monitoring persistence status
  async getHealthStatus(): Promise<{
    primaryStorage: 'healthy' | 'degraded' | 'failed';
    backupStorage: 'healthy' | 'degraded' | 'failed';
    indexedDBAvailable: boolean;
    localStorageAvailable: boolean;
    sessionStorageAvailable: boolean;
  }> {
    let primaryStatus: 'healthy' | 'degraded' | 'failed' = 'healthy';
    let backupStatus: 'healthy' | 'degraded' | 'failed' = 'healthy';

    // Check IndexedDB availability
    const indexedDBAvailable = !!(typeof window !== 'undefined' && window.indexedDB && this.dbInitialized && this.indexedDB);

    // Check localStorage availability
    let localStorageAvailable = true;
    try {
      const testKey = 'health_test_' + Date.now();
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
    } catch (error) {
      localStorageAvailable = false;
    }

    // Check sessionStorage availability
    let sessionStorageAvailable = true;
    try {
      const testKey = 'health_test_' + Date.now();
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
    } catch (error) {
      sessionStorageAvailable = false;
    }

    // Test primary storage
    try {
      if (this.config.primaryStorage === 'database' && indexedDBAvailable) {
        const testId = `health_check_${Date.now()}`;
        const testData = { test: true, timestamp: Date.now() };
        await this.saveToIndexedDB(testId, testData);
        await this.loadFromIndexedDB(testId);
        await this.deleteFromIndexedDB(testId);
      } else if (this.config.primaryStorage === 'localStorage' && localStorageAvailable) {
        const testKey = `health_check_${Date.now()}`;
        const testData = JSON.stringify({ test: true, timestamp: Date.now() });
        localStorage.setItem(testKey, testData);
        JSON.parse(localStorage.getItem(testKey)!);
        localStorage.removeItem(testKey);
      }
    } catch (error) {
      primaryStatus = 'failed';
      console.warn('[PersistenceManager] Primary storage health check failed:', error);
    }

    // Test backup storage
    try {
      if (this.config.backupEnabled) {
        const testKey = `backup_health_${Date.now()}`;
        const testData = JSON.stringify({ test: true, timestamp: Date.now() });
        await this.saveToBackup(testKey, testData);
        const loaded = await this.loadFromBackup(testKey);
        if (!loaded) throw new Error('Backup load failed');
      }
    } catch (error) {
      backupStatus = 'failed';
      console.warn('[PersistenceManager] Backup storage health check failed:', error);
    }

    return {
      primaryStorage: primaryStatus,
      backupStorage: backupStatus,
      indexedDBAvailable,
      localStorageAvailable,
      sessionStorageAvailable
    };
  }
}

export class DayStructureEngine {
  private config: ItineraryGeneratorConfig;

  constructor(config: ItineraryGeneratorConfig) {
    this.config = config;
  }

  planDayStructure(destinations: any[], dayNumber: number, input: GeneratorInput): {
    scheduledDestinations: any[];
    freeTimeSlots: Array<{ start: string; end: string; duration: number; suggestion?: string }>;
    breaks: Array<{ start: string; end: string; type: string }>;
  } {
    const dayConfig = this.config.dayStructure;
    const startTime = this.parseTime(dayConfig.preferredStartTime);
    const endTime = this.parseTime(dayConfig.preferredEndTime);

    // Sort destinations by priority and time constraints
    const sortedDestinations = this.sortDestinationsForDay(destinations, input);

    // Schedule destinations within time constraints
    const scheduled: any[] = [];
    const freeSlots: Array<{ start: string; end: string; duration: number; suggestion?: string }> = [];
    const breaks: Array<{ start: string; end: string; type: string }> = [];

    let currentTime = startTime;
    let includeBreak = false;

    for (const dest of sortedDestinations) {
      if (scheduled.length >= dayConfig.maxDailyActivities) break;

      const destEndTime = currentTime + dest.duration;

      // Check if destination fits in remaining time
      if (destEndTime <= endTime) {
        scheduled.push({
          ...dest,
          scheduledTime: this.formatTime(currentTime)
        });

        currentTime = destEndTime + dayConfig.activityBufferTime;

        // Add break if enabled and needed
        if (dayConfig.includeBreaks && includeBreak && currentTime + dayConfig.breakDuration <= endTime) {
          breaks.push({
            start: this.formatTime(currentTime),
            end: this.formatTime(currentTime + dayConfig.breakDuration),
            type: 'activity_break'
          });
          currentTime += dayConfig.breakDuration;
        }

        includeBreak = !includeBreak; // Alternate breaks
      }
    }

    // Calculate free time slots
    if (this.config.activityDensity.includeFreeTime) {
      const totalDayMinutes = endTime - startTime;
      const scheduledMinutes = scheduled.reduce((sum, dest) => sum + dest.duration, 0);
      const breakMinutes = breaks.reduce((sum, brk) => sum + this.parseTime(brk.end) - this.parseTime(brk.start), 0);
      const usedMinutes = scheduledMinutes + breakMinutes;
      const freeMinutes = totalDayMinutes - usedMinutes;

      if (freeMinutes > 60) { // Only add free time if more than 1 hour
        const freeStart = this.formatTime(currentTime);
        const freeEnd = this.formatTime(endTime);
        freeSlots.push({
          start: freeStart,
          end: freeEnd,
          duration: endTime - currentTime,
          suggestion: 'Free time for relaxation or spontaneous activities'
        });
      }
    }

    return {
      scheduledDestinations: scheduled,
      freeTimeSlots: freeSlots,
      breaks
    };
  }

  private sortDestinationsForDay(destinations: any[], input: GeneratorInput): any[] {
    return destinations.sort((a, b) => {
      // Priority for must-visit destinations
      const aMustVisit = input.preferences.constraints?.mustVisit?.includes(a.id) || false;
      const bMustVisit = input.preferences.constraints?.mustVisit?.includes(b.id) || false;

      if (aMustVisit && !bMustVisit) return -1;
      if (!aMustVisit && bMustVisit) return 1;

      // Then by rating
      if (Math.abs(a.rating - b.rating) > 0.5) {
        return b.rating - a.rating;
      }

      // Then by duration (prefer shorter for more variety)
      return a.duration - b.duration;
    });
  }

  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
}

export class CostDistributionEngine {
  private config: ItineraryGeneratorConfig;

  constructor(config: ItineraryGeneratorConfig) {
    this.config = config;
  }

  distributeCosts(destinations: any[], days: number, totalBudget: number): {
    dailyCosts: number[];
    categoryBreakdown: any;
    optimizations: Array<{
      type: string;
      category: string;
      potentialSavings: number;
      description: string;
      impact: 'low' | 'medium' | 'high';
    }>;
  } {
    const strategy = this.config.costDistribution.budgetAllocationStrategy;

    // Calculate base daily costs
    let dailyCosts: number[];

    switch (strategy) {
      case 'equal':
        dailyCosts = new Array(days).fill(totalBudget / days);
        break;
      case 'front-loaded':
        dailyCosts = this.calculateFrontLoaded(totalBudget, days);
        break;
      case 'back-loaded':
        dailyCosts = this.calculateBackLoaded(totalBudget, days);
        break;
      case 'peak-day':
        dailyCosts = this.calculatePeakDay(totalBudget, days);
        break;
      default:
        dailyCosts = new Array(days).fill(totalBudget / days);
    }

    // Calculate category breakdown
    const categoryBreakdown = this.calculateCategoryBreakdown(totalBudget);

    // Generate cost optimizations
    const optimizations = this.generateCostOptimizations(destinations, totalBudget);

    return {
      dailyCosts,
      categoryBreakdown,
      optimizations
    };
  }

  private calculateFrontLoaded(totalBudget: number, days: number): number[] {
    const costs: number[] = [];
    let remaining = totalBudget;

    for (let i = 0; i < days; i++) {
      const weight = Math.pow(0.8, i); // Exponential decay
      const cost = (remaining * weight) / (days - i);
      costs.push(cost);
      remaining -= cost;
    }

    return costs;
  }

  private calculateBackLoaded(totalBudget: number, days: number): number[] {
    const costs = this.calculateFrontLoaded(totalBudget, days);
    return costs.reverse();
  }

  private calculatePeakDay(totalBudget: number, days: number): number[] {
    const peakDay = Math.floor(days / 2);
    const peakCost = totalBudget * 0.4; // 40% on peak day
    const remaining = totalBudget - peakCost;
    const otherDays = days - 1;
    const otherDayCost = remaining / otherDays;

    return new Array(days).fill(otherDayCost).map((cost, index) =>
      index === peakDay ? peakCost : cost
    );
  }

  private calculateCategoryBreakdown(totalBudget: number): any {
    const emergencyFund = totalBudget * (this.config.costDistribution.emergencyFundPercentage / 100);
    const availableBudget = totalBudget - emergencyFund;

    return {
      accommodation: { allocated: availableBudget * 0.35, recommended: availableBudget * 0.35, savings: 0 },
      transportation: { allocated: availableBudget * 0.20, recommended: availableBudget * 0.20, savings: 0 },
      food: { allocated: availableBudget * 0.25, recommended: availableBudget * 0.25, savings: 0 },
      activities: { allocated: availableBudget * 0.15, recommended: availableBudget * 0.15, savings: 0 },
      miscellaneous: { allocated: availableBudget * 0.05, recommended: availableBudget * 0.05, savings: 0 }
    };
  }

  private generateCostOptimizations(destinations: any[], totalBudget: number): Array<{
    type: string;
    category: string;
    potentialSavings: number;
    description: string;
    impact: 'low' | 'medium' | 'high';
  }> {
    const optimizations: Array<{
      type: string;
      category: string;
      potentialSavings: number;
      description: string;
      impact: 'low' | 'medium' | 'high';
    }> = [];

    // Group discount optimization
    if (destinations.length >= 3) {
      optimizations.push({
        type: 'group',
        category: 'activities',
        potentialSavings: totalBudget * 0.05,
        description: 'Group discount for visiting multiple destinations',
        impact: 'medium'
      });
    }

    // Seasonal pricing optimization
    const month = new Date().getMonth() + 1;
    if ([11, 12, 1, 2, 3].includes(month)) {
      optimizations.push({
        type: 'seasonal',
        category: 'accommodation',
        potentialSavings: totalBudget * 0.08,
        description: 'Book during low season for better rates',
        impact: 'high'
      });
    }

    // Early booking optimization
    optimizations.push({
      type: 'early_bird',
      category: 'transportation',
      potentialSavings: totalBudget * 0.03,
      description: 'Early booking discounts on transportation',
      impact: 'low'
    });

    return optimizations;
  }
}

export class ActivityDensityManager {
  private config: ItineraryGeneratorConfig;

  constructor(config: ItineraryGeneratorConfig) {
    this.config = config;
  }

  optimizeActivityDensity(destinations: any[], input: GeneratorInput): {
    filteredDestinations: any[];
    densityMetrics: {
      activitiesPerDay: number;
      totalDuration: number;
      freeTimePercentage: number;
      intensity: 'low' | 'medium' | 'high';
    };
  } {
    const densityConfig = this.config.activityDensity;
    let filteredDestinations = [...destinations];

    // Filter by preferred activity types
    if (densityConfig.preferredActivityTypes.length > 0) {
      filteredDestinations = filteredDestinations.filter(dest =>
        densityConfig.preferredActivityTypes.some(type =>
          dest.category.toLowerCase().includes(type.toLowerCase()) ||
          dest.tags.some((tag: string) => tag.toLowerCase().includes(type.toLowerCase()))
        )
      );
    }

    // Apply density level constraints
    const maxActivities = densityConfig.maxActivitiesPerDay;
    if (filteredDestinations.length > maxActivities * input.preferences.days) {
      // Sort by priority and keep top destinations
      filteredDestinations = filteredDestinations
        .sort((a, b) => b.rating - a.rating)
        .slice(0, maxActivities * input.preferences.days);
    }

    // Calculate density metrics
    const totalDuration = filteredDestinations.reduce((sum, dest) => sum + dest.duration, 0);
    const totalActivities = filteredDestinations.length;
    const activitiesPerDay = totalActivities / input.preferences.days;
    const estimatedDayDuration = 10 * 60; // 10 hours in minutes
    const usedTimePercentage = (totalDuration / (input.preferences.days * estimatedDayDuration)) * 100;
    const freeTimePercentage = 100 - usedTimePercentage;

    let intensity: 'low' | 'medium' | 'high';
    if (activitiesPerDay <= 2) intensity = 'low';
    else if (activitiesPerDay <= 4) intensity = 'medium';
    else intensity = 'high';

    return {
      filteredDestinations,
      densityMetrics: {
        activitiesPerDay,
        totalDuration,
        freeTimePercentage: Math.max(0, freeTimePercentage),
        intensity
      }
    };
  }

  validateDensityConstraints(destinations: any[], input: GeneratorInput): {
    isValid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];
    const densityConfig = this.config.activityDensity;

    const totalActivities = destinations.length;
    const activitiesPerDay = totalActivities / input.preferences.days;

    if (densityConfig.avoidOverScheduling && activitiesPerDay > densityConfig.maxActivitiesPerDay) {
      warnings.push(`High activity density: ${activitiesPerDay.toFixed(1)} activities per day exceeds recommended maximum`);
    }

    if (densityConfig.includeFreeTime && densityConfig.freeTimePercentage < 20) {
      warnings.push('Low free time percentage may lead to fatigue');
    }

    return {
      isValid: warnings.length === 0,
      warnings
    };
  }
}

export class TransportationModeSelector {
  private config: ItineraryGeneratorConfig;

  constructor(config: ItineraryGeneratorConfig) {
    this.config = config;
  }

  selectOptimalTransportation(destinations: any[], input: GeneratorInput): {
    transportationPlan: Array<{
      day: number;
      type: string;
      cost: number;
      route: string;
      duration: number;
      ecoFriendly: boolean;
    }>;
    totalCost: number;
  } {
    const transportConfig = this.config.transportation;
    const transportationPlan: Array<{
      day: number;
      type: string;
      cost: number;
      route: string;
      duration: number;
      ecoFriendly: boolean;
    }> = [];

    let totalCost = 0;

    // Group destinations by day (simplified)
    const destinationsPerDay = Math.ceil(destinations.length / input.preferences.days);

    for (let day = 1; day <= input.preferences.days; day++) {
      const dayStart = (day - 1) * destinationsPerDay;
      const dayEnd = Math.min(day * destinationsPerDay, destinations.length);
      const dayDestinations = destinations.slice(dayStart, dayEnd);

      if (dayDestinations.length > 0) {
        const transport = this.selectDayTransportation(dayDestinations, transportConfig, input.preferences.budget);
        transportationPlan.push({
          day,
          ...transport
        });
        totalCost += transport.cost;
      }
    }

    return {
      transportationPlan,
      totalCost
    };
  }

  private selectDayTransportation(destinations: any[], config: any, totalBudget: number): {
    type: string;
    cost: number;
    route: string;
    duration: number;
    ecoFriendly: boolean;
  } {
    const preferredModes = config.preferredModes;
    const budgetPriority = config.budgetPriority;
    const ecoFriendly = config.ecoFriendly;

    // Calculate distances between destinations
    const totalDistance = this.calculateTotalDayDistance(destinations);

    // Select optimal mode based on constraints
    let selectedMode: string;
    let cost: number;
    let duration: number;
    let isEcoFriendly: boolean;

    if (totalDistance <= config.maxWalkingDistance && preferredModes.includes('walking')) {
      selectedMode = 'walking';
      cost = 0;
      duration = totalDistance * 15; // 15 minutes per km walking
      isEcoFriendly = true;
    } else if (budgetPriority && preferredModes.includes('public')) {
      selectedMode = 'public_transport';
      cost = Math.min(50000, totalDistance * 2000);
      duration = totalDistance * 8; // 8 minutes per km by public transport
      isEcoFriendly = true;
    } else if (ecoFriendly && preferredModes.includes('walking')) {
      selectedMode = 'walking';
      cost = 0;
      duration = totalDistance * 15;
      isEcoFriendly = true;
    } else if (preferredModes.includes('taxi')) {
      selectedMode = 'taxi';
      cost = totalDistance * 8000; // IDR per km
      duration = totalDistance * 6; // 6 minutes per km by taxi
      isEcoFriendly = false;
    } else {
      // Default to rental
      selectedMode = 'rental_car';
      cost = 200000; // Daily rental cost
      duration = totalDistance * 4; // 4 minutes per km by car
      isEcoFriendly = false;
    }

    return {
      type: selectedMode,
      cost,
      route: `Day transportation (${totalDistance.toFixed(1)} km)`,
      duration,
      ecoFriendly: isEcoFriendly
    };
  }

  private calculateTotalDayDistance(destinations: any[]): number {
    if (destinations.length <= 1) return 0;

    let totalDistance = 0;
    for (let i = 1; i < destinations.length; i++) {
      if (destinations[i].coordinates && destinations[i - 1].coordinates) {
        totalDistance += this.calculateDistance(
          destinations[i - 1].coordinates,
          destinations[i].coordinates
        );
      }
    }

    return totalDistance;
  }

  private calculateDistance(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(coord2.lat - coord1.lat);
    const dLon = this.toRad(coord2.lng - coord1.lng);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(coord1.lat)) * Math.cos(this.toRad(coord2.lat)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI/180);
  }
}

export class MealPreferenceEngine {
  private config: ItineraryGeneratorConfig;

  constructor(config: ItineraryGeneratorConfig) {
    this.config = config;
  }

  generateMealPlan(destinations: any[], input: GeneratorInput): {
    meals: Array<{
      day: number;
      type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
      time: string;
      recommendation: string;
      estimatedCost: number;
      location?: string;
    }>;
    totalCost: number;
  } {
    const mealConfig = this.config.meals;
    if (!mealConfig.includeMeals) {
      return { meals: [], totalCost: 0 };
    }

    const meals: Array<{
      day: number;
      type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
      time: string;
      recommendation: string;
      estimatedCost: number;
      location?: string;
    }> = [];

    let totalCost = 0;

    for (let day = 1; day <= input.preferences.days; day++) {
      const dayMeals = this.generateDayMeals(day, destinations, mealConfig, input.preferences.cities);
      meals.push(...dayMeals);
      totalCost += dayMeals.reduce((sum, meal) => sum + meal.estimatedCost, 0);
    }

    return { meals, totalCost };
  }

  private generateDayMeals(
    day: number,
    destinations: any[],
    mealConfig: any,
    cities: string[]
  ): Array<{
    day: number;
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    time: string;
    recommendation: string;
    estimatedCost: number;
    location?: string;
  }> {
    const meals: Array<{
      day: number;
      type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
      time: string;
      recommendation: string;
      estimatedCost: number;
      location?: string;
    }> = [];

    const mealTypes: Array<'breakfast' | 'lunch' | 'dinner' | 'snack'> = ['breakfast', 'lunch', 'dinner'];
    const timing = mealConfig.mealTiming;

    mealTypes.forEach(type => {
      const timeRange = timing[type as keyof typeof timing] as string;
      const [startTime] = timeRange.split('-');

      const recommendation = this.generateMealRecommendation(type, mealConfig, cities);
      const cost = this.calculateMealCost(type, mealConfig);

      meals.push({
        day,
        type,
        time: startTime.trim(),
        recommendation,
        estimatedCost: cost,
        location: cities[0] // Default to first city
      });
    });

    return meals;
  }

  private generateMealRecommendation(
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    config: any,
    cities: string[]
  ): string {
    const cuisine = config.preferredCuisine.length > 0 ? config.preferredCuisine[0] : 'local';

    switch (type) {
      case 'breakfast':
        return `Traditional ${cuisine} breakfast with local specialties`;
      case 'lunch':
        return `Local ${cuisine} restaurant with authentic flavors`;
      case 'dinner':
        return `Fine dining experience with ${cuisine} cuisine`;
      case 'snack':
        return `Street food and local delicacies`;
      default:
        return 'Local cuisine experience';
    }
  }

  private calculateMealCost(type: 'breakfast' | 'lunch' | 'dinner' | 'snack', config: any): number {
    const baseCosts = {
      breakfast: 25000,
      lunch: 40000,
      dinner: 60000,
      snack: 15000
    };

    return baseCosts[type] * (config.mealBudget / 150000); // Scale based on budget
  }
}

export class ErrorRecoveryManager {
  private config: ItineraryGeneratorConfig;

  constructor(config: ItineraryGeneratorConfig) {
    this.config = config;
  }

  detectError(error: any): boolean {
    return error instanceof Error || typeof error === 'object';
  }

  canRecover(error: any, context: any): boolean {
    // Check if error is recoverable based on type and context
    if (error.code === 'VALIDATION_ERROR') return true;
    if (error.code === 'NETWORK_ERROR') return context.retryCount < 3;
    if (error.code === 'TIMEOUT_ERROR') return true;
    if (error.code === 'DATA_MISSING') return true;

    return false;
  }

  async executeRecovery(error: any, context: any): Promise<any> {
    console.log(`[ErrorRecoveryManager] Executing recovery for error:`, error.code);

    switch (error.code) {
      case 'VALIDATION_ERROR':
        return this.recoverFromValidationError(error, context);
      case 'NETWORK_ERROR':
        return this.recoverFromNetworkError(error, context);
      case 'TIMEOUT_ERROR':
        return this.recoverFromTimeoutError(error, context);
      case 'DATA_MISSING':
        return this.recoverFromDataMissingError(error, context);
      default:
        throw error; // Cannot recover
    }
  }

  private recoverFromValidationError(error: any, context: any): any {
    // Use default values for invalid fields
    const defaults = {
      budget: 1000000,
      days: 3,
      travelers: 2,
      cities: ['Jakarta']
    };

    return { ...context.input, ...defaults };
  }

  private recoverFromNetworkError(error: any, context: any): Promise<any> {
    // Retry with exponential backoff
    const delay = Math.pow(2, context.retryCount) * 1000;
    return new Promise(resolve => {
      setTimeout(() => resolve(context), delay);
    });
  }

  private recoverFromTimeoutError(error: any, context: any): any {
    // Generate partial result with reduced complexity
    return {
      ...context,
      config: {
        ...context.config,
        performance: {
          ...context.config.performance,
          timeoutMs: context.config.performance.timeoutMs * 2
        }
      }
    };
  }

  private recoverFromDataMissingError(error: any, context: any): any {
    // Provide fallback data
    return {
      ...context,
      availableDestinations: [{
        id: 'fallback',
        name: 'Local Exploration',
        location: context.preferences.cities[0] || 'Jakarta',
        category: 'Cultural',
        estimatedCost: 50000,
        duration: 120,
        tags: ['local', 'flexible'],
        rating: 4.0
      }]
    };
  }

  getFallbackData(error: any, context: any): any {
    // Generate minimal viable itinerary
    return {
      success: false,
      itineraryId: `fallback_${Date.now()}`,
      itinerary: {
        summary: {
          totalDays: context.preferences.days,
          totalCost: context.preferences.budget * 0.5,
          totalDuration: context.preferences.days * 480,
          confidence: 0.3,
          generatedAt: Date.now()
        },
        days: Array(context.preferences.days).fill(null).map((_, i) => ({
          day: i + 1,
          date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toLocaleDateString(),
          destinations: [{
            id: 'fallback',
            name: 'Local Exploration',
            category: 'Cultural',
            location: context.preferences.cities[0] || 'Jakarta',
            coordinates: { lat: -6.2088, lng: 106.8456 },
            scheduledTime: '09:00',
            duration: 240,
            estimatedCost: 100000,
            rating: 4.0,
            tags: ['local', 'flexible'],
            mlScore: 0.5,
            predictedSatisfaction: 0.7
          }],
          totalCost: 100000,
          totalTime: 240,
          mlConfidence: 0.3,
          optimizationReasons: ['Fallback itinerary due to error']
        })),
        budgetBreakdown: {
          totalBudget: context.preferences.budget,
          categoryBreakdown: {
            accommodation: { allocated: context.preferences.budget * 0.3, recommended: context.preferences.budget * 0.3, savings: 0 },
            transportation: { allocated: context.preferences.budget * 0.2, recommended: context.preferences.budget * 0.2, savings: 0 },
            food: { allocated: context.preferences.budget * 0.2, recommended: context.preferences.budget * 0.2, savings: 0 },
            activities: { allocated: context.preferences.budget * 0.2, recommended: context.preferences.budget * 0.2, savings: 0 },
            miscellaneous: { allocated: context.preferences.budget * 0.1, recommended: context.preferences.budget * 0.1, savings: 0 }
          },
          optimizations: [],
          confidence: 0.3,
          reasoning: ['Fallback mode activated']
        },
        mlInsights: {
          personalizationScore: 0.3,
          predictedUserSatisfaction: 0.5,
          riskFactors: ['System error occurred - using fallback itinerary'],
          recommendations: ['Consider regenerating with different preferences']
        },
        optimization: {
          timeOptimization: 0,
          costOptimization: 0,
          satisfactionOptimization: 0,
          reasoning: ['Fallback mode']
        },
        costVariability: {
          seasonalAdjustments: [],
          demandFactors: [],
          currencyRates: [],
          appliedDiscounts: [],
          realTimeUpdates: []
        }
      },
      metadata: {
        generationTime: 100,
        configUsed: context.config,
        engineVersions: {
          itinerary: '1.0.0',
          budget: '1.0.0',
          ml: '1.0.0'
        },
        performanceMetrics: {
          cacheHits: 0,
          apiCalls: 0,
          processingTime: 100
        }
      },
      errors: [{
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message || 'An unknown error occurred',
        severity: 'high',
        recoverable: false
      }],
      warnings: [{
        code: 'FALLBACK_MODE',
        message: 'Itinerary generated in fallback mode due to system error',
        suggestion: 'Try again or contact support'
      }]
    };
  }
}

// Main Itinerary Generator Orchestrator
export class ItineraryGenerator {
  private configManager: ConfigurationManager;
  private validationEngine: ValidationEngine;
  private persistenceManager: PersistenceManager;
  private dayStructureEngine: DayStructureEngine;
  private costDistributionEngine: CostDistributionEngine;
  private activityDensityManager: ActivityDensityManager;
  private transportationSelector: TransportationModeSelector;
  private mealPreferenceEngine: MealPreferenceEngine;
  private errorRecoveryManager: ErrorRecoveryManager;

  private config: ItineraryGeneratorConfig;

  constructor(configOverrides: Partial<ItineraryGeneratorConfig> = {}) {
    this.configManager = new ConfigurationManager();
    const baseConfig = this.configManager.getDefaultConfig();
    this.config = this.configManager.mergeConfigs(baseConfig, configOverrides);

    this.validationEngine = new ValidationEngine();
    this.persistenceManager = new PersistenceManager(this.config.persistence);
    this.dayStructureEngine = new DayStructureEngine(this.config);
    this.costDistributionEngine = new CostDistributionEngine(this.config);
    this.activityDensityManager = new ActivityDensityManager(this.config);
    this.transportationSelector = new TransportationModeSelector(this.config);
    this.mealPreferenceEngine = new MealPreferenceEngine(this.config);
    this.errorRecoveryManager = new ErrorRecoveryManager(this.config);
  }

  async generateItinerary(input: GeneratorInput): Promise<GeneratorOutput> {
    const startTime = Date.now();
    console.log(`[ItineraryGenerator] Starting itinerary generation for user ${input.userId}`);

    try {
      // Step 1: Input Validation
      const validationResult = this.validationEngine.validateInput(input);
      if (!validationResult.isValid) {
        throw {
          code: 'VALIDATION_ERROR',
          message: 'Input validation failed',
          details: validationResult.errors
        };
      }
      const validatedInput = validationResult.input!;

      // Step 2: Configuration Validation
      const configValidation = this.configManager.validateAndNormalizeConfig(validatedInput.config);
      if (!configValidation.isValid) {
        throw {
          code: 'CONFIG_ERROR',
          message: 'Configuration validation failed',
          details: configValidation.errors
        };
      }

      // Step 3: Check Cache
      if (this.config.performance.enableCaching) {
        const cached = await this.persistenceManager.load(validatedInput.userId);
        if (cached && (Date.now() - cached.itinerary.summary.generatedAt) < this.config.performance.cacheTimeout) {
          console.log(`[ItineraryGenerator] Returning cached itinerary for ${validatedInput.userId}`);
          return cached;
        }
      }

      // Step 4: Get ML Profile and Recommendations
      const userProfile = mlEngine.getUserProfile(validatedInput.userId);
      const mlRecommendations = mlEngine.generateRecommendations(
        validatedInput.userId,
        validatedInput.availableDestinations.map(dest => ({
          id: dest.id,
          type: 'destination',
          data: dest
        })),
        validatedInput.preferences.days * 4
      );

      // Step 5: Get Budget Recommendations
      const budgetRecommendation = budgetEngine.calculateSmartBudget({
        userId: validatedInput.userId,
        preferences: validatedInput.preferences,
        destinations: validatedInput.availableDestinations
      });

      // Step 6: Optimize Activity Density
      const densityOptimization = this.activityDensityManager.optimizeActivityDensity(
        validatedInput.availableDestinations,
        validatedInput
      );

      // Step 7: Generate Day Structure
      const days: GeneratorOutput['itinerary']['days'] = [];

      for (let day = 1; day <= validatedInput.preferences.days; day++) {
        const dayDestinations = this.distributeDestinationsForDay(
          densityOptimization.filteredDestinations,
          day,
          validatedInput.preferences.days
        );

        const dayStructure = this.dayStructureEngine.planDayStructure(
          dayDestinations,
          day,
          validatedInput
        );

        // Add ML scores and recommendations
        const enhancedDestinations = dayStructure.scheduledDestinations.map(dest => {
          const mlRec = mlRecommendations.find(rec => rec.itemId === dest.id);
          return {
            ...dest,
            mlScore: mlRec?.score || 0.5,
            predictedSatisfaction: mlRec?.predictedRating || dest.rating,
            crowdLevel: this.calculateCrowdLevel(dest, validatedInput),
            weatherSuitability: 0.8, // Placeholder
            alternatives: mlRec ? [{
              id: 'alt_' + dest.id,
              name: 'Alternative Option',
              reason: 'Based on ML recommendations'
            }] : undefined
          };
        });

        // Generate meals for the day
        const dayMeals = this.mealPreferenceEngine.generateMealPlan(
          enhancedDestinations,
          { ...validatedInput, preferences: { ...validatedInput.preferences, days: 1 } }
        );

        days.push({
          day,
          date: this.calculateDate(validatedInput.preferences.startDate, day - 1),
          destinations: enhancedDestinations,
          meals: dayMeals.meals,
          totalCost: enhancedDestinations.reduce((sum, d) => sum + d.estimatedCost, 0) + dayMeals.totalCost,
          totalTime: enhancedDestinations.reduce((sum, d) => sum + d.duration, 0),
          mlConfidence: enhancedDestinations.reduce((sum, d) => sum + d.mlScore, 0) / enhancedDestinations.length,
          optimizationReasons: dayStructure.breaks.map(b => `Break scheduled at ${b.start}`),
          freeTimeSlots: dayStructure.freeTimeSlots
        });
      }

      // Step 8: Cost Distribution
      const costDistribution = this.costDistributionEngine.distributeCosts(
        densityOptimization.filteredDestinations,
        validatedInput.preferences.days,
        validatedInput.preferences.budget
      );

      // Step 9: Transportation Planning
      const transportationPlan = this.transportationSelector.selectOptimalTransportation(
        densityOptimization.filteredDestinations,
        validatedInput
      );

      // Step 10: Generate ML Insights
      const mlInsights = this.calculateMLInsights(days, userProfile, validatedInput);

      // Step 11: Calculate Optimization Metrics
      const optimization = this.calculateOptimizationMetrics(days, validatedInput, budgetRecommendation);

      // Step 12: Generate Cost Variability Data
      const costVariability = this.generateCostVariability(days, validatedInput);

      // Step 13: Build Final Output
      const output: GeneratorOutput = {
        success: true,
        itineraryId: `itinerary_${validatedInput.userId}_${Date.now()}`,
        itinerary: {
          summary: {
            totalDays: validatedInput.preferences.days,
            totalCost: days.reduce((sum, day) => sum + day.totalCost, 0),
            totalDuration: days.reduce((sum, day) => sum + day.totalTime, 0),
            confidence: mlInsights.personalizationScore,
            generatedAt: Date.now()
          },
          days,
          budgetBreakdown: {
            totalBudget: validatedInput.preferences.budget,
            categoryBreakdown: costDistribution.categoryBreakdown,
            optimizations: costDistribution.optimizations,
            confidence: budgetRecommendation.confidence,
            reasoning: budgetRecommendation.reasoning
          },
          mlInsights,
          optimization,
          costVariability
        },
        metadata: {
          generationTime: Date.now() - startTime,
          configUsed: this.config,
          engineVersions: {
            itinerary: '1.0.0',
            budget: '1.0.0',
            ml: '1.0.0'
          },
          performanceMetrics: {
            cacheHits: 0,
            apiCalls: 1,
            processingTime: Date.now() - startTime
          }
        }
      };

      // Step 14: Validate Output
      const outputValidation = this.validationEngine.validateOutput(output);
      if (!outputValidation.isValid) {
        console.warn('[ItineraryGenerator] Output validation failed:', outputValidation.errors);
        output.warnings = [{
          code: 'VALIDATION_WARNING',
          message: 'Output validation failed but proceeding',
          suggestion: 'Review generated itinerary for consistency'
        }];
      }

      // Step 15: Persist Result
      try {
        await this.persistenceManager.save(output.itineraryId, output);
      } catch (persistError) {
        console.error('[ItineraryGenerator] Failed to persist itinerary:', persistError);
        output.errors = [{
          code: 'PERSISTENCE_ERROR',
          message: 'Failed to persist itinerary data',
          severity: 'medium',
          recoverable: true
        }];
      }

      console.log(`[ItineraryGenerator] Successfully generated itinerary ${output.itineraryId}`);
      return output;

    } catch (error: any) {
      console.error('[ItineraryGenerator] Error during generation:', error);

      // Attempt error recovery
      if (this.errorRecoveryManager.canRecover(error, { input, retryCount: 0 })) {
        try {
          console.log('[ItineraryGenerator] Attempting error recovery');
          const recoveredContext = await this.errorRecoveryManager.executeRecovery(error, { input, retryCount: 0 });
          return this.generateItinerary(recoveredContext);
        } catch (recoveryError) {
          console.error('[ItineraryGenerator] Recovery failed:', recoveryError);
        }
      }

      // Return fallback result
      return this.errorRecoveryManager.getFallbackData(error, input);
    }
  }

  private distributeDestinationsForDay(destinations: any[], day: number, totalDays: number): any[] {
    const perDay = Math.ceil(destinations.length / totalDays);
    const start = (day - 1) * perDay;
    const end = Math.min(start + perDay, destinations.length);
    return destinations.slice(start, end);
  }

  private calculateCrowdLevel(destination: any, input: GeneratorInput): 'low' | 'medium' | 'high' {
    // Simple crowd level calculation based on rating and constraints
    if (input.preferences.constraints?.avoidCrowds) return 'low';
    if (destination.rating > 4.5) return 'high';
    if (destination.rating > 4.0) return 'medium';
    return 'low';
  }

  private calculateDate(startDate: string, daysToAdd: number): string {
    const date = new Date(startDate);
    date.setDate(date.getDate() + daysToAdd);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private calculateMLInsights(days: GeneratorOutput['itinerary']['days'], profile: any, input: GeneratorInput) {
    const allDestinations = days.flatMap(day => day.destinations);
    const avgMLScore = allDestinations.reduce((sum, dest) => sum + dest.mlScore, 0) / allDestinations.length;
    const avgSatisfaction = allDestinations.reduce((sum, dest) => sum + dest.predictedSatisfaction, 0) / allDestinations.length;

    const personalizationScore = profile ? this.calculatePersonalizationScore(allDestinations, profile) : 0.5;

    const riskFactors = this.identifyRiskFactors(days, input);
    const recommendations = this.generatePersonalizedRecommendations(days, profile, input);

    return {
      personalizationScore,
      predictedUserSatisfaction: avgSatisfaction,
      riskFactors,
      recommendations
    };
  }

  private calculatePersonalizationScore(destinations: any[], profile: any): number {
    if (!profile) return 0.5;

    let score = 0;
    const categoryMatches = destinations.filter(d =>
      profile.implicitPreferences.preferredCategories[d.category] > 0
    ).length;
    score += (categoryMatches / destinations.length) * 0.4;

    const locationMatches = destinations.filter(d =>
      profile.implicitPreferences.preferredLocations[d.location] > 0
    ).length;
    score += (locationMatches / destinations.length) * 0.3;

    const priceMatches = destinations.filter(d =>
      d.estimatedCost >= profile.implicitPreferences.preferredPriceRange.min &&
      d.estimatedCost <= profile.implicitPreferences.preferredPriceRange.max
    ).length;
    score += (priceMatches / destinations.length) * 0.3;

    return Math.min(score, 1.0);
  }

  private identifyRiskFactors(days: GeneratorOutput['itinerary']['days'], input: GeneratorInput): string[] {
    const risks: string[] = [];

    const totalCost = days.reduce((sum, day) => sum + day.totalCost, 0);
    if (totalCost > input.preferences.budget * 1.1) {
      risks.push('Estimated costs exceed budget - consider alternatives');
    }

    if (input.preferences.constraints?.avoidCrowds) {
      risks.push('Peak season travel may result in crowds despite optimization');
    }

    const rainySeasons = [11, 12, 1, 2, 3];
    const startMonth = new Date(input.preferences.startDate).getMonth() + 1;
    if (rainySeasons.includes(startMonth)) {
      risks.push('Traveling during rainy season - outdoor activities may be affected');
    }

    return risks;
  }

  private generatePersonalizedRecommendations(days: GeneratorOutput['itinerary']['days'], profile: any, input: GeneratorInput): string[] {
    const recommendations: string[] = [];

    if (profile) {
      if (profile.mlInsights.activityPreference > 0.7) {
        recommendations.push('Consider adding more adventure or outdoor activities');
      }

      if (profile.mlInsights.priceSensitivity > 0.6) {
        recommendations.push('Look for local food markets and free attractions to save money');
      }

      if (profile.mlInsights.spontaneityScore > 0.6) {
        recommendations.push('Leave some free time for spontaneous discoveries');
      }
    }

    const month = new Date(input.preferences.startDate).getMonth() + 1;
    if ([6, 7, 8].includes(month)) {
      recommendations.push('Great time for beach and water activities!');
    } else if ([12, 1, 2].includes(month)) {
      recommendations.push('Peak tourist season - book accommodations early');
    }

    return recommendations;
  }

  private calculateOptimizationMetrics(
    days: GeneratorOutput['itinerary']['days'],
    input: GeneratorInput,
    budgetRecommendation: any
  ) {
    const baseCost = input.preferences.budget;
    const optimizedCost = days.reduce((sum, day) => sum + day.totalCost, 0);
    const costOptimization = baseCost > 0 ? Math.max(0, (baseCost - optimizedCost) / baseCost * 100) : 0;

    const timeOptimization = this.calculateTimeOptimization(days, input.preferences.constraints);
    const satisfactionOptimization = this.calculateSatisfactionOptimization(days);

    const reasoning = [
      `Cost optimized by ${costOptimization.toFixed(1)}%`,
      `Time efficiency improved by ${timeOptimization.toFixed(1)}%`,
      `Satisfaction potential increased by ${satisfactionOptimization.toFixed(1)}%`
    ];

    return {
      timeOptimization,
      costOptimization,
      satisfactionOptimization,
      reasoning
    };
  }

  private calculateTimeOptimization(days: GeneratorOutput['itinerary']['days'], constraints: any): number {
    const totalActivities = days.reduce((sum, day) => sum + day.destinations.length, 0);
    const baseTime = totalActivities * 180; // 3 hours per activity base
    const actualTime = days.reduce((sum, day) => sum + day.totalTime, 0);

    return Math.max(0, (baseTime - actualTime) / baseTime * 100);
  }

  private calculateSatisfactionOptimization(days: GeneratorOutput['itinerary']['days']): number {
    const allDestinations = days.flatMap(day => day.destinations);
    const avgRating = allDestinations.reduce((sum, d) => sum + d.rating, 0) / allDestinations.length;
    const avgMLScore = allDestinations.reduce((sum, d) => sum + d.mlScore, 0) / allDestinations.length;

    const baseSatisfaction = 3.5;
    const ratingBoost = (avgRating - baseSatisfaction) * 20;
    const mlBoost = avgMLScore * 30;

    return Math.max(0, ratingBoost + mlBoost);
  }

  private generateCostVariability(days: GeneratorOutput['itinerary']['days'], input: GeneratorInput): GeneratorOutput['itinerary']['costVariability'] {
    const allDestinations = days.flatMap(day => day.destinations);

    return {
      seasonalAdjustments: this.calculateSeasonalPricing(allDestinations, input),
      demandFactors: this.calculateDemandPricing(allDestinations),
      currencyRates: [{
        from: 'IDR',
        to: 'USD',
        rate: 0.000067,
        lastUpdated: Date.now()
      }],
      appliedDiscounts: this.calculateDiscounts(allDestinations, input),
      realTimeUpdates: this.getRealTimeUpdates(allDestinations)
    };
  }

  private calculateSeasonalPricing(destinations: any[], input: GeneratorInput) {
    const startDate = new Date(input.preferences.startDate);
    const month = startDate.getMonth() + 1;

    const seasonalMultipliers: Record<number, { season: 'low' | 'shoulder' | 'high' | 'peak'; multiplier: number }> = {
      1: { season: 'high', multiplier: 1.3 },
      2: { season: 'high', multiplier: 1.3 },
      6: { season: 'shoulder', multiplier: 1.1 },
      7: { season: 'shoulder', multiplier: 1.1 },
      8: { season: 'shoulder', multiplier: 1.1 },
      12: { season: 'peak', multiplier: 1.5 }
    };

    const defaultSeason = { season: 'low' as const, multiplier: 0.9 };
    const { season, multiplier } = seasonalMultipliers[month] || defaultSeason;

    return destinations.map(dest => ({
      destinationId: dest.id,
      season,
      multiplier,
      reason: `Traveling during ${season} season`
    }));
  }

  private calculateDemandPricing(destinations: any[]) {
    return destinations.map(dest => {
      const baseDemand = dest.rating > 4.5 ? 'high' : dest.rating > 4.0 ? 'medium' : 'low';
      const categoryMultiplier = 1.0; // Simplified

      let demandLevel: 'low' | 'medium' | 'high' | 'extreme';
      let multiplier = 1.0;

      if (baseDemand === 'high' && categoryMultiplier > 0.8) {
        demandLevel = 'extreme';
        multiplier = 1.4;
      } else if (baseDemand === 'high') {
        demandLevel = 'high';
        multiplier = 1.2;
      } else if (baseDemand === 'medium') {
        demandLevel = 'medium';
        multiplier = 1.1;
      } else {
        demandLevel = 'low';
        multiplier = 1.0;
      }

      return {
        destinationId: dest.id,
        demandLevel,
        multiplier,
        occupancyRate: Math.random() * 100
      };
    });
  }

  private calculateDiscounts(destinations: any[], input: GeneratorInput) {
    const discounts = [];

    if (input.preferences.travelers >= 4) {
      discounts.push({
        type: 'group',
        percentage: Math.min(input.preferences.travelers * 2, 15),
        applicableTo: destinations.map(d => d.id),
        conditions: `Group discount for ${input.preferences.travelers} travelers`
      });
    }

    const daysUntilTravel = Math.ceil((new Date(input.preferences.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilTravel > 30) {
      discounts.push({
        type: 'early_bird',
        percentage: 10,
        applicableTo: destinations.map(d => d.id),
        conditions: 'Booked more than 30 days in advance'
      });
    }

    return discounts;
  }

  private getRealTimeUpdates(destinations: any[]) {
    return destinations.map(dest => ({
      destinationId: dest.id,
      originalPrice: dest.estimatedCost,
      currentPrice: dest.estimatedCost * (0.9 + Math.random() * 0.2), // ±10%
      changeReason: Math.random() > 0.5 ? 'Increased demand' : 'Available deals',
      lastUpdated: Date.now()
    }));
  }

  // Public API methods
  async getItinerary(itineraryId: string): Promise<GeneratorOutput | null> {
    return this.persistenceManager.load(itineraryId);
  }

  async listItineraries(): Promise<string[]> {
    return this.persistenceManager.listItineraries();
  }

  updateConfig(configOverrides: Partial<ItineraryGeneratorConfig>): void {
    this.config = this.configManager.mergeConfigs(this.config, configOverrides);

    // Reinitialize components with new config
    this.persistenceManager = new PersistenceManager(this.config.persistence);
    this.dayStructureEngine = new DayStructureEngine(this.config);
    this.costDistributionEngine = new CostDistributionEngine(this.config);
    this.activityDensityManager = new ActivityDensityManager(this.config);
    this.transportationSelector = new TransportationModeSelector(this.config);
    this.mealPreferenceEngine = new MealPreferenceEngine(this.config);
    this.errorRecoveryManager = new ErrorRecoveryManager(this.config);
  }

  getConfig(): ItineraryGeneratorConfig {
    return { ...this.config };
  }
}

// Singleton instance
export const itineraryGenerator = new ItineraryGenerator();