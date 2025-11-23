// Budget-as-a-Plan (BaaP) - Risk Assessment System
// Identifies failure points and assesses their likelihood and impact

export interface RiskAssessmentInput {
  userId: string;
  itinerary: any; // From ItineraryGenerator
  budget: {
    totalBudget: number;
    categoryBreakdown: {
      accommodation: number;
      transportation: number;
      food: number;
      activities: number;
      miscellaneous: number;
    };
  };
  userProfile: any;
  adherencePrediction: any; // From AdherencePredictionEngine
  realTimeFactors?: {
    weatherConditions?: any;
    localEvents?: any;
    currencyFluctuations?: any;
    demandIndicators?: any;
  };
}

export interface RiskFactor {
  id: string;
  category: 'budget' | 'schedule' | 'health_safety' | 'external' | 'user_behavior';
  type: 'cost_overrun' | 'schedule_delay' | 'health_issue' | 'safety_concern' | 'weather_impact' | 'demand_spike' | 'user_noncompliance';
  description: string;
  likelihood: number; // 0-1
  impact: number; // 0-1 (potential cost/time impact)
  riskScore?: number; // likelihood * impact - calculated later
  triggers: string[];
  mitigationStrategies: Array<{
    strategy: string;
    effectiveness: number; // 0-1
    cost: number;
    implementation: 'automatic' | 'manual' | 'preventive';
  }>;
  monitoringPoints: string[];
  contingencyPlans: Array<{
    condition: string;
    action: string;
    backupCost?: number;
  }>;
}

export interface RiskAssessment {
  overallRiskScore: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactor[];
  riskDistribution: {
    budget: number;
    schedule: number;
    health_safety: number;
    external: number;
    user_behavior: number;
  };
  criticalFailurePoints: Array<{
    factor: RiskFactor;
    failureProbability: number;
    potentialLoss: number;
  }>;
  monitoringSchedule: Array<{
    timePoint: string;
    checks: string[];
    alerts: string[];
  }>;
  recommendedActions: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    rationale: string;
    expectedBenefit: number;
  }>;
}

export class RiskAssessmentSystem {
  private mlEngine: any;

  constructor(mlEngine: any) {
    this.mlEngine = mlEngine;
  }

  assessRisks(input: RiskAssessmentInput): RiskAssessment {
    console.log('[RiskAssessmentSystem] Starting risk assessment for user:', input.userId);

    // Identify all potential risk factors
    const riskFactors = this.identifyRiskFactors(input);

    // Calculate risk scores and distributions
    const riskDistribution = this.calculateRiskDistribution(riskFactors);
    const overallRiskScore = this.calculateOverallRiskScore(riskFactors);
    const riskLevel = this.determineRiskLevel(overallRiskScore);

    // Identify critical failure points
    const criticalFailurePoints = this.identifyCriticalFailurePoints(riskFactors, input);

    // Create monitoring schedule
    const monitoringSchedule = this.createMonitoringSchedule(riskFactors, input);

    // Generate recommended actions
    const recommendedActions = this.generateRecommendedActions(riskFactors, input);

    return {
      overallRiskScore,
      riskLevel,
      riskFactors,
      riskDistribution,
      criticalFailurePoints,
      monitoringSchedule,
      recommendedActions
    };
  }

  private identifyRiskFactors(input: RiskAssessmentInput): RiskFactor[] {
    const factors: RiskFactor[] = [];

    // Budget-related risks
    factors.push(...this.assessBudgetRisks(input));

    // Schedule-related risks
    factors.push(...this.assessScheduleRisks(input));

    // Health and safety risks
    factors.push(...this.assessHealthSafetyRisks(input));

    // External factor risks
    factors.push(...this.assessExternalRisks(input));

    // User behavior risks
    factors.push(...this.assessUserBehaviorRisks(input));

    // Calculate risk scores for all factors
    return factors.map(factor => ({
      ...factor,
      riskScore: factor.likelihood * factor.impact
    }));
  }

  private assessBudgetRisks(input: RiskAssessmentInput): RiskFactor[] {
    const factors: RiskFactor[] = [];
    const budget = input.budget;
    const itinerary = input.itinerary;

    // Cost overrun risk
    const totalEstimatedCost = itinerary.days?.reduce((sum: number, day: any) =>
      sum + (day.totalCost || 0), 0) || 0;

    if (totalEstimatedCost > budget.totalBudget * 1.1) {
      factors.push({
        id: 'budget_overrun',
        category: 'budget',
        type: 'cost_overrun',
        description: 'Estimated costs exceed budget by more than 10%',
        likelihood: Math.min((totalEstimatedCost - budget.totalBudget) / budget.totalBudget, 0.8),
        impact: Math.min((totalEstimatedCost - budget.totalBudget) / budget.totalBudget, 1),
        triggers: ['Daily spending exceeds allocation', 'Unexpected price increases'],
        mitigationStrategies: [
          {
            strategy: 'Implement daily spending caps',
            effectiveness: 0.7,
            cost: 0,
            implementation: 'automatic'
          },
          {
            strategy: 'Reserve contingency fund',
            effectiveness: 0.9,
            cost: budget.totalBudget * 0.05,
            implementation: 'preventive'
          }
        ],
        monitoringPoints: ['Daily expense tracking', 'Price change alerts'],
        contingencyPlans: [
          {
            condition: 'Spending exceeds 15% of daily budget',
            action: 'Activate contingency fund or reduce non-essential activities',
            backupCost: budget.totalBudget * 0.1
          }
        ]
      });
    }

    // Category-specific budget risks
    const categories = ['accommodation', 'transportation', 'food', 'activities'] as const;
    categories.forEach(category => {
      const allocated = budget.categoryBreakdown[category];
      const estimated = this.estimateCategorySpending(itinerary, category);

      if (estimated > allocated * 1.2) {
        factors.push({
          id: `budget_${category}_overrun`,
          category: 'budget',
          type: 'cost_overrun',
          description: `${category} spending likely to exceed allocation by ${(estimated / allocated - 1) * 100}%`,
          likelihood: Math.min((estimated - allocated) / allocated, 0.7),
          impact: Math.min((estimated - allocated) / budget.totalBudget, 0.3),
          triggers: [`${category} costs increase`, 'Unexpected expenses'],
          mitigationStrategies: [
            {
              strategy: `Optimize ${category} choices`,
              effectiveness: 0.6,
              cost: 0,
              implementation: 'manual'
            }
          ],
          monitoringPoints: [`${category} expense tracking`],
          contingencyPlans: [
            {
              condition: `${category} spending exceeds 20% of allocation`,
              action: `Switch to cheaper ${category} alternatives`,
              backupCost: Math.min(estimated - allocated, allocated * 0.5)
            }
          ]
        });
      }
    });

    return factors;
  }

  private assessScheduleRisks(input: RiskAssessmentInput): RiskFactor[] {
    const factors: RiskFactor[] = [];
    const itinerary = input.itinerary;

    // Schedule delay risks
    const totalActivities = itinerary.days?.reduce((sum: number, day: any) =>
      sum + (day.destinations?.length || 0), 0) || 0;

    if (totalActivities > 12) { // Over-scheduled
      factors.push({
        id: 'schedule_overload',
        category: 'schedule',
        type: 'schedule_delay',
        description: 'Itinerary is over-scheduled, increasing fatigue and delays',
        likelihood: Math.min(totalActivities / 20, 0.6), // Higher likelihood with more activities
        impact: 0.2, // Moderate impact on overall experience
        triggers: ['Missed activities', 'Travel fatigue'],
        mitigationStrategies: [
          {
            strategy: 'Add buffer time between activities',
            effectiveness: 0.8,
            cost: 0,
            implementation: 'automatic'
          }
        ],
        monitoringPoints: ['Activity completion tracking', 'Energy level monitoring'],
        contingencyPlans: [
          {
            condition: 'Multiple activities missed',
            action: 'Skip low-priority activities and focus on essentials',
            backupCost: 0
          }
        ]
      });
    }

    // Transportation delay risks
    const transportationDays = itinerary.days?.filter((day: any) => day.transportation)?.length || 0;
    if (transportationDays > 0) {
      factors.push({
        id: 'transportation_delay',
        category: 'schedule',
        type: 'schedule_delay',
        description: 'Transportation delays could disrupt schedule',
        likelihood: 0.3, // Base transportation delay probability
        impact: 0.15,
        triggers: ['Traffic congestion', 'Public transport delays', 'Weather issues'],
        mitigationStrategies: [
          {
            strategy: 'Build transportation buffers',
            effectiveness: 0.7,
            cost: 0,
            implementation: 'preventive'
          }
        ],
        monitoringPoints: ['Transportation status updates'],
        contingencyPlans: [
          {
            condition: 'Transportation delay > 30 minutes',
            action: 'Adjust subsequent activities or use backup transport',
            backupCost: 50000 // Cost of alternative transport
          }
        ]
      });
    }

    return factors;
  }

  private assessHealthSafetyRisks(input: RiskAssessmentInput): RiskFactor[] {
    const factors: RiskFactor[] = [];
    const itinerary = input.itinerary;

    // Health risks based on activities
    const adventureActivities = itinerary.days?.reduce((count: number, day: any) =>
      count + (day.destinations?.filter((dest: any) =>
        dest.tags?.some((tag: string) => ['adventure', 'hiking', 'water', 'extreme'].includes(tag.toLowerCase()))
      ).length || 0), 0) || 0;

    if (adventureActivities > 2) {
      factors.push({
        id: 'health_adventure_risk',
        category: 'health_safety',
        type: 'health_issue',
        description: 'Multiple adventure activities increase health and safety risks',
        likelihood: Math.min(adventureActivities / 10, 0.4),
        impact: 0.25,
        triggers: ['Injury during activities', 'Medical emergencies'],
        mitigationStrategies: [
          {
            strategy: 'Travel insurance with adventure coverage',
            effectiveness: 0.8,
            cost: 500000, // Approximate insurance cost
            implementation: 'preventive'
          }
        ],
        monitoringPoints: ['Health status monitoring', 'Weather conditions'],
        contingencyPlans: [
          {
            condition: 'Health issue occurs',
            action: 'Seek medical attention and adjust itinerary',
            backupCost: 1000000 // Emergency medical costs
          }
        ]
      });
    }

    // Food safety risks
    const streetFoodActivities = itinerary.days?.reduce((count: number, day: any) =>
      count + (day.destinations?.filter((dest: any) =>
        dest.tags?.some((tag: string) => ['street_food', 'local_eats'].includes(tag.toLowerCase()))
      ).length || 0), 0) || 0;

    if (streetFoodActivities > 3) {
      factors.push({
        id: 'food_safety_risk',
        category: 'health_safety',
        type: 'health_issue',
        description: 'Frequent street food consumption increases food safety risks',
        likelihood: 0.2,
        impact: 0.15,
        triggers: ['Food poisoning', 'Water contamination'],
        mitigationStrategies: [
          {
            strategy: 'Choose reputable establishments and stay hydrated',
            effectiveness: 0.6,
            cost: 0,
            implementation: 'manual'
          }
        ],
        monitoringPoints: ['Health monitoring after meals'],
        contingencyPlans: [
          {
            condition: 'Food-related illness',
            action: 'Seek medical attention and rest',
            backupCost: 200000
          }
        ]
      });
    }

    return factors;
  }

  private assessExternalRisks(input: RiskAssessmentInput): RiskFactor[] {
    const factors: RiskFactor[] = [];
    const itinerary = input.itinerary;
    const realTime = input.realTimeFactors;

    // Weather-related risks
    if (realTime?.weatherConditions) {
      const badWeatherDays = realTime.weatherConditions.filter((day: any) =>
        day.rainProbability > 0.7 || day.temperature < 15 || day.temperature > 35
      ).length;

      if (badWeatherDays > 0) {
        factors.push({
          id: 'weather_disruption',
          category: 'external',
          type: 'weather_impact',
          description: `${badWeatherDays} days with potentially disruptive weather conditions`,
          likelihood: Math.min(badWeatherDays / itinerary.days?.length, 0.6),
          impact: 0.2,
          triggers: ['Heavy rain', 'Extreme temperatures', 'Weather warnings'],
          mitigationStrategies: [
            {
              strategy: 'Monitor weather forecasts and have indoor alternatives',
              effectiveness: 0.7,
              cost: 0,
              implementation: 'manual'
            }
          ],
          monitoringPoints: ['Weather forecast updates'],
          contingencyPlans: [
            {
              condition: 'Severe weather warning',
              action: 'Modify activities to indoor alternatives',
              backupCost: 0
            }
          ]
        });
      }
    }

    // Demand spike risks (seasonal crowding)
    const startDate = new Date(itinerary.days?.[0]?.date || Date.now());
    const month = startDate.getMonth() + 1;

    if ([6, 7, 8, 12, 1].includes(month)) { // Peak seasons
      factors.push({
        id: 'demand_spike',
        category: 'external',
        type: 'demand_spike',
        description: 'Travel during peak season increases demand and prices',
        likelihood: 0.5,
        impact: 0.25,
        triggers: ['Higher prices', 'Crowded attractions', 'Limited availability'],
        mitigationStrategies: [
          {
            strategy: 'Book in advance and expect price increases',
            effectiveness: 0.5,
            cost: 0,
            implementation: 'preventive'
          }
        ],
        monitoringPoints: ['Price monitoring', 'Availability checks'],
        contingencyPlans: [
          {
            condition: 'Prices increase significantly',
            action: 'Use pre-booked alternatives or adjust expectations',
            backupCost: 0
          }
        ]
      });
    }

    return factors;
  }

  private assessUserBehaviorRisks(input: RiskAssessmentInput): RiskFactor[] {
    const factors: RiskFactor[] = [];
    const profile = input.userProfile;
    const prediction = input.adherencePrediction;

    // Non-compliance risks based on user profile
    if (profile?.mlInsights?.spontaneityScore > 0.7) {
      factors.push({
        id: 'user_spontaneity_risk',
        category: 'user_behavior',
        type: 'user_noncompliance',
        description: 'High spontaneity score indicates potential deviation from planned budget',
        likelihood: profile.mlInsights.spontaneityScore,
        impact: 0.2,
        triggers: ['Impulsive spending', 'Unplanned activities'],
        mitigationStrategies: [
          {
            strategy: 'Set spending reminders and approval workflows',
            effectiveness: 0.6,
            cost: 0,
            implementation: 'automatic'
          }
        ],
        monitoringPoints: ['Spending pattern analysis', 'Activity tracking'],
        contingencyPlans: [
          {
            condition: 'Unexpected spending detected',
            action: 'Trigger spending review and adjustment',
            backupCost: 0
          }
        ]
      });
    }

    // Price sensitivity risks
    if (profile?.mlInsights?.priceSensitivity > 0.6) {
      factors.push({
        id: 'user_price_sensitivity_risk',
        category: 'user_behavior',
        type: 'user_noncompliance',
        description: 'High price sensitivity may lead to quality compromises or dissatisfaction',
        likelihood: profile.mlInsights.priceSensitivity,
        impact: 0.15,
        triggers: ['Choosing lowest cost options', 'Quality dissatisfaction'],
        mitigationStrategies: [
          {
            strategy: 'Balance cost and quality recommendations',
            effectiveness: 0.7,
            cost: 0,
            implementation: 'automatic'
          }
        ],
        monitoringPoints: ['Satisfaction feedback', 'Quality vs cost analysis'],
        contingencyPlans: [
          {
            condition: 'Quality complaints',
            action: 'Upgrade to better alternatives within budget',
            backupCost: 100000
          }
        ]
      });
    }

    return factors;
  }

  private estimateCategorySpending(itinerary: any, category: string): number {
    // Estimate spending for a category based on itinerary
    const categoryMultipliers: Record<string, number> = {
      accommodation: 0.35,
      transportation: 0.20,
      food: 0.25,
      activities: 0.15,
      miscellaneous: 0.05
    };

    const totalEstimated = itinerary.days?.reduce((sum: number, day: any) =>
      sum + (day.totalCost || 0), 0) || 0;

    return totalEstimated * categoryMultipliers[category];
  }

  private calculateRiskDistribution(riskFactors: RiskFactor[]): RiskAssessment['riskDistribution'] {
    const distribution = {
      budget: 0,
      schedule: 0,
      health_safety: 0,
      external: 0,
      user_behavior: 0
    };

    riskFactors.forEach(factor => {
      distribution[factor.category] += factor.riskScore || 0;
    });

    // Normalize to sum to 1
    const total = Object.values(distribution).reduce((sum, score) => sum + score, 0);
    if (total > 0) {
      Object.keys(distribution).forEach(key => {
        distribution[key as keyof typeof distribution] /= total;
      });
    }

    return distribution;
  }

  private calculateOverallRiskScore(riskFactors: RiskFactor[]): number {
    if (riskFactors.length === 0) return 0;

    const totalRiskScore = riskFactors.reduce((sum, factor) => sum + (factor.riskScore || 0), 0);
    return Math.min(totalRiskScore / riskFactors.length, 1);
  }

  private determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 0.8) return 'critical';
    if (score >= 0.6) return 'high';
    if (score >= 0.3) return 'medium';
    return 'low';
  }

  private identifyCriticalFailurePoints(
    riskFactors: RiskFactor[],
    input: RiskAssessmentInput
  ): Array<{ factor: RiskFactor; failureProbability: number; potentialLoss: number }> {
    return riskFactors
      .filter(factor => (factor.riskScore || 0) > 0.4) // High-risk factors
      .map(factor => ({
        factor,
        failureProbability: factor.likelihood,
        potentialLoss: factor.impact * input.budget.totalBudget
      }))
      .sort((a, b) => b.failureProbability * b.potentialLoss - a.failureProbability * a.potentialLoss)
      .slice(0, 3); // Top 3 critical points
  }

  private createMonitoringSchedule(
    riskFactors: RiskFactor[],
    input: RiskAssessmentInput
  ): Array<{ timePoint: string; checks: string[]; alerts: string[] }> {
    const schedule: Array<{ timePoint: string; checks: string[]; alerts: string[] }> = [];

    // Pre-trip monitoring
    schedule.push({
      timePoint: 'Pre-trip (1 week before)',
      checks: [
        'Weather forecast review',
        'Price change monitoring',
        'Transportation booking confirmation',
        'Accommodation confirmation'
      ],
      alerts: riskFactors
        .filter(f => f.category === 'external')
        .map(f => f.description)
    });

    // Daily monitoring during trip
    schedule.push({
      timePoint: 'Daily during trip',
      checks: [
        'Daily spending vs budget',
        'Activity completion status',
        'Health and safety status',
        'Weather conditions'
      ],
      alerts: riskFactors
        .filter(f => ['budget', 'schedule', 'health_safety'].includes(f.category))
        .map(f => `Monitor: ${f.description}`)
    });

    // Emergency monitoring
    schedule.push({
      timePoint: 'Emergency triggers',
      checks: [
        'Sudden price increases',
        'Transportation disruptions',
        'Health emergencies',
        'Weather emergencies'
      ],
      alerts: riskFactors
        .filter(f => f.impact > 0.3)
        .map(f => `Critical: ${f.description}`)
    });

    return schedule;
  }

  private generateRecommendedActions(
    riskFactors: RiskFactor[],
    input: RiskAssessmentInput
  ): Array<{ priority: 'high' | 'medium' | 'low'; action: string; rationale: string; expectedBenefit: number }> {
    const actions: Array<{ priority: 'high' | 'medium' | 'low'; action: string; rationale: string; expectedBenefit: number }> = [];

    // Sort risk factors by risk score
    const sortedRisks = riskFactors.sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));

    // Generate actions for top risks
    sortedRisks.slice(0, 5).forEach(risk => {
      const mitigation = risk.mitigationStrategies[0]; // Best mitigation strategy
      const riskScore = risk.riskScore || 0;
      if (mitigation) {
        actions.push({
          priority: riskScore > 0.6 ? 'high' : riskScore > 0.3 ? 'medium' : 'low',
          action: mitigation.strategy,
          rationale: `Addresses ${risk.description} (${Math.round(riskScore * 100)}% risk score)`,
          expectedBenefit: mitigation.effectiveness * riskScore
        });
      }
    });

    // Add general recommendations
    if (input.adherencePrediction.successProbability < 0.95) {
      actions.push({
        priority: 'high',
        action: 'Increase budget buffer to achieve 95% adherence guarantee',
        rationale: 'Current plan has lower than guaranteed adherence probability',
        expectedBenefit: Math.min(0.95 - input.adherencePrediction.successProbability, 0.1)
      });
    }

    return actions;
  }
}

// Singleton instance
export const riskAssessmentSystem = new RiskAssessmentSystem(null);