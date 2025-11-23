// Budget-Aligned Itinerary Engine for JaTour
// Extends SmartItineraryEngine with budget optimization capabilities

import { smartItineraryEngine, SmartItineraryInput, SmartItineraryResult, SmartItineraryDay, SmartDestination } from './smart-itinerary-engine';
import { mlEngine, UserPreferenceProfile } from './ml-engine';
import { budgetEngine, SmartBudgetRecommendation } from './intelligent-budget-engine';

export interface BudgetOptimizationRequest {
  itineraryId: string;
  userId: string; // Add userId to the request
  budgetConstraints: {
    totalBudget: number;
    categoryLimits?: {
      accommodation?: number;
      transportation?: number;
      food?: number;
      activities?: number;
      miscellaneous?: number;
    };
    flexibilityLevel: 'strict' | 'moderate' | 'flexible'; // How strict to be with budget limits
  };
  userPreferences: {
    priorityCategories: string[]; // e.g., ['activities', 'food', 'accommodation']
    costOptimizationGoals: string[]; // e.g., ['maximize_value', 'minimize_expenses', 'balance_quality']
    preferredTransportation: string[]; // e.g., ['public_transport', 'taxi', 'walking']
    timeConstraints?: {
      preferredStartTime?: string;
      preferredEndTime?: string;
      maxDailyTravelTime?: number;
    };
  };
  optimizationGoals: {
    primary: 'cost_minimization' | 'value_maximization' | 'time_efficiency' | 'experience_balance';
    secondary?: string[];
    constraints: {
      mustIncludeDestinations?: string[];
      avoidHighCostOptions?: boolean;
      preferLocalExperiences?: boolean;
    };
  };
}

export interface OptimizedItinerary {
  originalItinerary: SmartItineraryResult;
  optimizedItinerary: SmartItineraryResult;
  budgetAnalysis: {
    originalTotalCost: number;
    optimizedTotalCost: number;
    savings: number;
    savingsPercentage: number;
    categorySavings: Record<string, number>;
  };
  optimizationDetails: {
    appliedOptimizations: BudgetOptimization[];
    costBreakdown: SmartBudgetRecommendation;
    transportationSuggestions: TransportationSuggestion[];
    alternativeOptions: AlternativeDestination[];
  };
  mlInsights: {
    budgetAlignmentScore: number; // How well the optimization matches user preferences
    valueForMoneyScore: number; // Quality vs cost ratio
    riskAssessment: string[]; // Potential issues with the optimized itinerary
  };
}

export interface BudgetOptimization {
  type: 'cost_reduction' | 'value_enhancement' | 'time_optimization' | 'experience_upgrade';
  category: string;
  description: string;
  potentialSavings: number;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
}

export interface TransportationSuggestion {
  day: number;
  originalOption: {
    type: string;
    cost: number;
    duration: number;
  };
  suggestedOption: {
    type: string;
    cost: number;
    duration: number;
    savings: number;
    reason: string;
  };
}

export interface AlternativeDestination {
  originalDestinationId: string;
  alternativeDestination: {
    id: string;
    name: string;
    category: string;
    estimatedCost: number;
    savings: number;
    reason: string;
    tradeoffs: string[];
  };
}

export class BudgetAlignedItineraryEngine {
  private costEstimationService: CostEstimationService;
  private preferenceEmbeddingSystem: PreferenceEmbeddingSystem;
  private optimizationScheduler: OptimizationScheduler;

  constructor() {
    this.costEstimationService = new CostEstimationService();
    this.preferenceEmbeddingSystem = new PreferenceEmbeddingSystem();
    this.optimizationScheduler = new OptimizationScheduler();
  }

  /**
   * Optimize an existing itinerary for budget alignment
   */
  async optimizeBudgetItinerary(request: BudgetOptimizationRequest, originalItinerary?: SmartItineraryResult): Promise<OptimizedItinerary> {
    try {
      // Get the original itinerary
      let itinerary: SmartItineraryResult;
      if (originalItinerary) {
        itinerary = originalItinerary;
      } else {
        const fetchedItinerary = await this.getExistingItinerary(request.itineraryId);
        if (!fetchedItinerary) {
          throw new Error(`Itinerary with ID ${request.itineraryId} not found`);
        }
        itinerary = fetchedItinerary;
      }

      // Get user profile for ML insights
      const userProfile = mlEngine.getUserProfile(request.userId);

      // Embed user preferences into optimization parameters
      const embeddedPreferences = this.preferenceEmbeddingSystem.embedPreferences(
        request.userPreferences,
        userProfile
      );

      // Estimate real-time costs
      const costEstimates = await this.costEstimationService.estimateRealTimeCosts(
        itinerary,
        request.budgetConstraints
      );

      // Schedule optimizations based on goals and constraints
      const optimizationSchedule = this.optimizationScheduler.createOptimizationSchedule(
        request.optimizationGoals,
        embeddedPreferences,
        costEstimates
      );

      // Apply optimizations to create optimized itinerary
      const optimizedItinerary = await this.applyBudgetOptimizations(
        itinerary,
        optimizationSchedule,
        request.budgetConstraints,
        embeddedPreferences
      );

      // Generate transportation suggestions
      const transportationSuggestions = this.generateTransportationSuggestions(
        itinerary.itinerary,
        optimizedItinerary.itinerary,
        request.userPreferences.preferredTransportation
      );

      // Generate alternative destination options
      const alternativeOptions = this.generateAlternativeDestinations(
        itinerary.itinerary,
        request.budgetConstraints,
        embeddedPreferences
      );

      // Calculate budget analysis
      const budgetAnalysis = this.calculateBudgetAnalysis(
        itinerary,
        optimizedItinerary
      );

      // Generate ML insights
      const mlInsights = this.generateOptimizationInsights(
        itinerary,
        optimizedItinerary,
        userProfile,
        request
      );

      return {
        originalItinerary: itinerary,
        optimizedItinerary,
        budgetAnalysis,
        optimizationDetails: {
          appliedOptimizations: optimizationSchedule.appliedOptimizations,
          costBreakdown: optimizedItinerary.budgetBreakdown,
          transportationSuggestions,
          alternativeOptions
        },
        mlInsights
      };

    } catch (error) {
      console.error('Error optimizing budget itinerary:', error);
      throw new Error(`Budget optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getExistingItinerary(itineraryId: string): Promise<SmartItineraryResult | null> {
    // This would typically fetch from database or existing itinerary service
    // For now, return a mock or throw error if not found
    // In real implementation, integrate with itinerary service
    return null; // Placeholder - would need to integrate with actual itinerary retrieval
  }

  private async applyBudgetOptimizations(
    originalItinerary: SmartItineraryResult,
    optimizationSchedule: any,
    budgetConstraints: BudgetOptimizationRequest['budgetConstraints'],
    embeddedPreferences: any
  ): Promise<SmartItineraryResult> {
    let optimizedItinerary = { ...originalItinerary };

    // Apply each optimization in the scheduled order
    for (const optimization of optimizationSchedule.optimizations) {
      switch (optimization.type) {
        case 'cost_reduction':
          optimizedItinerary = await this.applyCostReductionOptimization(
            optimizedItinerary,
            optimization,
            budgetConstraints
          );
          break;
        case 'value_enhancement':
          optimizedItinerary = await this.applyValueEnhancementOptimization(
            optimizedItinerary,
            optimization,
            embeddedPreferences
          );
          break;
        case 'time_optimization':
          optimizedItinerary = await this.applyTimeOptimization(
            optimizedItinerary,
            optimization,
            embeddedPreferences
          );
          break;
        case 'experience_upgrade':
          optimizedItinerary = await this.applyExperienceUpgrade(
            optimizedItinerary,
            optimization,
            budgetConstraints
          );
          break;
      }
    }

    return optimizedItinerary;
  }

  private async applyCostReductionOptimization(
    itinerary: SmartItineraryResult,
    optimization: any,
    budgetConstraints: any
  ): Promise<SmartItineraryResult> {
    // Implement cost reduction logic
    const optimizedDays = itinerary.itinerary.map(day => ({
      ...day,
      totalCost: day.totalCost * 0.9, // Example: 10% cost reduction
      destinations: day.destinations.map(dest => ({
        ...dest,
        estimatedCost: dest.estimatedCost * 0.9
      }))
    }));

    return {
      ...itinerary,
      itinerary: optimizedDays,
      totalCost: optimizedDays.reduce((sum, day) => sum + day.totalCost, 0)
    };
  }

  private async applyValueEnhancementOptimization(
    itinerary: SmartItineraryResult,
    optimization: any,
    embeddedPreferences: any
  ): Promise<SmartItineraryResult> {
    // Implement value enhancement logic
    return itinerary; // Placeholder
  }

  private async applyTimeOptimization(
    itinerary: SmartItineraryResult,
    optimization: any,
    embeddedPreferences: any
  ): Promise<SmartItineraryResult> {
    // Implement time optimization logic
    return itinerary; // Placeholder
  }

  private async applyExperienceUpgrade(
    itinerary: SmartItineraryResult,
    optimization: any,
    budgetConstraints: any
  ): Promise<SmartItineraryResult> {
    // Implement experience upgrade logic
    return itinerary; // Placeholder
  }

  private generateTransportationSuggestions(
    originalDays: SmartItineraryDay[],
    optimizedDays: SmartItineraryDay[],
    preferredTransportation: string[]
  ): TransportationSuggestion[] {
    const suggestions: TransportationSuggestion[] = [];

    // Compare transportation options between original and optimized
    originalDays.forEach((originalDay, index) => {
      const optimizedDay = optimizedDays[index];
      if (originalDay.transportation && optimizedDay.transportation) {
        if (originalDay.transportation.cost > optimizedDay.transportation.cost) {
          suggestions.push({
            day: originalDay.day,
            originalOption: {
              type: originalDay.transportation.type,
              cost: originalDay.transportation.cost,
              duration: originalDay.transportation.duration
            },
            suggestedOption: {
              type: optimizedDay.transportation.type,
              cost: optimizedDay.transportation.cost,
              duration: optimizedDay.transportation.duration,
              savings: originalDay.transportation.cost - optimizedDay.transportation.cost,
              reason: `More cost-effective ${optimizedDay.transportation.type} option`
            }
          });
        }
      }
    });

    return suggestions;
  }

  private generateAlternativeDestinations(
    originalDays: SmartItineraryDay[],
    budgetConstraints: any,
    embeddedPreferences: any
  ): AlternativeDestination[] {
    const alternatives: AlternativeDestination[] = [];

    // Generate alternative destination suggestions
    originalDays.forEach(day => {
      day.destinations.forEach(dest => {
        if (dest.estimatedCost > budgetConstraints.totalBudget * 0.1) { // If destination costs more than 10% of budget
          alternatives.push({
            originalDestinationId: dest.id,
            alternativeDestination: {
              id: `alt_${dest.id}`,
              name: `Budget-friendly alternative to ${dest.name}`,
              category: dest.category,
              estimatedCost: dest.estimatedCost * 0.7,
              savings: dest.estimatedCost * 0.3,
              reason: 'Lower cost option with similar experience',
              tradeoffs: ['Might be less luxurious', 'Could be slightly farther']
            }
          });
        }
      });
    });

    return alternatives;
  }

  private calculateBudgetAnalysis(
    original: SmartItineraryResult,
    optimized: SmartItineraryResult
  ) {
    const originalTotal = original.totalCost;
    const optimizedTotal = optimized.totalCost;
    const savings = originalTotal - optimizedTotal;
    const savingsPercentage = originalTotal > 0 ? (savings / originalTotal) * 100 : 0;

    // Calculate category savings (simplified)
    const categorySavings: Record<string, number> = {
      accommodation: 0,
      transportation: 0,
      food: 0,
      activities: savings * 0.4, // Assume 40% savings from activities
      miscellaneous: savings * 0.1
    };

    return {
      originalTotalCost: originalTotal,
      optimizedTotalCost: optimizedTotal,
      savings,
      savingsPercentage,
      categorySavings
    };
  }

  private generateOptimizationInsights(
    original: SmartItineraryResult,
    optimized: SmartItineraryResult,
    userProfile: UserPreferenceProfile | null,
    request: BudgetOptimizationRequest
  ) {
    const budgetAlignmentScore = this.calculateBudgetAlignmentScore(optimized, request.budgetConstraints);
    const valueForMoneyScore = this.calculateValueForMoneyScore(optimized, userProfile);
    const riskAssessment = this.assessOptimizationRisks(optimized, request);

    return {
      budgetAlignmentScore,
      valueForMoneyScore,
      riskAssessment
    };
  }

  private calculateBudgetAlignmentScore(optimized: SmartItineraryResult, constraints: any): number {
    const totalCost = optimized.totalCost;
    const targetBudget = constraints.totalBudget;
    const variance = Math.abs(totalCost - targetBudget) / targetBudget;

    // Score from 0-1, where 1 is perfect alignment
    return Math.max(0, 1 - variance);
  }

  private calculateValueForMoneyScore(optimized: SmartItineraryResult, profile: UserPreferenceProfile | null): number {
    if (!profile) return 0.5;

    // Simplified calculation based on ML insights
    const priceSensitivity = profile.mlInsights.priceSensitivity;
    const activityPreference = profile.mlInsights.activityPreference;

    // Higher score for balanced value (not too cheap, not too expensive)
    const costEfficiency = 1 - priceSensitivity;
    const experienceQuality = activityPreference;

    return (costEfficiency + experienceQuality) / 2;
  }

  private assessOptimizationRisks(optimized: SmartItineraryResult, request: BudgetOptimizationRequest): string[] {
    const risks: string[] = [];

    if (optimized.totalCost > request.budgetConstraints.totalBudget * 1.1) {
      risks.push('Optimized cost still exceeds budget by more than 10%');
    }

    if (request.optimizationGoals.primary === 'cost_minimization' &&
        optimized.mlInsights.predictedUserSatisfaction < 0.6) {
      risks.push('Heavy cost optimization may reduce user satisfaction');
    }

    if (request.budgetConstraints.flexibilityLevel === 'strict' &&
        optimized.optimization.timeOptimization < 50) {
      risks.push('Strict budget constraints may limit time optimization opportunities');
    }

    return risks;
  }
}

// Cost Estimation Service
class CostEstimationService {
  async estimateRealTimeCosts(itinerary: SmartItineraryResult, budgetConstraints: any) {
    try {
      // Integrate with external pricing APIs
      const [accommodationPrices, transportationPrices, activityPrices] = await Promise.all([
        this.fetchAccommodationPrices(itinerary),
        this.fetchTransportationPrices(itinerary),
        this.fetchActivityPrices(itinerary)
      ]);

      // Get currency exchange rates
      const currencyRates = await this.fetchCurrencyRates();

      // Calculate real-time adjustments
      const realTimeAdjustments = this.calculateRealTimeAdjustments(
        itinerary,
        accommodationPrices,
        transportationPrices,
        activityPrices
      );

      return {
        estimatedCosts: this.calculateAdjustedTotal(itinerary, realTimeAdjustments),
        realTimeAdjustments,
        currencyRates,
        seasonalFactors: this.calculateSeasonalFactors(itinerary)
      };
    } catch (error) {
      console.error('Error estimating real-time costs:', error);
      // Fallback to original costs
      return {
        estimatedCosts: itinerary.totalCost,
        realTimeAdjustments: [],
        currencyRates: {},
        seasonalFactors: {}
      };
    }
  }

  private async fetchAccommodationPrices(itinerary: SmartItineraryResult) {
    // Mock integration with hotel booking APIs (e.g., Booking.com, Agoda)
    // In real implementation, would call actual APIs
    const mockPrices: Record<string, number> = {
      'Malang': 350000,
      'Batu': 400000,
      'Surabaya': 450000,
      'Probolinggo': 300000,
      'Bali': 500000
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return mockPrices;
  }

  private async fetchTransportationPrices(itinerary: SmartItineraryResult) {
    // Mock integration with transportation APIs (e.g., Google Maps, transport companies)
    const mockPrices: Record<string, { car: number; bus: number; flight: number }> = {
      'Malang-Surabaya': { car: 150000, bus: 75000, flight: 0 },
      'Malang-Batu': { car: 50000, bus: 25000, flight: 0 },
      'Surabaya-Bali': { car: 0, bus: 200000, flight: 800000 }
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return mockPrices;
  }

  private async fetchActivityPrices(itinerary: SmartItineraryResult) {
    // Mock integration with activity booking APIs (e.g., Viator, local operators)
    const mockPrices: Record<string, number> = {
      'Gunung Bromo': 250000,
      'Gunung Semeru': 350000,
      'Pantai Balekambang': 50000,
      'Candi Penataran': 25000,
      'Malang City Tour': 150000
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return mockPrices;
  }

  private async fetchCurrencyRates() {
    // Mock integration with currency exchange APIs (e.g., ExchangeRate-API, Fixer)
    // In real implementation, would call actual currency API
    const mockRates = {
      'USD_IDR': 14950,
      'EUR_IDR': 16350,
      'SGD_IDR': 11200,
      'IDR_USD': 0.000067,
      'IDR_EUR': 0.000061,
      'IDR_SGD': 0.000089
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 50));

    return mockRates;
  }

  private calculateRealTimeAdjustments(
    itinerary: SmartItineraryResult,
    accommodationPrices: Record<string, number>,
    transportationPrices: Record<string, any>,
    activityPrices: Record<string, number>
  ) {
    const adjustments: Array<{
      type: string;
      day: number;
      originalPrice: number;
      adjustedPrice: number;
      reason: string;
    }> = [];

    // Check accommodation prices
    itinerary.itinerary.forEach(day => {
      // This is a simplified implementation
      // In real implementation, would match specific accommodations
      adjustments.push({
        type: 'accommodation',
        day: day.day,
        originalPrice: day.totalCost * 0.4, // Assume 40% is accommodation
        adjustedPrice: day.totalCost * 0.4 * 1.1, // 10% price increase
        reason: 'Real-time market rates'
      });
    });

    return adjustments;
  }

  private calculateAdjustedTotal(itinerary: SmartItineraryResult, adjustments: any[]) {
    let adjustedTotal = itinerary.totalCost;

    adjustments.forEach(adjustment => {
      adjustedTotal += (adjustment.adjustedPrice - adjustment.originalPrice);
    });

    return adjustedTotal;
  }

  private calculateSeasonalFactors(itinerary: SmartItineraryResult) {
    // Calculate seasonal pricing factors
    const currentMonth = new Date().getMonth() + 1;
    const peakSeason = [6, 7, 8, 12, 1]; // Peak tourist months
    const shoulderSeason = [4, 5, 9, 10, 11]; // Shoulder season

    let factor = 1.0;
    if (peakSeason.includes(currentMonth)) {
      factor = 1.3;
    } else if (shoulderSeason.includes(currentMonth)) {
      factor = 1.1;
    }

    return {
      factor,
      season: peakSeason.includes(currentMonth) ? 'peak' :
              shoulderSeason.includes(currentMonth) ? 'shoulder' : 'low',
      reason: `Current month (${currentMonth}) seasonal adjustment`
    };
  }
}

// Preference Embedding System
class PreferenceEmbeddingSystem {
  embedPreferences(userPreferences: any, userProfile: UserPreferenceProfile | null) {
    // Convert user preferences into optimization parameters
    const embedded = {
      costWeights: this.calculateCostWeights(userPreferences),
      timeWeights: this.calculateTimeWeights(userPreferences),
      experienceWeights: this.calculateExperienceWeights(userPreferences),
      mlAdjustments: userProfile ? this.applyMLAdjustments(userPreferences, userProfile) : {}
    };

    return embedded;
  }

  private calculateCostWeights(preferences: any) {
    const weights: Record<string, number> = {
      accommodation: 1.0,
      transportation: 1.0,
      food: 1.0,
      activities: 1.0,
      miscellaneous: 1.0
    };

    // Adjust based on priority categories
    preferences.priorityCategories?.forEach((category: string) => {
      if (weights[category] !== undefined) {
        weights[category] *= 1.2; // Increase weight for priority categories
      }
    });

    return weights;
  }

  private calculateTimeWeights(preferences: any) {
    return {
      efficiency: preferences.timeConstraints ? 1.2 : 1.0,
      flexibility: preferences.costOptimizationGoals?.includes('balance_quality') ? 1.1 : 1.0
    };
  }

  private calculateExperienceWeights(preferences: any) {
    return {
      quality: preferences.costOptimizationGoals?.includes('maximize_value') ? 1.3 : 1.0,
      quantity: preferences.costOptimizationGoals?.includes('minimize_expenses') ? 0.8 : 1.0
    };
  }

  private applyMLAdjustments(preferences: any, profile: UserPreferenceProfile) {
    return {
      priceSensitivityAdjustment: profile.mlInsights.priceSensitivity,
      activityPreferenceAdjustment: profile.mlInsights.activityPreference,
      spontaneityAdjustment: profile.mlInsights.spontaneityScore
    };
  }
}

// Optimization Scheduler
class OptimizationScheduler {
  createOptimizationSchedule(goals: any, embeddedPreferences: any, costEstimates: any) {
    const optimizations: BudgetOptimization[] = [];

    // Schedule optimizations based on goals
    if (goals.primary === 'cost_minimization') {
      optimizations.push({
        type: 'cost_reduction',
        category: 'activities',
        description: 'Reduce activity costs while maintaining quality',
        potentialSavings: costEstimates.estimatedCosts * 0.15,
        impact: 'high',
        confidence: 0.8
      });
    }

    if (goals.primary === 'value_maximization') {
      optimizations.push({
        type: 'value_enhancement',
        category: 'experience',
        description: 'Enhance value through better destination selection',
        potentialSavings: 0,
        impact: 'medium',
        confidence: 0.7
      });
    }

    return {
      optimizations,
      appliedOptimizations: optimizations
    };
  }
}

// Singleton instance
export const budgetAlignedItineraryEngine = new BudgetAlignedItineraryEngine();