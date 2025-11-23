// Budget-as-a-Plan (BaaP) - Adherence Prediction Engine
// Predicts budget adherence probability and identifies risk factors

export interface AdherencePredictionInput {
  userId: string;
  itineraryId: string;
  totalBudget: number;
  categoryBreakdown: {
    accommodation: number;
    transportation: number;
    food: number;
    activities: number;
    miscellaneous: number;
  };
  userProfile: any; // From MLEngine
  itineraryDetails: {
    days: number;
    destinations: number;
    cities: string[];
    startDate: string;
  };
  historicalData?: {
    previousTrips: Array<{
      budget: number;
      actualSpent: number;
      adherence: number;
      tripType: string;
    }>;
  };
}

export interface AdherencePrediction {
  successProbability: number; // 0-1, target 95%
  confidence: number; // 0-1
  riskFactors: Array<{
    factor: string;
    impact: 'low' | 'medium' | 'high';
    probability: number;
    mitigation?: string;
  }>;
  behavioralInsights: {
    priceSensitivity: number;
    spontaneityScore: number;
    riskTolerance: number;
    historicalAdherence: number;
  };
  recommendations: Array<{
    type: 'budget_increase' | 'category_adjustment' | 'behavioral_change';
    description: string;
    impact: number; // Expected improvement in adherence
  }>;
  predictionBreakdown: {
    userBehavior: number;
    planComplexity: number;
    marketConditions: number;
    historicalPerformance: number;
  };
}

export class AdherencePredictionEngine {
  private mlEngine: any;

  constructor(mlEngine: any) {
    this.mlEngine = mlEngine;
  }

  predictAdherence(input: AdherencePredictionInput): AdherencePrediction {
    // Calculate individual risk factors
    const userBehaviorScore = this.calculateUserBehaviorScore(input);
    const planComplexityScore = this.calculatePlanComplexityScore(input);
    const marketConditionsScore = this.calculateMarketConditionsScore(input);
    const historicalScore = this.calculateHistoricalScore(input);

    // Weighted combination for overall success probability
    const weights = {
      userBehavior: 0.4,
      planComplexity: 0.25,
      marketConditions: 0.2,
      historicalPerformance: 0.15
    };

    const successProbability = (
      userBehaviorScore * weights.userBehavior +
      planComplexityScore * weights.planComplexity +
      marketConditionsScore * weights.marketConditions +
      historicalScore * weights.historicalPerformance
    );

    // Identify specific risk factors
    const riskFactors = this.identifyRiskFactors(input, {
      userBehaviorScore,
      planComplexityScore,
      marketConditionsScore,
      historicalScore
    });

    // Generate recommendations
    const recommendations = this.generateRecommendations(input, successProbability, riskFactors);

    // Calculate confidence based on data availability and consistency
    const confidence = this.calculateConfidence(input, riskFactors);

    return {
      successProbability: Math.min(successProbability, 0.99), // Cap at 99%
      confidence,
      riskFactors,
      behavioralInsights: {
        priceSensitivity: input.userProfile?.mlInsights?.priceSensitivity || 0.5,
        spontaneityScore: input.userProfile?.mlInsights?.spontaneityScore || 0.5,
        riskTolerance: input.userProfile?.mlInsights?.riskTolerance || 0.5,
        historicalAdherence: historicalScore
      },
      recommendations,
      predictionBreakdown: {
        userBehavior: userBehaviorScore,
        planComplexity: planComplexityScore,
        marketConditions: marketConditionsScore,
        historicalPerformance: historicalScore
      }
    };
  }

  private calculateUserBehaviorScore(input: AdherencePredictionInput): number {
    const profile = input.userProfile;
    if (!profile) return 0.5;

    let score = 0.5; // Base score

    // Price sensitivity (lower sensitivity = better adherence)
    const priceSensitivity = profile.mlInsights?.priceSensitivity || 0.5;
    score += (1 - priceSensitivity) * 0.3;

    // Risk tolerance (higher tolerance = lower adherence risk)
    const riskTolerance = profile.mlInsights?.riskTolerance || 0.5;
    score += riskTolerance * 0.2;

    // Spontaneity (lower spontaneity = better planning = better adherence)
    const spontaneity = profile.mlInsights?.spontaneityScore || 0.5;
    score -= spontaneity * 0.2;

    // Activity preference (balanced preferences = better adherence)
    const activityPreference = profile.mlInsights?.activityPreference || 0.5;
    const balanceScore = 1 - Math.abs(activityPreference - 0.5) * 2; // Closer to 0.5 is better
    score += balanceScore * 0.1;

    // Budget alignment with preferences
    const budgetAlignment = this.calculateBudgetAlignment(input);
    score += budgetAlignment * 0.2;

    return Math.max(0, Math.min(1, score));
  }

  private calculateBudgetAlignment(input: AdherencePredictionInput): number {
    const profile = input.userProfile;
    if (!profile?.implicitPreferences?.preferredPriceRange) return 0.5;

    const preferredRange = profile.implicitPreferences.preferredPriceRange;
    const totalBudget = input.totalBudget;
    const perDayBudget = totalBudget / input.itineraryDetails.days;

    // Check if budget aligns with preferred spending patterns
    const range = preferredRange.max - preferredRange.min;
    const budgetRatio = (perDayBudget - preferredRange.min) / range;

    // Score based on how well budget fits preferred range
    if (budgetRatio >= 0 && budgetRatio <= 1) {
      return 0.8; // Within preferred range
    } else if (budgetRatio > 1 && budgetRatio <= 1.5) {
      return 0.6; // Slightly above range
    } else if (budgetRatio < 0 && budgetRatio >= -0.5) {
      return 0.4; // Below range
    } else {
      return 0.2; // Significantly outside range
    }
  }

  private calculatePlanComplexityScore(input: AdherencePredictionInput): number {
    let score = 1.0; // Start with perfect score, reduce for complexity

    // Days complexity
    if (input.itineraryDetails.days > 7) score -= 0.1;
    if (input.itineraryDetails.days > 14) score -= 0.1;

    // Destinations complexity
    if (input.itineraryDetails.destinations > 10) score -= 0.1;
    if (input.itineraryDetails.destinations > 20) score -= 0.1;

    // Cities complexity
    if (input.itineraryDetails.cities.length > 3) score -= 0.1;
    if (input.itineraryDetails.cities.length > 5) score -= 0.1;

    // Budget distribution complexity
    const categories = Object.values(input.categoryBreakdown);
    const avgCategory = categories.reduce((a, b) => a + b, 0) / categories.length;
    const variance = categories.reduce((acc, val) => acc + Math.pow(val - avgCategory, 2), 0) / categories.length;
    const cv = Math.sqrt(variance) / avgCategory; // Coefficient of variation

    if (cv > 0.5) score -= 0.1; // High variance in budget distribution

    return Math.max(0.3, score); // Minimum score of 0.3
  }

  private calculateMarketConditionsScore(input: AdherencePredictionInput): number {
    let score = 0.8; // Base market score

    // Seasonal adjustments
    const startDate = new Date(input.itineraryDetails.startDate);
    const month = startDate.getMonth() + 1;

    // Peak season months (typically more expensive)
    const peakMonths = [6, 7, 8, 12, 1]; // Summer and winter holidays
    if (peakMonths.includes(month)) {
      score -= 0.1;
    }

    // Shoulder season (moderate)
    const shoulderMonths = [4, 5, 9, 10, 11];
    if (shoulderMonths.includes(month)) {
      score -= 0.05;
    }

    // Low season (better deals)
    // No adjustment for low season

    // City-based adjustments (some cities are more expensive)
    const expensiveCities = ['Tokyo', 'Singapore', 'Zurich', 'London', 'New York'];
    const hasExpensiveCity = input.itineraryDetails.cities.some(city =>
      expensiveCities.some(expensive => city.toLowerCase().includes(expensive.toLowerCase()))
    );

    if (hasExpensiveCity) {
      score -= 0.1;
    }

    return Math.max(0.5, score);
  }

  private calculateHistoricalScore(input: AdherencePredictionInput): number {
    const historical = input.historicalData?.previousTrips;
    if (!historical || historical.length === 0) {
      return 0.5; // Neutral score when no historical data
    }

    // Calculate average adherence from historical trips
    const avgAdherence = historical.reduce((sum, trip) => sum + trip.adherence, 0) / historical.length;

    // Weight recent trips more heavily
    const recentTrips = historical.slice(-3); // Last 3 trips
    const recentAvgAdherence = recentTrips.length > 0
      ? recentTrips.reduce((sum, trip) => sum + trip.adherence, 0) / recentTrips.length
      : avgAdherence;

    // Combine overall and recent performance
    return (avgAdherence * 0.6) + (recentAvgAdherence * 0.4);
  }

  private identifyRiskFactors(
    input: AdherencePredictionInput,
    scores: { userBehaviorScore: number; planComplexityScore: number; marketConditionsScore: number; historicalScore: number }
  ): Array<{ factor: string; impact: 'low' | 'medium' | 'high'; probability: number; mitigation?: string }> {
    const riskFactors: Array<{ factor: string; impact: 'low' | 'medium' | 'high'; probability: number; mitigation?: string }> = [];

    // User behavior risks
    if (scores.userBehaviorScore < 0.6) {
      riskFactors.push({
        factor: 'High price sensitivity with budget mismatch',
        impact: 'high',
        probability: 0.8,
        mitigation: 'Consider increasing budget or selecting more budget-friendly options'
      });
    }

    if (input.userProfile?.mlInsights?.spontaneityScore > 0.7) {
      riskFactors.push({
        factor: 'High spontaneity may lead to unplanned expenses',
        impact: 'medium',
        probability: 0.6,
        mitigation: 'Build in buffer for spontaneous activities'
      });
    }

    // Plan complexity risks
    if (input.itineraryDetails.days > 10) {
      riskFactors.push({
        factor: 'Long trip duration increases cost variability',
        impact: 'medium',
        probability: 0.5,
        mitigation: 'Monitor spending regularly and adjust as needed'
      });
    }

    if (input.itineraryDetails.cities.length > 3) {
      riskFactors.push({
        factor: 'Multiple cities increase transportation costs',
        impact: 'medium',
        probability: 0.4,
        mitigation: 'Consider fewer destinations or budget airlines'
      });
    }

    // Market condition risks
    const startDate = new Date(input.itineraryDetails.startDate);
    const month = startDate.getMonth() + 1;
    if ([12, 1, 6, 7, 8].includes(month)) {
      riskFactors.push({
        factor: 'Peak season pricing may exceed budget',
        impact: 'high',
        probability: 0.7,
        mitigation: 'Book early for better rates or consider shoulder season'
      });
    }

    // Historical performance risks
    if (scores.historicalScore < 0.6) {
      riskFactors.push({
        factor: 'Historical budget adherence is low',
        impact: 'high',
        probability: 0.9,
        mitigation: 'Review past trips to identify spending patterns and adjust planning'
      });
    }

    return riskFactors;
  }

  private generateRecommendations(
    input: AdherencePredictionInput,
    successProbability: number,
    riskFactors: Array<{ factor: string; impact: 'low' | 'medium' | 'high'; probability: number; mitigation?: string }>
  ): Array<{ type: 'budget_increase' | 'category_adjustment' | 'behavioral_change'; description: string; impact: number }> {
    const recommendations: Array<{ type: 'budget_increase' | 'category_adjustment' | 'behavioral_change'; description: string; impact: number }> = [];

    // Budget increase recommendations
    if (successProbability < 0.85) {
      const suggestedIncrease = Math.ceil((0.95 - successProbability) * input.totalBudget);
      recommendations.push({
        type: 'budget_increase',
        description: `Increase total budget by IDR ${suggestedIncrease.toLocaleString()} to achieve 95% adherence guarantee`,
        impact: Math.min(0.15, (0.95 - successProbability))
      });
    }

    // Category adjustments
    const highRiskCategories = this.identifyHighRiskCategories(input);
    highRiskCategories.forEach(category => {
      recommendations.push({
        type: 'category_adjustment',
        description: `Reduce ${category} budget by 10-15% and reallocate to build buffer`,
        impact: 0.05
      });
    });

    // Behavioral recommendations
    if (input.userProfile?.mlInsights?.spontaneityScore > 0.7) {
      recommendations.push({
        type: 'behavioral_change',
        description: 'Set daily spending limits and track expenses in real-time',
        impact: 0.08
      });
    }

    return recommendations;
  }

  private identifyHighRiskCategories(input: AdherencePredictionInput): string[] {
    const categories = Object.entries(input.categoryBreakdown);
    const totalBudget = input.totalBudget;

    return categories
      .filter(([_, amount]) => (amount / totalBudget) > 0.3) // Categories > 30% of budget
      .map(([category, _]) => category);
  }

  private calculateConfidence(
    input: AdherencePredictionInput,
    riskFactors: Array<{ factor: string; impact: 'low' | 'medium' | 'high'; probability: number }>
  ): number {
    let confidence = 0.8; // Base confidence

    // Reduce confidence based on data availability
    if (!input.userProfile) confidence -= 0.2;
    if (!input.historicalData?.previousTrips?.length) confidence -= 0.1;

    // Reduce confidence based on risk factors
    const highImpactRisks = riskFactors.filter(r => r.impact === 'high').length;
    confidence -= highImpactRisks * 0.05;

    // Increase confidence for well-planned trips
    if (input.itineraryDetails.days <= 7 && input.itineraryDetails.cities.length <= 2) {
      confidence += 0.1;
    }

    return Math.max(0.5, Math.min(0.95, confidence));
  }
}

// Singleton instance
export const adherencePredictionEngine = new AdherencePredictionEngine(null);