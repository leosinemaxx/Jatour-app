// Intelligent Budget Calculation & Recommendation Engine for JaTour
// Smart budget optimization with ML-based spending pattern analysis

import { mlEngine, UserPreferenceProfile } from './ml-engine';

export interface BudgetCalculationInput {
  userId: string;
  preferences: {
    budget: number;
    days: number;
    travelers: number;
    accommodationType: 'budget' | 'moderate' | 'luxury';
    cities: string[];
    interests: string[];
  };
  destinations: Array<{
    id: string;
    name: string;
    location: string;
    category: string;
    estimatedCost: number;
    duration: number;
  }>;
}

export interface SmartBudgetRecommendation {
  totalBudget: number;
  categoryBreakdown: {
    accommodation: { allocated: number; recommended: number; savings: number };
    transportation: { allocated: number; recommended: number; savings: number };
    food: { allocated: number; recommended: number; savings: number };
    activities: { allocated: number; recommended: number; savings: number };
    miscellaneous: { allocated: number; recommended: number; savings: number };
  };
  optimizations: BudgetOptimization[];
  confidence: number;
  reasoning: string[];
}

export interface BudgetOptimization {
  type: 'allocation' | 'timing' | 'location' | 'activity';
  category: string;
  potentialSavings: number;
  description: string;
  impact: 'low' | 'medium' | 'high';
}

export class IntelligentBudgetEngine {
  private baseCosts = {
    accommodation: {
      budget: 150000, // per night per person
      moderate: 350000,
      luxury: 800000
    },
    transportation: {
      local: 50000, // per day per person
      intercity: 200000, // per trip per person
      airport: 150000 // per trip per person
    },
    food: {
      budget: 80000, // per day per person
      moderate: 150000,
      luxury: 300000
    },
    activities: {
      budget: 100000, // per day per person
      moderate: 200000,
      luxury: 400000
    }
  };

  private seasonalMultipliers = {
    peak: 1.4, // High season (June-August, December-January)
    normal: 1.0, // Regular season
    low: 0.8  // Low season (March-May, September-November)
  };

  calculateSmartBudget(input: BudgetCalculationInput): SmartBudgetRecommendation {
    const profile = mlEngine.getUserProfile(input.userId);
    const seasonalFactor = this.getSeasonalFactor();
    const cityMultipliers = this.getCityMultipliers(input.preferences.cities);

    // Calculate base budget using ML insights
    const baseCalculation = this.calculateBaseBudget(input, seasonalFactor, cityMultipliers);
    
    // Apply ML-based optimizations
    const optimizedCalculation = this.applyMLOptimizations(baseCalculation, profile, input);
    
    // Generate specific recommendations
    const recommendations = this.generateBudgetRecommendations(optimizedCalculation, profile, input);

    return {
      totalBudget: optimizedCalculation.total,
      categoryBreakdown: optimizedCalculation.breakdown,
      optimizations: recommendations.optimizations,
      confidence: recommendations.confidence,
      reasoning: recommendations.reasoning
    };
  }

  private calculateBaseBudget(input: BudgetCalculationInput, seasonalFactor: number, cityMultipliers: Record<string, number>) {
    const { preferences, destinations } = input;
    const days = preferences.days;
    const travelers = preferences.travelers;

    // Accommodation calculation with city variation
    const avgCityMultiplier = Object.values(cityMultipliers).reduce((a, b) => a + b, 0) / Object.keys(cityMultipliers).length || 1;
    const accommodationBase = this.baseCosts.accommodation[preferences.accommodationType] * days * travelers * seasonalFactor * avgCityMultiplier;

    // Transportation calculation
    const cityTransportCosts = preferences.cities.map(city => 
      (cityMultipliers[city] || 1) * this.baseCosts.transportation.local * days / preferences.cities.length
    );
    const transportationBase = cityTransportCosts.reduce((a, b) => a + b, 0) * travelers;

    // Food calculation with destination diversity factor
    const uniqueCategories = new Set(destinations.map(d => d.category)).size;
    const diversityFactor = Math.min(1 + (uniqueCategories * 0.1), 1.5);
    const foodBase = this.baseCosts.food[preferences.accommodationType] * days * travelers * diversityFactor;

    // Activities calculation with interest alignment
    const activityCosts = destinations.reduce((total, dest) => total + dest.estimatedCost, 0);
    const interestAlignment = this.calculateInterestAlignment(preferences.interests, destinations);
    const activitiesBase = activityCosts * interestAlignment * travelers;

    // Miscellaneous (shopping, emergency, tips, etc.)
    const miscBase = (accommodationBase + transportationBase + foodBase + activitiesBase) * 0.15;

    const total = accommodationBase + transportationBase + foodBase + activitiesBase + miscBase;

    return {
      total,
      breakdown: {
        accommodation: { allocated: preferences.budget * 0.35, recommended: accommodationBase, savings: 0 },
        transportation: { allocated: preferences.budget * 0.20, recommended: transportationBase, savings: 0 },
        food: { allocated: preferences.budget * 0.25, recommended: foodBase, savings: 0 },
        activities: { allocated: preferences.budget * 0.15, recommended: activitiesBase, savings: 0 },
        miscellaneous: { allocated: preferences.budget * 0.05, recommended: miscBase, savings: 0 }
      }
    };
  }

  private applyMLOptimizations(baseCalculation: any, profile: UserPreferenceProfile | null, input: BudgetCalculationInput) {
    if (!profile) return baseCalculation;

    const optimized = { ...baseCalculation };
    const optimizations: BudgetOptimization[] = [];

    // Adjust based on price sensitivity
    if (profile.mlInsights.priceSensitivity > 0.7) {
      // High price sensitivity - prioritize cost-effective options
      optimized.breakdown.activities.recommended *= 0.85;
      optimized.breakdown.food.recommended *= 0.90;
      optimizations.push({
        type: 'allocation',
        category: 'activities',
        potentialSavings: baseCalculation.breakdown.activities.recommended * 0.15,
        description: 'Focus on free or low-cost activities based on your price-conscious behavior',
        impact: 'high'
      });
    }

    // Adjust based on activity preference
    if (profile.mlInsights.activityPreference > 0.7) {
      // Prefers active experiences - allocate more to activities
      const reallocation = baseCalculation.total * 0.05;
      optimized.breakdown.activities.recommended += reallocation;
      optimized.breakdown.miscellaneous.recommended -= reallocation;
      optimizations.push({
        type: 'allocation',
        category: 'activities',
        potentialSavings: 0,
        description: 'Increased activity budget based on your preference for active experiences',
        impact: 'medium'
      });
    }

    // Adjust based on spontaneity score
    if (profile.mlInsights.spontaneityScore > 0.6) {
      // High spontaneity - increase miscellaneous budget for unexpected expenses
      optimized.breakdown.miscellaneous.recommended *= 1.3;
      optimizations.push({
        type: 'allocation',
        category: 'miscellaneous',
        potentialSavings: 0,
        description: 'Increased miscellaneous budget for spontaneous opportunities',
        impact: 'medium'
      });
    }

    // Time-based optimizations
    const dayOptimizations = this.calculateDayByDayOptimizations(input, profile);
    optimizations.push(...dayOptimizations);

    // Location-based optimizations
    const locationOptimizations = this.calculateLocationOptimizations(input, profile);
    optimizations.push(...locationOptimizations);

    // Recalculate total
    optimized.total = Object.values(optimized.breakdown).reduce((sum: number, cat: any) => sum + cat.recommended, 0);

    // Calculate savings for each category
    Object.keys(optimized.breakdown).forEach(category => {
      const breakdown = optimized.breakdown[category];
      breakdown.savings = Math.max(0, breakdown.allocated - breakdown.recommended);
    });

    return optimized;
  }

  private generateBudgetRecommendations(optimizedCalculation: any, profile: UserPreferenceProfile | null, input: BudgetCalculationInput) {
    const reasoning: string[] = [];
    let confidence = 0.7;

    if (profile) {
      reasoning.push(`Based on your ${profile.mlInsights.priceSensitivity > 0.6 ? 'price-conscious' : 'quality-focused'} spending patterns`);
      
      if (profile.mlInsights.activityPreference > 0.7) {
        reasoning.push('adjusted for your preference for active experiences');
        confidence += 0.1;
      }

      if (profile.implicitPreferences.preferredPriceRange.max < optimizedCalculation.total / input.preferences.travelers) {
        reasoning.push('budget adjusted to match your typical spending range');
      }
    } else {
      reasoning.push('Budget calculated using standard travel cost estimates');
      confidence -= 0.2;
    }

    reasoning.push(`optimized for ${input.preferences.days} days with ${input.preferences.travelers} travelers`);
    
    if (input.preferences.cities.length > 1) {
      reasoning.push('includes intercity transportation costs');
    }

    return {
      optimizations: [], // Will be populated by the calling method
      confidence: Math.min(confidence, 1.0),
      reasoning
    };
  }

  private getSeasonalFactor(): number {
    const month = new Date().getMonth() + 1;
    // Peak season: June-August (6-8), December-January (12-1)
    if ([6, 7, 8, 12, 1].includes(month)) {
      return this.seasonalMultipliers.peak;
    }
    // Low season: March-May (3-5), September-November (9-11)
    if ([3, 4, 5, 9, 10, 11].includes(month)) {
      return this.seasonalMultipliers.low;
    }
    return this.seasonalMultipliers.normal;
  }

  private getCityMultipliers(cities: string[]): Record<string, number> {
    // Indonesia city cost multipliers
    const cityCosts: Record<string, number> = {
      'Jakarta': 1.3,
      'Bali': 1.2,
      'Yogyakarta': 0.8,
      'Bandung': 0.9,
      'Surabaya': 0.85,
      'Medan': 0.75,
      'Makassar': 0.7,
      'Palembang': 0.65,
      'Semarang': 0.8,
      'Denpasar': 1.2
    };

    const multipliers: Record<string, number> = {};
    cities.forEach(city => {
      multipliers[city] = cityCosts[city] || 1.0;
    });

    return multipliers;
  }

  private calculateInterestAlignment(interests: string[], destinations: any[]): number {
    if (interests.length === 0) return 1.0;

    const destinationCategories = destinations.map(d => d.category.toLowerCase());
    const matchingCategories = interests.filter(interest =>
      destinationCategories.some(cat => cat.includes(interest.toLowerCase()))
    );

    return Math.min(1 + (matchingCategories.length * 0.2), 1.8);
  }

  private calculateDayByDayOptimizations(input: BudgetCalculationInput, profile: UserPreferenceProfile | null): BudgetOptimization[] {
    const optimizations: BudgetOptimization[] = [];
    const { preferences, destinations } = input;

    // Group destinations by day/city
    const dailyGroups = this.groupDestinationsByDay(destinations, preferences.days);

    dailyGroups.forEach((dayGroup, dayIndex) => {
      // Check for cost-effective dining options
      const foodSavings = this.calculateFoodOptimizations(dayGroup, profile, preferences.travelers);
      if (foodSavings > 0) {
        optimizations.push({
          type: 'timing',
          category: 'food',
          potentialSavings: foodSavings,
          description: `Day ${dayIndex + 1}: Local food markets can save 20-30% on meals`,
          impact: 'medium'
        });
      }

      // Check for activity bundling opportunities
      const activityBundles = this.calculateActivityBundling(dayGroup);
      if (activityBundles > 0) {
        optimizations.push({
          type: 'activity',
          category: 'activities',
          potentialSavings: activityBundles,
          description: `Day ${dayIndex + 1}: Bundle nearby activities for group discounts`,
          impact: 'low'
        });
      }
    });

    return optimizations;
  }

  private calculateLocationOptimizations(input: BudgetCalculationInput, profile: UserPreferenceProfile | null): BudgetOptimization[] {
    const optimizations: BudgetOptimization[] = [];
    const { preferences } = input;

    // Airport transfer optimization
    optimizations.push({
      type: 'location',
      category: 'transportation',
      potentialSavings: 50000 * preferences.travelers,
      description: 'Pre-book airport transfers for better rates',
      impact: 'low'
    });

    // Accommodation location optimization
    if (preferences.cities.length > 1) {
      optimizations.push({
        type: 'location',
        category: 'accommodation',
        potentialSavings: 100000 * preferences.days * preferences.travelers,
        description: 'Stay in city centers to reduce local transportation costs',
        impact: 'medium'
      });
    }

    return optimizations;
  }

  private groupDestinationsByDay(destinations: any[], totalDays: number): any[][] {
    const groups: any[][] = Array(totalDays).fill(null).map(() => []);
    const destinationsPerDay = Math.ceil(destinations.length / totalDays);

    destinations.forEach((dest, index) => {
      const dayIndex = Math.floor(index / destinationsPerDay);
      if (dayIndex < totalDays) {
        groups[dayIndex].push(dest);
      }
    });

    return groups;
  }

  private calculateFoodOptimizations(dayGroup: any[], profile: UserPreferenceProfile | null, travelers: number = 2): number {
    if (!profile || profile.mlInsights.priceSensitivity < 0.5) return 0;

    const localFoodRatio = dayGroup.filter(d => 
      ['restaurant', 'warung', 'food_stall'].includes(d.category)
    ).length / dayGroup.length;

    if (localFoodRatio > 0.3) {
      return 50000 * travelers; // Potential savings from local food
    }
    return 0;
  }

  private calculateActivityBundling(dayGroup: any[]): number {
    // Check if there are multiple activities that could be bundled
    const activities = dayGroup.filter(d => d.category === 'activity' || d.category === 'attraction');
    
    if (activities.length > 1) {
      return 25000 * activities.length; // Estimated bundle savings
    }
    return 0;
  }

  // Real-time budget tracking and adjustment
  trackBudgetPerformance(userId: string, actualExpenses: Record<string, number>): BudgetAdjustment {
    const profile = mlEngine.getUserProfile(userId);
    const adjustments: string[] = [];

    // Analyze spending patterns
    Object.entries(actualExpenses).forEach(([category, amount]) => {
      const variance = this.calculateSpendingVariance(category, amount, profile);
      if (Math.abs(variance) > 0.2) { // 20% variance threshold
        adjustments.push(`Consider adjusting ${category} allocation based on actual spending`);
      }
    });

    return {
      adjustments,
      recommendation: this.generateSpendingRecommendation(actualExpenses, profile),
      confidence: adjustments.length > 0 ? 0.8 : 0.5
    };
  }

  private calculateSpendingVariance(category: string, amount: number, profile: UserPreferenceProfile | null): number {
    if (!profile) return 0;

    const typicalSpending = this.getTypicalSpendingForCategory(category, profile);
    return (amount - typicalSpending) / typicalSpending;
  }

  private getTypicalSpendingForCategory(category: string, profile: UserPreferenceProfile): number {
    // This would be calculated based on historical data
    // For now, return estimated values based on profile
    const baseAmount = {
      accommodation: 500000,
      transportation: 200000,
      food: 300000,
      activities: 250000,
      miscellaneous: 150000
    }[category] || 100000;

    // Adjust based on user's spending patterns
    const multiplier = 1 - (profile.mlInsights.priceSensitivity * 0.3);
    return baseAmount * multiplier;
  }

  private generateSpendingRecommendation(expenses: Record<string, number>, profile: UserPreferenceProfile | null): string {
    if (!profile) {
      return 'Consider tracking expenses more carefully for better budget optimization';
    }

    const totalSpent = Object.values(expenses).reduce((a, b) => a + b, 0);
    const budgetUtilization = totalSpent / profile.explicitPreferences.budget;

    if (budgetUtilization > 1.1) {
      return 'You are over budget. Consider reducing discretionary spending or adjusting future allocations.';
    } else if (budgetUtilization < 0.8) {
      return 'You are under budget. Consider upgrading experiences or saving for future trips.';
    } else {
      return 'Your spending is well-aligned with your budget. Great planning!';
    }
  }
}

export interface BudgetAdjustment {
  adjustments: string[];
  recommendation: string;
  confidence: number;
}

// Singleton instance
export const budgetEngine = new IntelligentBudgetEngine();
