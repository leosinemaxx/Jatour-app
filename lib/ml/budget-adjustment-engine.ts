// Budget Adjustment Engine for Auto Budget Correction System
// Generates personalized budget adjustments based on overspending detection and user preferences

import { mlEngine, UserPreferenceProfile, MLRecommendation } from './ml-engine';
import { spendingPatternAnalyzer, OverspendingAlert, SpendingPattern } from './spending-pattern-analyzer';
import { budgetEngine } from './intelligent-budget-engine';

export interface BudgetAdjustment {
  userId: string;
  adjustmentId: string;
  trigger: 'overspending' | 'pattern_change' | 'upcoming_expense' | 'proactive';
  severity: 'low' | 'medium' | 'high' | 'critical';
  adjustments: CategoryAdjustment[];
  alternativeRecommendations: AlternativeRecommendation[];
  timeline: {
    immediate: string[]; // Actions to take right now
    shortTerm: string[]; // Actions for next few days
    longTerm: string[]; // Actions for rest of trip
  };
  expectedSavings: number;
  confidence: number;
  generatedAt: Date;
  expiresAt?: Date;
}

export interface CategoryAdjustment {
  category: 'accommodation' | 'transportation' | 'food' | 'activities' | 'miscellaneous';
  currentBudget: number;
  recommendedBudget: number;
  adjustmentAmount: number;
  adjustmentType: 'increase' | 'decrease' | 'redistribution';
  reason: string;
  alternatives: string[];
}

export interface AlternativeRecommendation {
  originalItem: {
    id: string;
    name: string;
    category: string;
    estimatedCost: number;
  };
  alternatives: Array<{
    id: string;
    name: string;
    category: string;
    estimatedCost: number;
    savings: number;
    appealScore: number; // 0-1, how appealing this alternative is
    tradeoffs: string[];
    reason: string;
  }>;
  priority: 'high' | 'medium' | 'low';
}

export interface AdjustmentContext {
  userId: string;
  currentBudget: {
    total: number;
    categories: Record<string, number>;
    remainingDays: number;
  };
  overspendingAlerts: OverspendingAlert[];
  spendingPattern: SpendingPattern;
  upcomingExpenses: Array<{
    id: string;
    category: string;
    estimatedCost: number;
    date: Date;
    flexibility: 'fixed' | 'flexible' | 'optional';
  }>;
  userPreferences: UserPreferenceProfile;
}

export class BudgetAdjustmentEngine {
  private adjustmentHistory: Map<string, BudgetAdjustment[]> = new Map();

  // Generate budget adjustments based on current context
  async generateAdjustments(context: AdjustmentContext): Promise<BudgetAdjustment> {
    const { userId, overspendingAlerts, spendingPattern, userPreferences } = context;

    // Determine trigger and severity
    const trigger = this.determineTrigger(overspendingAlerts, spendingPattern);
    const severity = this.calculateSeverity(overspendingAlerts, spendingPattern);

    // Generate category adjustments
    const categoryAdjustments = await this.generateCategoryAdjustments(context);

    // Generate alternative recommendations
    const alternativeRecommendations = await this.generateAlternativeRecommendations(context);

    // Create timeline
    const timeline = this.createAdjustmentTimeline(categoryAdjustments, alternativeRecommendations, context);

    // Calculate expected savings
    const expectedSavings = this.calculateExpectedSavings(categoryAdjustments, alternativeRecommendations);

    // Calculate confidence
    const confidence = this.calculateAdjustmentConfidence(context, categoryAdjustments);

    const adjustment: BudgetAdjustment = {
      userId,
      adjustmentId: this.generateAdjustmentId(),
      trigger,
      severity,
      adjustments: categoryAdjustments,
      alternativeRecommendations,
      timeline,
      expectedSavings,
      confidence,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 7 days
    };

    // Store in history
    const userHistory = this.adjustmentHistory.get(userId) || [];
    userHistory.push(adjustment);
    this.adjustmentHistory.set(userId, userHistory);

    return adjustment;
  }

  // Apply budget adjustments to existing itinerary/budget
  async applyAdjustments(adjustment: BudgetAdjustment, itineraryId?: string): Promise<{
    success: boolean;
    appliedAdjustments: string[];
    warnings: string[];
  }> {
    const applied: string[] = [];
    const warnings: string[] = [];

    try {
      // Apply category budget adjustments
      for (const categoryAdjustment of adjustment.adjustments) {
        // In a real implementation, this would update the budget in the database
        applied.push(`Adjusted ${categoryAdjustment.category} budget by ${categoryAdjustment.adjustmentAmount}`);
      }

      // Apply alternative recommendations
      for (const recommendation of adjustment.alternativeRecommendations) {
        if (recommendation.priority === 'high') {
          applied.push(`Recommended alternative for ${recommendation.originalItem.name}`);
        }
      }

      return {
        success: true,
        appliedAdjustments: applied,
        warnings
      };
    } catch (error) {
      warnings.push(`Failed to apply adjustments: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        success: false,
        appliedAdjustments: applied,
        warnings
      };
    }
  }

  // Get adjustment history for a user
  getAdjustmentHistory(userId: string): BudgetAdjustment[] {
    return this.adjustmentHistory.get(userId) || [];
  }

  // Validate if adjustments are still relevant
  validateAdjustments(adjustment: BudgetAdjustment, currentContext: Partial<AdjustmentContext>): {
    isValid: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];

    if (adjustment.expiresAt && new Date() > adjustment.expiresAt) {
      reasons.push('Adjustment has expired');
    }

    if (currentContext.overspendingAlerts) {
      const newCriticalAlerts = currentContext.overspendingAlerts.filter(
        alert => alert.severity === 'critical'
      );
      if (newCriticalAlerts.length > 0) {
        reasons.push('New critical overspending alerts detected');
      }
    }

    return {
      isValid: reasons.length === 0,
      reasons
    };
  }

  private determineTrigger(alerts: OverspendingAlert[], pattern: SpendingPattern): BudgetAdjustment['trigger'] {
    if (alerts.some(alert => alert.severity === 'critical')) {
      return 'overspending';
    }

    if (pattern.riskScore > 0.8) {
      return 'pattern_change';
    }

    if (alerts.length > 0) {
      return 'overspending';
    }

    return 'proactive';
  }

  private calculateSeverity(alerts: OverspendingAlert[], pattern: SpendingPattern): BudgetAdjustment['severity'] {
    const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
    if (criticalAlerts.length > 0) return 'critical';

    const highAlerts = alerts.filter(alert => alert.severity === 'high');
    if (highAlerts.length > 0 || pattern.riskScore > 0.8) return 'high';

    const mediumAlerts = alerts.filter(alert => alert.severity === 'medium');
    if (mediumAlerts.length > 0 || pattern.riskScore > 0.6) return 'medium';

    return 'low';
  }

  private async generateCategoryAdjustments(context: AdjustmentContext): Promise<CategoryAdjustment[]> {
    const { currentBudget, overspendingAlerts, spendingPattern, userPreferences, upcomingExpenses } = context;
    const adjustments: CategoryAdjustment[] = [];

    // Analyze each category
    const categories: Array<'accommodation' | 'transportation' | 'food' | 'activities' | 'miscellaneous'> =
      ['accommodation', 'transportation', 'food', 'activities', 'miscellaneous'];

    for (const category of categories) {
      const currentCategoryBudget = currentBudget.categories[category] || 0;
      const categoryAlerts = overspendingAlerts.filter(alert =>
        alert.category === category || alert.category === 'total'
      );

      const adjustment = await this.calculateCategoryAdjustment(
        category,
        currentCategoryBudget,
        categoryAlerts,
        spendingPattern,
        userPreferences,
        upcomingExpenses,
        currentBudget.remainingDays
      );

      if (adjustment) {
        adjustments.push(adjustment);
      }
    }

    return adjustments;
  }

  private async calculateCategoryAdjustment(
    category: string,
    currentBudget: number,
    alerts: OverspendingAlert[],
    pattern: SpendingPattern,
    preferences: UserPreferenceProfile,
    upcomingExpenses: AdjustmentContext['upcomingExpenses'],
    remainingDays: number
  ): Promise<CategoryAdjustment | null> {
    let recommendedBudget = currentBudget;
    let adjustmentType: CategoryAdjustment['adjustmentType'] = 'decrease';
    let reason = '';
    const alternatives: string[] = [];

    // Calculate overspending impact
    const categoryOverspend = alerts.reduce((sum, alert) => {
      if (alert.category === category) {
        return sum + alert.overspendAmount;
      }
      // For total alerts, distribute proportionally
      if (alert.category === 'total') {
        const proportion = currentBudget / (alert.budgetedAmount || 1);
        return sum + (alert.overspendAmount * proportion);
      }
      return sum;
    }, 0);

    if (categoryOverspend > 0) {
      // Reduce budget for overspent categories
      const reductionFactor = Math.min(categoryOverspend / currentBudget, 0.3); // Max 30% reduction
      recommendedBudget = currentBudget * (1 - reductionFactor);
      reason = `Overspent by ${categoryOverspend.toLocaleString()} IDR in ${category}`;
      alternatives.push('Look for cheaper options in this category');
      alternatives.push('Consider postponing non-essential expenses');
    } else {
      // Check spending patterns and upcoming expenses
      const patternTrend = pattern.patterns.categoryTrends[category];
      const upcomingCategoryExpenses = upcomingExpenses.filter(
        exp => exp.category === category && exp.flexibility !== 'fixed'
      );

      if (patternTrend === 'increasing' && preferences.mlInsights.priceSensitivity > 0.6) {
        // Proactively reduce budget for increasing spend patterns
        recommendedBudget = currentBudget * 0.9;
        adjustmentType = 'decrease';
        reason = `Spending pattern shows increasing trend in ${category}`;
        alternatives.push('Monitor spending more closely');
      } else if (upcomingCategoryExpenses.length > 0) {
        // Adjust for upcoming expenses
        const upcomingTotal = upcomingCategoryExpenses.reduce((sum, exp) => sum + exp.estimatedCost, 0);
        const dailyUpcoming = upcomingTotal / remainingDays;

        if (dailyUpcoming > pattern.averageCategorySpend[category] * 1.5) {
          recommendedBudget = currentBudget * 1.2;
          adjustmentType = 'increase';
          reason = `Upcoming expenses in ${category} require budget increase`;
        }
      }
    }

    const adjustmentAmount = recommendedBudget - currentBudget;

    // Only return adjustment if there's a meaningful change (>5%)
    if (Math.abs(adjustmentAmount) / currentBudget > 0.05) {
      return {
        category: category as any,
        currentBudget,
        recommendedBudget,
        adjustmentAmount,
        adjustmentType,
        reason,
        alternatives
      };
    }

    return null;
  }

  private async generateAlternativeRecommendations(context: AdjustmentContext): Promise<AlternativeRecommendation[]> {
    const { overspendingAlerts, userPreferences, upcomingExpenses } = context;
    const recommendations: AlternativeRecommendation[] = [];

    // Focus on high-priority categories with overspending
    const priorityCategories = overspendingAlerts
      .filter(alert => alert.severity === 'high' || alert.severity === 'critical')
      .map(alert => alert.category)
      .filter((category, index, arr) => arr.indexOf(category) === index);

    for (const category of priorityCategories) {
      if (category === 'total') continue;

      const categoryExpenses = upcomingExpenses.filter(exp => exp.category === category);
      for (const expense of categoryExpenses) {
        const alternatives = await this.findAlternativesForExpense(expense, userPreferences);
        if (alternatives.length > 0) {
          recommendations.push({
            originalItem: {
              id: expense.id,
              name: expense.id, // In real implementation, would have proper names
              category: expense.category,
              estimatedCost: expense.estimatedCost
            },
            alternatives,
            priority: overspendingAlerts.some(alert =>
              alert.category === category &&
              (alert.severity === 'critical' || alert.severity === 'high')
            ) ? 'high' : 'medium'
          });
        }
      }
    }

    return recommendations;
  }

  private async findAlternativesForExpense(
    expense: AdjustmentContext['upcomingExpenses'][0],
    preferences: UserPreferenceProfile
  ): Promise<AlternativeRecommendation['alternatives']> {
    // In a real implementation, this would query a database of alternatives
    // For now, generate mock alternatives based on category and preferences

    const alternatives: AlternativeRecommendation['alternatives'] = [];

    switch (expense.category) {
      case 'food':
        if (preferences.mlInsights.priceSensitivity > 0.5) {
          alternatives.push({
            id: `alt_food_${expense.id}_1`,
            name: 'Local Warung instead of Restaurant',
            category: 'food',
            estimatedCost: expense.estimatedCost * 0.6,
            savings: expense.estimatedCost * 0.4,
            appealScore: 0.7,
            tradeoffs: ['Less formal dining experience'],
            reason: 'Local options provide authentic experience at lower cost'
          });
        }
        break;

      case 'accommodation':
        alternatives.push({
          id: `alt_accommodation_${expense.id}_1`,
          name: 'Budget Hotel Alternative',
          category: 'accommodation',
          estimatedCost: expense.estimatedCost * 0.75,
          savings: expense.estimatedCost * 0.25,
          appealScore: 0.8,
          tradeoffs: ['Fewer amenities', 'Smaller room'],
          reason: 'Maintains comfort while reducing costs'
        });
        break;

      case 'activities':
        alternatives.push({
          id: `alt_activity_${expense.id}_1`,
          name: 'Free Local Experience',
          category: 'activities',
          estimatedCost: expense.estimatedCost * 0.2,
          savings: expense.estimatedCost * 0.8,
          appealScore: 0.6,
          tradeoffs: ['Less structured experience'],
          reason: 'Discover local culture without cost'
        });
        break;

      case 'transportation':
        alternatives.push({
          id: `alt_transport_${expense.id}_1`,
          name: 'Public Transport Alternative',
          category: 'transportation',
          estimatedCost: expense.estimatedCost * 0.5,
          savings: expense.estimatedCost * 0.5,
          appealScore: 0.7,
          tradeoffs: ['Longer travel time', 'Less comfort'],
          reason: 'Cost-effective way to get around'
        });
        break;
    }

    return alternatives;
  }

  private createAdjustmentTimeline(
    categoryAdjustments: CategoryAdjustment[],
    alternativeRecommendations: AlternativeRecommendation[],
    context: AdjustmentContext
  ): BudgetAdjustment['timeline'] {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];

    // Immediate actions (today)
    immediate.push('Review current budget allocations');
    if (alternativeRecommendations.some(r => r.priority === 'high')) {
      immediate.push('Consider switching to recommended alternatives for upcoming expenses');
    }

    // Short-term actions (next few days)
    categoryAdjustments.forEach(adjustment => {
      if (adjustment.adjustmentType === 'decrease') {
        shortTerm.push(`Monitor spending in ${adjustment.category} category closely`);
      }
    });

    alternativeRecommendations.forEach(rec => {
      if (rec.priority === 'high') {
        shortTerm.push(`Research alternatives for ${rec.originalItem.name}`);
      }
    });

    // Long-term actions (rest of trip)
    longTerm.push('Track overall budget performance weekly');
    longTerm.push('Adjust spending habits based on patterns');

    if (context.spendingPattern.riskScore > 0.7) {
      longTerm.push('Consider building an emergency fund for future trips');
    }

    return { immediate, shortTerm, longTerm };
  }

  private calculateExpectedSavings(
    categoryAdjustments: CategoryAdjustment[],
    alternativeRecommendations: AlternativeRecommendation[]
  ): number {
    let savings = 0;

    // Savings from category adjustments
    categoryAdjustments.forEach(adjustment => {
      if (adjustment.adjustmentAmount < 0) {
        savings += Math.abs(adjustment.adjustmentAmount);
      }
    });

    // Savings from alternative recommendations
    alternativeRecommendations.forEach(rec => {
      rec.alternatives.forEach(alt => {
        savings += alt.savings * 0.5; // Assume 50% adoption rate
      });
    });

    return savings;
  }

  private calculateAdjustmentConfidence(
    context: AdjustmentContext,
    adjustments: CategoryAdjustment[]
  ): number {
    let confidence = 0.7; // Base confidence

    // Increase confidence based on data quality
    if (context.spendingPattern.predictions.confidence > 0.7) {
      confidence += 0.1;
    }

    // Increase confidence for users with clear preferences
    if (context.userPreferences.mlInsights.priceSensitivity > 0.3) {
      confidence += 0.1;
    }

    // Decrease confidence if adjustments are drastic
    const drasticAdjustments = adjustments.filter(adj =>
      Math.abs(adj.adjustmentAmount) / adj.currentBudget > 0.2
    );
    if (drasticAdjustments.length > 0) {
      confidence -= 0.1;
    }

    return Math.max(0.3, Math.min(1.0, confidence));
  }

  private generateAdjustmentId(): string {
    return `adj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const budgetAdjustmentEngine = new BudgetAdjustmentEngine();