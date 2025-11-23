// Spending Pattern Analyzer for Auto Budget Correction System
// Analyzes user spending patterns to detect overspending and predict future behavior

import { mlEngine, UserPreferenceProfile } from './ml-engine';
import { budgetEngine } from './intelligent-budget-engine';

export interface SpendingData {
  userId: string;
  date: Date;
  category: 'accommodation' | 'transportation' | 'food' | 'activities' | 'miscellaneous';
  amount: number;
  description?: string;
  location?: string;
  plannedAmount?: number; // What was budgeted for this expense
}

export interface OverspendingAlert {
  userId: string;
  category: string;
  actualSpent: number;
  budgetedAmount: number;
  overspendAmount: number;
  overspendPercentage: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timeFrame: 'daily' | 'weekly' | 'monthly';
  detectedAt: Date;
  recommendations: string[];
}

export interface SpendingPattern {
  userId: string;
  averageDailySpend: number;
  averageCategorySpend: Record<string, number>;
  spendingVelocity: number; // Rate of spending increase/decrease
  riskScore: number; // 0-1, higher means higher risk of overspending
  patterns: {
    weekendMultiplier: number;
    peakHourMultiplier: number;
    locationVariance: Record<string, number>;
    categoryTrends: Record<string, 'increasing' | 'decreasing' | 'stable'>;
  };
  predictions: {
    projectedTotalSpend: number;
    confidence: number;
    riskFactors: string[];
  };
}

export class SpendingPatternAnalyzer {
  private spendingHistory: Map<string, SpendingData[]> = new Map();
  private patternCache: Map<string, SpendingPattern> = new Map();

  // Track spending data for analysis
  trackSpending(data: SpendingData): void {
    const userHistory = this.spendingHistory.get(data.userId) || [];
    userHistory.push(data);

    // Keep only recent history (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const recentHistory = userHistory.filter(item => item.date >= ninetyDaysAgo);
    this.spendingHistory.set(data.userId, recentHistory);

    // Invalidate cache for this user
    this.patternCache.delete(data.userId);
  }

  // Analyze spending patterns for a user
  analyzePatterns(userId: string): SpendingPattern {
    // Check cache first
    const cached = this.patternCache.get(userId);
    if (cached) return cached;

    const history = this.spendingHistory.get(userId) || [];
    if (history.length === 0) {
      return this.getDefaultPattern(userId);
    }

    const userProfile = mlEngine.getUserProfile(userId);
    const pattern = this.calculateSpendingPattern(history, userProfile);

    // Cache the result
    this.patternCache.set(userId, pattern);
    return pattern;
  }

  // Detect overspending based on thresholds
  detectOverspending(userId: string, budgetLimits: Record<string, number>): OverspendingAlert[] {
    const history = this.spendingHistory.get(userId) || [];
    const alerts: OverspendingAlert[] = [];

    // Group spending by time frames
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);
    const monthStart = new Date(today);
    monthStart.setMonth(today.getMonth() - 1);

    const dailySpend = this.sumSpendingInPeriod(history, today, today);
    const weeklySpend = this.sumSpendingInPeriod(history, weekStart, today);
    const monthlySpend = this.sumSpendingInPeriod(history, monthStart, today);

    // Check daily overspending
    if (budgetLimits.daily && dailySpend.total > budgetLimits.daily) {
      alerts.push(this.createOverspendingAlert(
        userId, 'daily', dailySpend, budgetLimits.daily, today
      ));
    }

    // Check weekly overspending
    if (budgetLimits.weekly && weeklySpend.total > budgetLimits.weekly) {
      alerts.push(this.createOverspendingAlert(
        userId, 'weekly', weeklySpend, budgetLimits.weekly, today
      ));
    }

    // Check monthly overspending
    if (budgetLimits.monthly && monthlySpend.total > budgetLimits.monthly) {
      alerts.push(this.createOverspendingAlert(
        userId, 'monthly', monthlySpend, budgetLimits.monthly, today
      ));
    }

    // Check category-specific overspending
    Object.entries(budgetLimits).forEach(([key, limit]) => {
      if (key.includes('_category_')) {
        const category = key.replace('_category_', '');
        const categorySpend = this.sumCategorySpending(history, category, monthStart, today);
        if (categorySpend > limit) {
          alerts.push(this.createCategoryOverspendingAlert(
            userId, category, categorySpend, limit, today
          ));
        }
      }
    });

    return alerts;
  }

  // Predict future spending based on patterns
  predictFutureSpending(userId: string, daysAhead: number = 7): {
    predictedSpend: number;
    confidence: number;
    breakdown: Record<string, number>;
    riskFactors: string[];
  } {
    const pattern = this.analyzePatterns(userId);
    const history = this.spendingHistory.get(userId) || [];

    if (history.length < 7) {
      return {
        predictedSpend: pattern.averageDailySpend * daysAhead,
        confidence: 0.3,
        breakdown: {},
        riskFactors: ['Insufficient spending history for accurate prediction']
      };
    }

    // Use ML-based prediction
    const prediction = this.calculateMLPrediction(history, pattern, daysAhead);

    return {
      predictedSpend: prediction.total,
      confidence: prediction.confidence,
      breakdown: prediction.breakdown,
      riskFactors: prediction.riskFactors
    };
  }

  private calculateSpendingPattern(history: SpendingData[], profile: UserPreferenceProfile | null): SpendingPattern {
    const totalDays = this.getUniqueDays(history);
    const totalSpend = history.reduce((sum, item) => sum + item.amount, 0);
    const averageDailySpend = totalDays > 0 ? totalSpend / totalDays : 0;

    // Calculate category averages
    const categorySpend: Record<string, number> = {};
    history.forEach(item => {
      categorySpend[item.category] = (categorySpend[item.category] || 0) + item.amount;
    });

    const averageCategorySpend: Record<string, number> = {};
    Object.keys(categorySpend).forEach(category => {
      averageCategorySpend[category] = categorySpend[category] / totalDays;
    });

    // Calculate spending velocity (trend)
    const spendingVelocity = this.calculateSpendingVelocity(history);

    // Calculate risk score
    const riskScore = this.calculateRiskScore(history, profile, spendingVelocity);

    // Analyze patterns
    const patterns = this.analyzeDetailedPatterns(history);

    // Create pattern object for predictions
    const pattern = {
      userId: history[0]?.userId || '',
      averageDailySpend,
      averageCategorySpend,
      spendingVelocity,
      riskScore,
      patterns,
      predictions: { projectedTotalSpend: 0, confidence: 0, riskFactors: [] } // Placeholder
    };

    // Generate predictions
    const predictions = this.generatePredictions(history, pattern);

    return {
      userId: history[0]?.userId || '',
      averageDailySpend,
      averageCategorySpend,
      spendingVelocity,
      riskScore,
      patterns,
      predictions
    };
  }

  private calculateSpendingVelocity(history: SpendingData[]): number {
    if (history.length < 14) return 0;

    const sortedHistory = history.sort((a, b) => a.date.getTime() - b.date.getTime());
    const midPoint = Math.floor(sortedHistory.length / 2);

    const firstHalf = sortedHistory.slice(0, midPoint);
    const secondHalf = sortedHistory.slice(midPoint);

    const firstHalfAvg = firstHalf.reduce((sum, item) => sum + item.amount, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, item) => sum + item.amount, 0) / secondHalf.length;

    return secondHalfAvg > 0 ? (secondHalfAvg - firstHalfAvg) / firstHalfAvg : 0;
  }

  private calculateRiskScore(history: SpendingData[], profile: UserPreferenceProfile | null, velocity: number): number {
    let riskScore = 0;

    // Velocity risk
    if (Math.abs(velocity) > 0.5) riskScore += 0.3;

    // Profile-based risk
    if (profile) {
      if (profile.mlInsights.priceSensitivity < 0.3) riskScore += 0.2; // Not price sensitive
      if (profile.mlInsights.spontaneityScore > 0.7) riskScore += 0.2; // Highly spontaneous
    }

    // Recent overspending
    const recentHistory = history.filter(item => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return item.date >= weekAgo;
    });

    const overspendRatio = recentHistory.filter(item =>
      item.plannedAmount && item.amount > item.plannedAmount
    ).length / recentHistory.length;

    riskScore += overspendRatio * 0.3;

    return Math.min(riskScore, 1);
  }

  private analyzeDetailedPatterns(history: SpendingData[]): SpendingPattern['patterns'] {
    // Weekend spending multiplier
    const weekendSpend = history
      .filter(item => [0, 6].includes(item.date.getDay()))
      .reduce((sum, item) => sum + item.amount, 0);
    const weekdaySpend = history
      .filter(item => ![0, 6].includes(item.date.getDay()))
      .reduce((sum, item) => sum + item.amount, 0);

    const weekendMultiplier = weekdaySpend > 0 ? weekendSpend / weekdaySpend : 1;

    // Location variance
    const locationSpend: Record<string, number> = {};
    history.forEach(item => {
      if (item.location) {
        locationSpend[item.location] = (locationSpend[item.location] || 0) + item.amount;
      }
    });

    const avgLocationSpend = Object.values(locationSpend).reduce((a, b) => a + b, 0) / Object.keys(locationSpend).length;
    const locationVariance: Record<string, number> = {};
    Object.entries(locationSpend).forEach(([location, spend]) => {
      locationVariance[location] = avgLocationSpend > 0 ? spend / avgLocationSpend : 1;
    });

    // Category trends
    const categoryTrends: Record<string, 'increasing' | 'decreasing' | 'stable'> = {};
    const categories = ['accommodation', 'transportation', 'food', 'activities', 'miscellaneous'];

    categories.forEach(category => {
      const categoryHistory = history.filter(item => item.category === category);
      if (categoryHistory.length >= 7) {
        const trend = this.calculateCategoryTrend(categoryHistory);
        categoryTrends[category] = trend;
      } else {
        categoryTrends[category] = 'stable';
      }
    });

    return {
      weekendMultiplier,
      peakHourMultiplier: 1, // Simplified
      locationVariance,
      categoryTrends
    };
  }

  private calculateCategoryTrend(categoryHistory: SpendingData[]): 'increasing' | 'decreasing' | 'stable' {
    const sorted = categoryHistory.sort((a, b) => a.date.getTime() - b.date.getTime());
    const midPoint = Math.floor(sorted.length / 2);

    const firstHalf = sorted.slice(0, midPoint);
    const secondHalf = sorted.slice(midPoint);

    const firstAvg = firstHalf.reduce((sum, item) => sum + item.amount, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, item) => sum + item.amount, 0) / secondHalf.length;

    const change = (secondAvg - firstAvg) / firstAvg;

    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  private generatePredictions(history: SpendingData[], pattern: SpendingPattern): SpendingPattern['predictions'] {
    const recentHistory = history.filter(item => {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return item.date >= monthAgo;
    });

    const monthlySpend = recentHistory.reduce((sum, item) => sum + item.amount, 0);
    const projectedTotalSpend = monthlySpend * 1.1; // 10% increase assumption

    const riskFactors: string[] = [];
    if (pattern.spendingVelocity > 0.2) riskFactors.push('Spending is increasing rapidly');
    if (pattern.riskScore > 0.7) riskFactors.push('High risk of overspending');
    if (pattern.patterns.weekendMultiplier > 1.5) riskFactors.push('High weekend spending pattern');

    return {
      projectedTotalSpend,
      confidence: Math.max(0.3, 1 - pattern.riskScore),
      riskFactors
    };
  }

  private sumSpendingInPeriod(history: SpendingData[], startDate: Date, endDate: Date): {
    total: number;
    byCategory: Record<string, number>;
  } {
    const filtered = history.filter(item =>
      item.date >= startDate && item.date <= endDate
    );

    const total = filtered.reduce((sum, item) => sum + item.amount, 0);
    const byCategory: Record<string, number> = {};

    filtered.forEach(item => {
      byCategory[item.category] = (byCategory[item.category] || 0) + item.amount;
    });

    return { total, byCategory };
  }

  private sumCategorySpending(history: SpendingData[], category: string, startDate: Date, endDate: Date): number {
    return history
      .filter(item => item.category === category && item.date >= startDate && item.date <= endDate)
      .reduce((sum, item) => sum + item.amount, 0);
  }

  private createOverspendingAlert(
    userId: string,
    timeFrame: 'daily' | 'weekly' | 'monthly',
    actualSpend: { total: number; byCategory: Record<string, number> },
    budgetedAmount: number,
    detectedAt: Date
  ): OverspendingAlert {
    const overspendAmount = actualSpend.total - budgetedAmount;
    const overspendPercentage = (overspendAmount / budgetedAmount) * 100;

    let severity: 'low' | 'medium' | 'high' | 'critical';
    if (overspendPercentage < 10) severity = 'low';
    else if (overspendPercentage < 25) severity = 'medium';
    else if (overspendPercentage < 50) severity = 'high';
    else severity = 'critical';

    const recommendations = this.generateOverspendRecommendations(
      timeFrame, severity, actualSpend.byCategory
    );

    return {
      userId,
      category: 'total',
      actualSpent: actualSpend.total,
      budgetedAmount,
      overspendAmount,
      overspendPercentage,
      severity,
      timeFrame,
      detectedAt,
      recommendations
    };
  }

  private createCategoryOverspendingAlert(
    userId: string,
    category: string,
    actualSpent: number,
    budgetedAmount: number,
    detectedAt: Date
  ): OverspendingAlert {
    const overspendAmount = actualSpent - budgetedAmount;
    const overspendPercentage = (overspendAmount / budgetedAmount) * 100;

    let severity: 'low' | 'medium' | 'high' | 'critical';
    if (overspendPercentage < 20) severity = 'low';
    else if (overspendPercentage < 50) severity = 'medium';
    else if (overspendPercentage < 100) severity = 'high';
    else severity = 'critical';

    return {
      userId,
      category,
      actualSpent,
      budgetedAmount,
      overspendAmount,
      overspendPercentage,
      severity,
      timeFrame: 'monthly',
      detectedAt,
      recommendations: [`Reduce spending in ${category} category`, `Look for cheaper alternatives in ${category}`]
    };
  }

  private generateOverspendRecommendations(
    timeFrame: string,
    severity: string,
    categoryBreakdown: Record<string, number>
  ): string[] {
    const recommendations: string[] = [];

    if (severity === 'critical') {
      recommendations.push('Immediate budget review required');
      recommendations.push('Consider postponing non-essential expenses');
    }

    // Find highest spending category
    const highestCategory = Object.entries(categoryBreakdown)
      .sort(([,a], [,b]) => b - a)[0]?.[0];

    if (highestCategory) {
      recommendations.push(`Focus on reducing ${highestCategory} expenses`);
    }

    recommendations.push('Review upcoming planned expenses');
    recommendations.push('Consider cheaper accommodation options');

    return recommendations;
  }

  private calculateMLPrediction(
    history: SpendingData[],
    pattern: SpendingPattern,
    daysAhead: number
  ): {
    total: number;
    confidence: number;
    breakdown: Record<string, number>;
    riskFactors: string[];
  } {
    const recentDailyAvg = this.calculateRecentDailyAverage(history, 7);
    const predictedTotal = recentDailyAvg * daysAhead * (1 + pattern.spendingVelocity * 0.1);

    const breakdown: Record<string, number> = {};
    Object.entries(pattern.averageCategorySpend).forEach(([category, avg]) => {
      breakdown[category] = avg * daysAhead;
    });

    const confidence = Math.max(0.4, 1 - pattern.riskScore - Math.abs(pattern.spendingVelocity));

    return {
      total: predictedTotal,
      confidence,
      breakdown,
      riskFactors: pattern.predictions.riskFactors
    };
  }

  private calculateRecentDailyAverage(history: SpendingData[], days: number): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const recent = history.filter(item => item.date >= cutoff);
    const uniqueDays = this.getUniqueDays(recent);

    return uniqueDays > 0 ? recent.reduce((sum, item) => sum + item.amount, 0) / uniqueDays : 0;
  }

  private getUniqueDays(history: SpendingData[]): number {
    const uniqueDates = new Set(
      history.map(item => item.date.toDateString())
    );
    return uniqueDates.size;
  }

  private getDefaultPattern(userId: string): SpendingPattern {
    return {
      userId,
      averageDailySpend: 0,
      averageCategorySpend: {
        accommodation: 0,
        transportation: 0,
        food: 0,
        activities: 0,
        miscellaneous: 0
      },
      spendingVelocity: 0,
      riskScore: 0.5,
      patterns: {
        weekendMultiplier: 1,
        peakHourMultiplier: 1,
        locationVariance: {},
        categoryTrends: {
          accommodation: 'stable',
          transportation: 'stable',
          food: 'stable',
          activities: 'stable',
          miscellaneous: 'stable'
        }
      },
      predictions: {
        projectedTotalSpend: 0,
        confidence: 0.1,
        riskFactors: ['No spending history available']
      }
    };
  }
}

// Singleton instance
export const spendingPatternAnalyzer = new SpendingPatternAnalyzer();