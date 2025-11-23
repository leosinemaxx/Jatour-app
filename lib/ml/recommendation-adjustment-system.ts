// Recommendation Adjustment System for JaTour Smart Trip Goals
// Personalizes recommendations based on user's selected trip goal

import { TripGoal } from './goal-management-engine';
import { SmartDestination, SmartItineraryInput } from './smart-itinerary-engine';

export interface AdjustedRecommendation {
  originalItem: any;
  adjustedScore: number;
  goalAlignment: number; // 0-1 how well it aligns with goal
  adjustments: {
    priceAdjustment?: number;
    ratingBoost?: number;
    categoryPriority?: number;
    availability?: 'high' | 'medium' | 'low';
  };
  reasoning: string[];
}

export interface GoalBasedFilter {
  priceRange: { min: number; max: number };
  ratingThreshold: number;
  categoryPreferences: Record<string, number>;
  accommodationLevel: 'budget' | 'moderate' | 'luxury';
  activityIntensity: 'low' | 'medium' | 'high';
}

export class RecommendationAdjustmentSystem {
  // Goal-specific adjustment rules
  private goalAdjustmentRules: Record<TripGoal['type'], GoalBasedFilter> = {
    budget: {
      priceRange: { min: 0, max: 100000 },
      ratingThreshold: 3.0,
      categoryPreferences: {
        'cultural': 1.0,
        'nature': 0.9,
        'food': 0.8,
        'shopping': 0.6,
        'entertainment': 0.5,
        'historical': 0.9,
        'beach': 0.7,
        'mountain': 0.8,
        'waterfall': 0.8,
        'temple': 0.9
      },
      accommodationLevel: 'budget',
      activityIntensity: 'medium'
    },
    balanced: {
      priceRange: { min: 50000, max: 300000 },
      ratingThreshold: 3.5,
      categoryPreferences: {
        'cultural': 1.0,
        'nature': 0.9,
        'food': 0.8,
        'adventure': 0.7,
        'shopping': 0.6,
        'entertainment': 0.7,
        'historical': 0.9,
        'beach': 0.8,
        'mountain': 0.8,
        'waterfall': 0.8,
        'temple': 0.9
      },
      accommodationLevel: 'moderate',
      activityIntensity: 'medium'
    },
    luxury: {
      priceRange: { min: 200000, max: 2000000 },
      ratingThreshold: 4.0,
      categoryPreferences: {
        'cultural': 0.8,
        'nature': 0.9,
        'food': 0.7,
        'relaxation': 1.0,
        'shopping': 0.8,
        'entertainment': 0.9,
        'historical': 0.8,
        'beach': 0.9,
        'mountain': 0.7,
        'spa': 1.0,
        'resort': 1.0
      },
      accommodationLevel: 'luxury',
      activityIntensity: 'low'
    },
    backpacker: {
      priceRange: { min: 0, max: 75000 },
      ratingThreshold: 2.5,
      categoryPreferences: {
        'adventure': 1.0,
        'nature': 0.9,
        'cultural': 0.8,
        'food': 0.9,
        'historical': 0.7,
        'beach': 0.8,
        'mountain': 0.9,
        'waterfall': 0.9,
        'hiking': 1.0,
        'local': 1.0
      },
      accommodationLevel: 'budget',
      activityIntensity: 'high'
    }
  };

  // Adjust destination recommendations based on trip goal
  adjustDestinationRecommendations(
    destinations: SmartDestination[],
    goal: TripGoal
  ): AdjustedRecommendation[] {
    const rules = this.goalAdjustmentRules[goal.type];

    return destinations.map(dest => {
      let adjustedScore = dest.mlScore || 0;
      let goalAlignment = 0;
      const adjustments: AdjustedRecommendation['adjustments'] = {};
      const reasoning: string[] = [];

      // Price adjustment
      const priceAdjustment = this.calculatePriceAdjustment(dest.estimatedCost, rules.priceRange);
      if (priceAdjustment !== 0) {
        adjustedScore += priceAdjustment * 0.2;
        adjustments.priceAdjustment = priceAdjustment;
        reasoning.push(`Price ${priceAdjustment > 0 ? 'fits' : 'exceeds'} goal budget range`);
      }

      // Rating boost for goal alignment
      const ratingBoost = this.calculateRatingBoost(dest.rating, rules.ratingThreshold);
      if (ratingBoost !== 0) {
        adjustedScore += ratingBoost * 0.3;
        adjustments.ratingBoost = ratingBoost;
        reasoning.push(`Rating ${dest.rating >= rules.ratingThreshold ? 'meets' : 'below'} goal standards`);
      }

      // Category priority adjustment
      const categoryPriority = rules.categoryPreferences[dest.category] || 0.5;
      adjustedScore += (categoryPriority - 0.5) * 0.4;
      adjustments.categoryPriority = categoryPriority;
      if (categoryPriority > 0.7) {
        reasoning.push(`High priority for ${dest.category} category`);
      }

      // Calculate overall goal alignment
      goalAlignment = this.calculateGoalAlignment(dest, rules, goal);

      // Availability adjustment based on goal type
      adjustments.availability = this.determineAvailability(dest, goal.type);

      return {
        originalItem: dest,
        adjustedScore: Math.max(0, Math.min(1, adjustedScore)),
        goalAlignment,
        adjustments,
        reasoning
      };
    }).sort((a, b) => b.adjustedScore - a.adjustedScore);
  }

  // Adjust accommodation recommendations
  adjustAccommodationRecommendations(
    accommodations: any[],
    goal: TripGoal
  ): AdjustedRecommendation[] {
    const rules = this.goalAdjustmentRules[goal.type];

    return accommodations.map(acc => {
      let adjustedScore = 0;
      let goalAlignment = 0;
      const adjustments: AdjustedRecommendation['adjustments'] = {};
      const reasoning: string[] = [];

      // Accommodation level matching
      const levelMatch = this.calculateAccommodationMatch(acc.type || acc.category, rules.accommodationLevel);
      adjustedScore += levelMatch * 0.6;
      goalAlignment += levelMatch * 0.7;

      if (levelMatch > 0.8) {
        reasoning.push(`Perfect match for ${rules.accommodationLevel} accommodation preference`);
      }

      // Price adjustment
      const priceAdjustment = this.calculatePriceAdjustment(acc.cost || acc.price, rules.priceRange);
      adjustedScore += priceAdjustment * 0.3;
      if (priceAdjustment > 0) {
        reasoning.push('Price aligns with goal budget');
      }

      // Rating consideration
      const ratingBoost = (acc.rating || 3.0) / 5.0 * 0.1;
      adjustedScore += ratingBoost;

      adjustments.availability = this.determineAvailability(acc, goal.type);

      return {
        originalItem: acc,
        adjustedScore: Math.max(0, Math.min(1, adjustedScore)),
        goalAlignment,
        adjustments,
        reasoning
      };
    }).sort((a, b) => b.adjustedScore - a.adjustedScore);
  }

  // Adjust activity/transportation recommendations
  adjustActivityRecommendations(
    activities: any[],
    goal: TripGoal
  ): AdjustedRecommendation[] {
    const rules = this.goalAdjustmentRules[goal.type];

    return activities.map(activity => {
      let adjustedScore = 0;
      let goalAlignment = 0;
      const adjustments: AdjustedRecommendation['adjustments'] = {};
      const reasoning: string[] = [];

      // Activity intensity matching
      const intensityMatch = this.calculateActivityIntensityMatch(activity, rules.activityIntensity);
      adjustedScore += intensityMatch * 0.4;
      goalAlignment += intensityMatch * 0.5;

      // Category preference
      const categoryPriority = rules.categoryPreferences[activity.category] || 0.5;
      adjustedScore += categoryPriority * 0.4;

      // Price adjustment
      const priceAdjustment = this.calculatePriceAdjustment(activity.cost || activity.price, rules.priceRange);
      adjustedScore += priceAdjustment * 0.2;

      if (intensityMatch > 0.7) {
        reasoning.push(`Activity intensity matches ${rules.activityIntensity} preference`);
      }

      if (categoryPriority > 0.7) {
        reasoning.push(`Preferred ${activity.category} activity`);
      }

      adjustments.availability = this.determineAvailability(activity, goal.type);

      return {
        originalItem: activity,
        adjustedScore: Math.max(0, Math.min(1, adjustedScore)),
        goalAlignment,
        adjustments,
        reasoning
      };
    }).sort((a, b) => b.adjustedScore - a.adjustedScore);
  }

  // Filter and prioritize destinations for goal
  filterDestinationsForGoal(
    destinations: SmartDestination[],
    goal: TripGoal,
    limit?: number
  ): SmartDestination[] {
    const adjusted = this.adjustDestinationRecommendations(destinations, goal);

    return adjusted
      .filter(adj => adj.adjustedScore > 0.3) // Minimum threshold
      .slice(0, limit || 10)
      .map(adj => ({
        ...adj.originalItem,
        goalAlignment: adj.goalAlignment,
        goalAdjustments: adj.adjustments
      }));
  }

  // Get goal-specific itinerary constraints
  getGoalConstraints(goal: TripGoal): Partial<SmartItineraryInput['constraints']> {
    const rules = this.goalAdjustmentRules[goal.type];

    return {
      maxDailyTravelTime: rules.activityIntensity === 'high' ? 480 : rules.activityIntensity === 'medium' ? 360 : 240,
      avoidCrowds: goal.type === 'luxury' || goal.type === 'backpacker',
      accessibilityRequired: goal.type === 'luxury'
    };
  }

  // Calculate goal-specific budget allocation
  getGoalBudgetAllocation(goal: TripGoal): Record<string, number> {
    const totalBudget = goal.targetMetrics.maxBudget || 1000000;

    switch (goal.type) {
      case 'budget':
        return {
          accommodation: totalBudget * 0.2,
          food: totalBudget * 0.25,
          transportation: totalBudget * 0.2,
          activities: totalBudget * 0.25,
          miscellaneous: totalBudget * 0.1
        };
      case 'balanced':
        return {
          accommodation: totalBudget * 0.25,
          food: totalBudget * 0.2,
          transportation: totalBudget * 0.2,
          activities: totalBudget * 0.25,
          miscellaneous: totalBudget * 0.1
        };
      case 'luxury':
        return {
          accommodation: totalBudget * 0.4,
          food: totalBudget * 0.15,
          transportation: totalBudget * 0.15,
          activities: totalBudget * 0.2,
          miscellaneous: totalBudget * 0.1
        };
      case 'backpacker':
        return {
          accommodation: totalBudget * 0.15,
          food: totalBudget * 0.3,
          transportation: totalBudget * 0.25,
          activities: totalBudget * 0.2,
          miscellaneous: totalBudget * 0.1
        };
      default:
        return {
          accommodation: totalBudget * 0.25,
          food: totalBudget * 0.2,
          transportation: totalBudget * 0.2,
          activities: totalBudget * 0.25,
          miscellaneous: totalBudget * 0.1
        };
    }
  }

  // Private helper methods
  private calculatePriceAdjustment(price: number, targetRange: { min: number; max: number }): number {
    if (price >= targetRange.min && price <= targetRange.max) {
      return 0.2; // Bonus for being in range
    } else if (price < targetRange.min) {
      return 0.1; // Small bonus for being cheaper
    } else {
      return -0.3; // Penalty for being too expensive
    }
  }

  private calculateRatingBoost(rating: number, threshold: number): number {
    if (rating >= threshold) {
      return (rating - threshold) * 0.2; // Boost for exceeding threshold
    } else {
      return (rating - threshold) * 0.5; // Penalty for below threshold
    }
  }

  private calculateGoalAlignment(destination: SmartDestination, rules: GoalBasedFilter, goal: TripGoal): number {
    let alignment = 0;

    // Price alignment
    if (destination.estimatedCost >= rules.priceRange.min && destination.estimatedCost <= rules.priceRange.max) {
      alignment += 0.3;
    }

    // Rating alignment
    if (destination.rating >= rules.ratingThreshold) {
      alignment += 0.3;
    }

    // Category alignment
    const categoryScore = rules.categoryPreferences[destination.category] || 0.5;
    alignment += categoryScore * 0.4;

    return Math.min(alignment, 1.0);
  }

  private calculateAccommodationMatch(accType: string, targetLevel: string): number {
    const levelHierarchy = { budget: 1, moderate: 2, luxury: 3 };
    const accLevel = levelHierarchy[accType.toLowerCase() as keyof typeof levelHierarchy] || 2;
    const targetLevelNum = levelHierarchy[targetLevel as keyof typeof levelHierarchy] || 2;

    const difference = Math.abs(accLevel - targetLevelNum);
    return Math.max(0, 1 - difference * 0.3);
  }

  private calculateActivityIntensityMatch(activity: any, targetIntensity: string): number {
    // Simple heuristic based on activity properties
    const intensityIndicators = {
      high: ['adventure', 'hiking', 'extreme', 'climbing', 'diving'],
      medium: ['cultural', 'nature', 'food', 'shopping', 'sightseeing'],
      low: ['relaxation', 'spa', 'resort', 'beach', 'reading']
    };

    const activityTags = activity.tags || [activity.category];
    const targetIndicators = intensityIndicators[targetIntensity as keyof typeof intensityIndicators];

    const matches = activityTags.some((tag: string) =>
      targetIndicators.some(indicator => tag.toLowerCase().includes(indicator))
    );

    return matches ? 0.8 : 0.4;
  }

  private determineAvailability(item: any, goalType: TripGoal['type']): 'high' | 'medium' | 'low' {
    // Simplified availability logic
    switch (goalType) {
      case 'budget':
        return Math.random() > 0.3 ? 'high' : 'medium';
      case 'balanced':
        return Math.random() > 0.5 ? 'high' : 'medium';
      case 'luxury':
        return Math.random() > 0.7 ? 'medium' : 'low';
      case 'backpacker':
        return Math.random() > 0.4 ? 'high' : 'medium';
      default:
        return 'medium';
    }
  }
}

// Singleton instance
export const recommendationAdjustmentSystem = new RecommendationAdjustmentSystem();