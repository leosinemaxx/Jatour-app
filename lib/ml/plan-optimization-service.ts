// Budget-as-a-Plan (BaaP) - Plan Optimization Service
// Creates guaranteed plans with 95% budget adherence through optimization

import { AdherencePrediction, AdherencePredictionEngine } from './adherence-prediction-engine';

export interface OptimizationInput {
  userId: string;
  originalItinerary: any; // From ItineraryGenerator
  originalBudget: {
    totalBudget: number;
    categoryBreakdown: {
      accommodation: number;
      transportation: number;
      food: number;
      activities: number;
      miscellaneous: number;
    };
  };
  adherencePrediction: AdherencePrediction;
  userProfile: any;
  constraints: {
    maxBudgetIncrease?: number; // Maximum percentage increase allowed
    minAdherenceTarget: number; // Target adherence (0.95 for 95%)
    allowDestinationChanges: boolean;
    allowTransportationChanges: boolean;
    allowAccommodationChanges: boolean;
  };
}

export interface OptimizedPlan {
  success: boolean;
  guaranteedAdherence: number; // Guaranteed adherence percentage
  optimizedItinerary: any; // Modified itinerary
  optimizedBudget: {
    totalBudget: number;
    categoryBreakdown: {
      accommodation: number;
      transportation: number;
      food: number;
      activities: number;
      miscellaneous: number;
    };
    bufferAmount: number; // Additional buffer for guarantee
  };
  optimizations: Array<{
    type: string;
    description: string;
    impact: number; // Improvement in adherence probability
    cost: number; // Cost of this optimization
  }>;
  tacticalSuggestions: Array<{
    type: string;
    description: string;
    potentialSavings: number;
    ease: string;
    alternatives: string[];
  }>;
  guarantee: {
    coverage: number; // 95%
    conditions: string[];
    fallbackOptions: Array<{
      trigger: string;
      action: string;
      coverage: number;
    }>;
  };
  confidence: number;
}

export class PlanOptimizationService {
  private adherenceEngine: AdherencePredictionEngine | null;

  constructor(adherenceEngine: AdherencePredictionEngine | null = null) {
    this.adherenceEngine = adherenceEngine;
  }

  optimizePlan(input: OptimizationInput): OptimizedPlan {
    console.log('[PlanOptimizationService] Starting plan optimization for user:', input.userId);

    // Start with original plan
    let currentItinerary = { ...input.originalItinerary };
    let currentBudget = { ...input.originalBudget };
    let currentAdherence = input.adherencePrediction.successProbability;

    const optimizations: Array<{
      type: string;
      description: string;
      impact: number;
      cost: number;
    }> = [];

    const tacticalSuggestions: Array<{
      type: string;
      description: string;
      potentialSavings: number;
      ease: string;
      alternatives: string[];
    }> = [];

    // Step 1: Budget optimization
    const budgetOptimization = this.optimizeBudget(input, currentAdherence);
    if (budgetOptimization.applied) {
      currentBudget = budgetOptimization.optimizedBudget;
      currentAdherence = Math.min(currentAdherence + budgetOptimization.impact, 0.99);
      optimizations.push(...budgetOptimization.optimizations);
    }

    // Step 2: Itinerary optimization
    const itineraryOptimization = this.optimizeItinerary(input, currentItinerary, currentBudget, currentAdherence);
    if (itineraryOptimization.applied) {
      currentItinerary = itineraryOptimization.optimizedItinerary;
      currentAdherence = Math.min(currentAdherence + itineraryOptimization.impact, 0.99);
      optimizations.push(...itineraryOptimization.optimizations);
    }

    // Step 3: Generate tactical suggestions
    tacticalSuggestions.push(...this.generateTacticalSuggestions(currentItinerary, currentBudget));

    // Step 4: Calculate final guarantee
    if (!this.adherenceEngine) {
      throw new Error('AdherencePredictionEngine not provided');
    }
    const finalPrediction = this.adherenceEngine.predictAdherence({
      userId: input.userId,
      itineraryId: currentItinerary.itineraryId || 'optimized',
      totalBudget: currentBudget.totalBudget,
      categoryBreakdown: currentBudget.categoryBreakdown,
      userProfile: input.userProfile,
      itineraryDetails: {
        days: currentItinerary.summary?.totalDays || input.originalItinerary.summary?.totalDays || 1,
        destinations: currentItinerary.days?.reduce((sum: number, day: any) => sum + (day.destinations?.length || 0), 0) || 0,
        cities: input.originalItinerary.days?.[0]?.destinations?.[0]?.location?.split(', ') || [],
        startDate: input.originalItinerary.days?.[0]?.date || new Date().toISOString().split('T')[0]
      }
    });

    const guaranteedAdherence = Math.min(finalPrediction.successProbability, input.constraints.minAdherenceTarget);

    // Step 5: Create guarantee structure
    const guarantee = this.createGuarantee(guaranteedAdherence, currentBudget, optimizations);

    // Step 6: Calculate buffer amount
    const bufferAmount = this.calculateBufferAmount(currentBudget.totalBudget, guaranteedAdherence, input.constraints.minAdherenceTarget);

    return {
      success: guaranteedAdherence >= input.constraints.minAdherenceTarget,
      guaranteedAdherence,
      optimizedItinerary: currentItinerary,
      optimizedBudget: {
        ...currentBudget,
        bufferAmount
      },
      optimizations,
      tacticalSuggestions,
      guarantee,
      confidence: finalPrediction.confidence
    };
  }

  private optimizeBudget(
    input: OptimizationInput,
    currentAdherence: number
  ): {
    applied: boolean;
    optimizedBudget: any;
    impact: number;
    optimizations: Array<{ type: string; description: string; impact: number; cost: number }>;
  } {
    const optimizations: Array<{ type: string; description: string; impact: number; cost: number }> = [];
    let optimizedBudget = { ...input.originalBudget };
    let totalImpact = 0;

    // Check if budget increase is needed and allowed
    if (currentAdherence < input.constraints.minAdherenceTarget) {
      const maxIncrease = input.constraints.maxBudgetIncrease || 0.2; // Default 20%
      const requiredIncrease = Math.max(0, (input.constraints.minAdherenceTarget - currentAdherence) * 1.5);
      const actualIncrease = Math.min(requiredIncrease, maxIncrease);

      if (actualIncrease > 0) {
        const increaseAmount = actualIncrease * input.originalBudget.totalBudget;
        optimizedBudget.totalBudget += increaseAmount;

        // Distribute increase across categories proportionally
        const totalOriginal = Object.values(input.originalBudget.categoryBreakdown).reduce((a: number, b: number) => a + b, 0);
        Object.keys(optimizedBudget.categoryBreakdown).forEach(category => {
          const proportion = input.originalBudget.categoryBreakdown[category as keyof typeof input.originalBudget.categoryBreakdown] / totalOriginal;
          optimizedBudget.categoryBreakdown[category as keyof typeof optimizedBudget.categoryBreakdown] += increaseAmount * proportion;
        });

        optimizations.push({
          type: 'budget_increase',
          description: `Increased total budget by ${Math.round(actualIncrease * 100)}% (IDR ${increaseAmount.toLocaleString()})`,
          impact: actualIncrease * 0.8, // 80% of increase contributes to adherence
          cost: increaseAmount
        });

        totalImpact += actualIncrease * 0.8;
      }
    }

    // Reallocate budget within categories for better adherence
    const reallocation = this.optimizeCategoryAllocation(optimizedBudget, input);
    if (reallocation.applied) {
      optimizedBudget = reallocation.optimizedBudget;
      optimizations.push(...reallocation.optimizations);
      totalImpact += reallocation.impact;
    }

    return {
      applied: optimizations.length > 0,
      optimizedBudget,
      impact: totalImpact,
      optimizations
    };
  }

  private optimizeCategoryAllocation(
    budget: any,
    input: OptimizationInput
  ): {
    applied: boolean;
    optimizedBudget: any;
    impact: number;
    optimizations: Array<{ type: string; description: string; impact: number; cost: number }>;
  } {
    const optimizations: Array<{ type: string; description: string; impact: number; cost: number }> = [];
    const optimizedBudget = { ...budget };
    let totalImpact = 0;

    // Identify high-risk categories from prediction
    const highRiskCategories = input.adherencePrediction.riskFactors
      .filter(risk => risk.factor.toLowerCase().includes('budget') || risk.factor.toLowerCase().includes('category'))
      .map(risk => {
        if (risk.factor.toLowerCase().includes('accommodation')) return 'accommodation';
        if (risk.factor.toLowerCase().includes('transportation')) return 'transportation';
        if (risk.factor.toLowerCase().includes('food')) return 'food';
        if (risk.factor.toLowerCase().includes('activities')) return 'activities';
        return 'miscellaneous';
      });

    // Reallocate from high-risk to low-risk categories
    highRiskCategories.forEach(category => {
      const currentAmount = optimizedBudget.categoryBreakdown[category];
      const reallocationAmount = Math.min(currentAmount * 0.1, optimizedBudget.totalBudget * 0.05); // Max 10% of category or 5% of total

      if (reallocationAmount > 0) {
        // Move to buffer/miscellaneous
        optimizedBudget.categoryBreakdown[category] -= reallocationAmount;
        optimizedBudget.categoryBreakdown.miscellaneous += reallocationAmount;

        optimizations.push({
          type: 'category_reallocation',
          description: `Reallocated IDR ${reallocationAmount.toLocaleString()} from ${category} to buffer`,
          impact: 0.02, // Small improvement
          cost: 0 // No additional cost, just reallocation
        });

        totalImpact += 0.02;
      }
    });

    return {
      applied: optimizations.length > 0,
      optimizedBudget,
      impact: totalImpact,
      optimizations
    };
  }

  private optimizeItinerary(
    input: OptimizationInput,
    currentItinerary: any,
    currentBudget: any,
    currentAdherence: number
  ): {
    applied: boolean;
    optimizedItinerary: any;
    impact: number;
    optimizations: Array<{ type: string; description: string; impact: number; cost: number }>;
  } {
    const optimizations: Array<{ type: string; description: string; impact: number; cost: number }> = [];
    const optimizedItinerary = { ...currentItinerary };
    let totalImpact = 0;

    // Transportation optimization
    if (input.constraints.allowTransportationChanges) {
      const transportOpt = this.optimizeTransportation(optimizedItinerary, currentBudget);
      if (transportOpt.applied) {
        optimizedItinerary.days = transportOpt.optimizedDays;
        optimizations.push(...transportOpt.optimizations);
        totalImpact += transportOpt.impact;
      }
    }

    // Accommodation optimization
    if (input.constraints.allowAccommodationChanges) {
      const accommodationOpt = this.optimizeAccommodation(optimizedItinerary, currentBudget);
      if (accommodationOpt.applied) {
        optimizedItinerary.days = accommodationOpt.optimizedDays;
        optimizations.push(...accommodationOpt.optimizations);
        totalImpact += accommodationOpt.impact;
      }
    }

    // Activity optimization
    const activityOpt = this.optimizeActivities(optimizedItinerary, currentBudget);
    if (activityOpt.applied) {
      optimizedItinerary.days = activityOpt.optimizedDays;
      optimizations.push(...activityOpt.optimizations);
      totalImpact += activityOpt.impact;
    }

    return {
      applied: optimizations.length > 0,
      optimizedItinerary,
      impact: totalImpact,
      optimizations
    };
  }

  private optimizeTransportation(
    itinerary: any,
    budget: any
  ): {
    applied: boolean;
    optimizedDays: any[];
    impact: number;
    optimizations: Array<{ type: string; description: string; impact: number; cost: number }>;
  } {
    const optimizations: Array<{ type: string; description: string; impact: number; cost: number }> = [];
    const optimizedDays = [...itinerary.days];
    let totalImpact = 0;

    // Look for expensive transportation options
    optimizedDays.forEach((day: any, index: number) => {
      if (day.transportation) {
        const currentCost = day.transportation.cost;
        const budgetAllocation = budget.categoryBreakdown.transportation / optimizedDays.length;

        if (currentCost > budgetAllocation * 1.2) { // 20% over budget
          // Suggest cheaper alternative
          const savings = Math.min(currentCost * 0.3, currentCost - budgetAllocation);
          optimizedDays[index] = {
            ...day,
            transportation: {
              ...day.transportation,
              cost: currentCost - savings,
              type: this.getCheaperTransportAlternative(day.transportation.type)
            }
          };

          optimizations.push({
            type: 'transportation_change',
            description: `Switched to cheaper transportation option, saving IDR ${savings.toLocaleString()}`,
            impact: 0.03,
            cost: -savings // Negative cost = savings
          });

          totalImpact += 0.03;
        }
      }
    });

    return {
      applied: optimizations.length > 0,
      optimizedDays,
      impact: totalImpact,
      optimizations
    };
  }

  private getCheaperTransportAlternative(currentType: string): string {
    const alternatives: Record<string, string> = {
      'taxi': 'public_transport',
      'rental_car': 'taxi',
      'private_car': 'rental_car',
      'flight': 'train'
    };

    return alternatives[currentType.toLowerCase()] || 'public_transport';
  }

  private optimizeAccommodation(
    itinerary: any,
    budget: any
  ): {
    applied: boolean;
    optimizedDays: any[];
    impact: number;
    optimizations: Array<{ type: string; description: string; impact: number; cost: number }>;
  } {
    const optimizations: Array<{ type: string; description: string; impact: number; cost: number }> = [];
    const optimizedDays = [...itinerary.days];
    let totalImpact = 0;

    // Check accommodation costs
    optimizedDays.forEach((day: any, index: number) => {
      if (day.accommodation) {
        const currentCost = day.accommodation.cost;
        const budgetAllocation = budget.categoryBreakdown.accommodation / optimizedDays.length;

        if (currentCost > budgetAllocation * 1.3) { // 30% over budget
          const savings = Math.min(currentCost * 0.2, currentCost - budgetAllocation);
          optimizedDays[index] = {
            ...day,
            accommodation: {
              ...day.accommodation,
              cost: currentCost - savings,
              type: this.getCheaperAccommodationType(day.accommodation.type)
            }
          };

          optimizations.push({
            type: 'accommodation_downgrade',
            description: `Downgraded accommodation, saving IDR ${savings.toLocaleString()}`,
            impact: 0.04,
            cost: -savings
          });

          totalImpact += 0.04;
        }
      }
    });

    return {
      applied: optimizations.length > 0,
      optimizedDays,
      impact: totalImpact,
      optimizations
    };
  }

  private getCheaperAccommodationType(currentType: string): string {
    const typeHierarchy = ['luxury', 'moderate', 'budget'];
    const currentIndex = typeHierarchy.indexOf(currentType.toLowerCase());

    if (currentIndex > 0) {
      return typeHierarchy[currentIndex - 1];
    }

    return 'budget';
  }

  private optimizeActivities(
    itinerary: any,
    budget: any
  ): {
    applied: boolean;
    optimizedDays: any[];
    impact: number;
    optimizations: Array<{ type: string; description: string; impact: number; cost: number }>;
  } {
    const optimizations: Array<{ type: string; description: string; impact: number; cost: number }> = [];
    const optimizedDays = [...itinerary.days];
    let totalImpact = 0;

    // Check activity costs and optimize
    optimizedDays.forEach((day: any, index: number) => {
      const activitiesBudget = budget.categoryBreakdown.activities / optimizedDays.length;
      const currentActivitiesCost = day.destinations?.reduce((sum: number, dest: any) => sum + (dest.estimatedCost || 0), 0) || 0;

      if (currentActivitiesCost > activitiesBudget * 1.2) {
        // Remove or replace expensive activities
        const sortedActivities = [...(day.destinations || [])].sort((a: any, b: any) => (b.estimatedCost || 0) - (a.estimatedCost || 0));
        const expensiveActivity = sortedActivities[0];

        if (expensiveActivity && expensiveActivity.estimatedCost > activitiesBudget * 0.3) {
          // Replace with cheaper alternative
          const savings = Math.min(expensiveActivity.estimatedCost * 0.5, expensiveActivity.estimatedCost - (activitiesBudget * 0.2));

          optimizedDays[index] = {
            ...day,
            destinations: day.destinations.map((dest: any) =>
              dest.id === expensiveActivity.id
                ? { ...dest, estimatedCost: dest.estimatedCost - savings }
                : dest
            )
          };

          optimizations.push({
            type: 'destination_swap',
            description: `Optimized ${expensiveActivity.name} cost, saving IDR ${savings.toLocaleString()}`,
            impact: 0.02,
            cost: -savings
          });

          totalImpact += 0.02;
        }
      }
    });

    return {
      applied: optimizations.length > 0,
      optimizedDays,
      impact: totalImpact,
      optimizations
    };
  }

  private generateTacticalSuggestions(
    itinerary: any,
    budget: any
  ): Array<{
    type: string;
    description: string;
    potentialSavings: number;
    ease: string;
    alternatives: string[];
  }> {
    const suggestions: Array<{
      type: string;
      description: string;
      potentialSavings: number;
      ease: string;
      alternatives: string[];
    }> = [];

    // Transportation swap suggestions
    itinerary.days?.forEach((day: any) => {
      if (day.transportation && day.transportation.type === 'taxi') {
        suggestions.push({
          type: 'swap_transport',
          description: `Replace taxi rides with public transport or walking where possible`,
          potentialSavings: Math.min(day.transportation.cost * 0.4, 100000),
          ease: 'medium',
          alternatives: ['Public transport', 'Walking', 'Ride-sharing']
        });
      }
    });

    // Restaurant change suggestions
    if (budget.categoryBreakdown.food > 0) {
      const dailyFoodBudget = budget.categoryBreakdown.food / (itinerary.days?.length || 1);
      if (dailyFoodBudget > 100000) { // If daily food budget is high
        suggestions.push({
          type: 'change_restaurant',
          description: `Choose local warungs instead of tourist restaurants`,
          potentialSavings: Math.min(dailyFoodBudget * 0.3, 50000),
          ease: 'easy',
          alternatives: ['Local warungs', 'Street food', 'Food markets']
        });
      }
    }

    // Destination cutting suggestions
    const totalDestinations = itinerary.days?.reduce((sum: number, day: any) => sum + (day.destinations?.length || 0), 0) || 0;
    if (totalDestinations > 8) {
      const destinationsToCut = Math.max(1, Math.floor(totalDestinations * 0.1));
      suggestions.push({
        type: 'cut_destination',
        description: `Remove ${destinationsToCut} less essential destination(s)`,
        potentialSavings: budget.categoryBreakdown.activities * 0.15,
        ease: 'hard',
        alternatives: ['Focus on top-rated destinations', 'Combine nearby attractions']
      });
    }

    // Accommodation downgrade suggestions
    itinerary.days?.forEach((day: any) => {
      if (day.accommodation && day.accommodation.type === 'luxury') {
        suggestions.push({
          type: 'downgrade_accommodation',
          description: `Switch from luxury to moderate accommodation`,
          potentialSavings: Math.min(day.accommodation.cost * 0.4, 300000),
          ease: 'medium',
          alternatives: ['Moderate hotels', 'Boutique stays', 'Serviced apartments']
        });
      }
    });

    return suggestions;
  }

  private createGuarantee(
    adherence: number,
    budget: any,
    optimizations: Array<{ type: string; description: string; impact: number; cost: number }>
  ): {
    coverage: number;
    conditions: string[];
    fallbackOptions: Array<{ trigger: string; action: string; coverage: number }>;
  } {
    const coverage = Math.min(adherence, 0.95);
    const conditions = [
      'Follow the optimized itinerary and budget allocations',
      'Use recommended transportation options',
      'Stick to suggested accommodation choices',
      'Monitor daily spending against allocated amounts',
      'Report any significant changes immediately'
    ];

    const fallbackOptions = [
      {
        trigger: 'Spending exceeds 10% of daily budget',
        action: 'Implement tactical suggestions or contact support',
        coverage: 0.85
      },
      {
        trigger: 'Unexpected transportation costs',
        action: 'Use public transport alternatives',
        coverage: 0.90
      },
      {
        trigger: 'Accommodation price changes',
        action: 'Downgrade to moderate options',
        coverage: 0.88
      }
    ];

    return {
      coverage,
      conditions,
      fallbackOptions
    };
  }

  private calculateBufferAmount(
    totalBudget: number,
    currentAdherence: number,
    targetAdherence: number
  ): number {
    const adherenceGap = targetAdherence - currentAdherence;
    if (adherenceGap <= 0) return 0;

    // Calculate buffer as percentage of total budget based on adherence gap
    const bufferPercentage = Math.min(adherenceGap * 2, 0.15); // Max 15% buffer
    return totalBudget * bufferPercentage;
  }
}

// Singleton instance
export const planOptimizationService = new PlanOptimizationService(null);