import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export interface BurnRateData {
  userId: string;
  budgetId: string;
  currentBurnRate: number; // Amount spent per day
  projectedBurnRate: number; // Projected based on recent spending
  dailyAverage: number;
  weeklyAverage: number;
  monthlyAverage: number;
  velocity: number; // Acceleration/deceleration factor
  remainingDays: number;
  remainingBudget: number;
  projectedEndDate: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

export interface BurnRateAnalysis {
  period: 'daily' | 'weekly' | 'monthly';
  burnRate: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  dataPoints: number;
}

@Injectable()
export class BurnRateService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Calculate comprehensive burn rate analysis for a budget
   */
  async calculateBurnRate(userId: string, budgetId: string): Promise<BurnRateData> {
    const cacheKey = `burn-rate:${userId}:${budgetId}`;

    // Check cache first
    const cached = await this.cacheManager.get<BurnRateData>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get budget and itinerary details
    const budget = await this.prisma.budget.findUnique({
      where: { id: budgetId, userId },
      include: {
        itinerary: true,
        expenses: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!budget || !budget.itinerary) {
      throw new Error('Budget or itinerary not found');
    }

    const itinerary = budget.itinerary;
    const now = new Date();
    const startDate = new Date(itinerary.startDate);
    const endDate = new Date(itinerary.endDate);

    // Calculate remaining days
    const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.max(1, totalDays - remainingDays);

    // Calculate burn rates
    const burnRateAnalysis = await this.analyzeBurnRatePatterns(budget.expenses, elapsedDays);

    // Calculate remaining budget
    const remainingBudget = budget.totalBudget - budget.spent;

    // Calculate projected burn rate based on recent spending
    const projectedBurnRate = this.calculateProjectedBurnRate(burnRateAnalysis, remainingDays);

    // Calculate risk level
    const riskLevel = this.assessRiskLevel(
      projectedBurnRate,
      remainingBudget,
      remainingDays,
      burnRateAnalysis.velocity
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      riskLevel,
      projectedBurnRate,
      remainingBudget,
      remainingDays,
      burnRateAnalysis
    );

    // Calculate projected end date
    const projectedEndDate = this.calculateProjectedEndDate(
      budget.spent,
      projectedBurnRate,
      budget.totalBudget,
      now
    );

    const burnRateData: BurnRateData = {
      userId,
      budgetId,
      currentBurnRate: burnRateAnalysis.daily.burnRate,
      projectedBurnRate,
      dailyAverage: burnRateAnalysis.daily.burnRate,
      weeklyAverage: burnRateAnalysis.weekly.burnRate,
      monthlyAverage: burnRateAnalysis.monthly.burnRate,
      velocity: burnRateAnalysis.velocity,
      remainingDays,
      remainingBudget,
      projectedEndDate,
      riskLevel,
      recommendations,
    };

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, burnRateData, 300000);

    return burnRateData;
  }

  /**
   * Analyze burn rate patterns across different time periods
   */
  private async analyzeBurnRatePatterns(
    expenses: any[],
    elapsedDays: number
  ): Promise<{
    daily: BurnRateAnalysis;
    weekly: BurnRateAnalysis;
    monthly: BurnRateAnalysis;
    velocity: number;
  }> {
    if (expenses.length === 0) {
      return {
        daily: { period: 'daily', burnRate: 0, trend: 'stable', confidence: 0, dataPoints: 0 },
        weekly: { period: 'weekly', burnRate: 0, trend: 'stable', confidence: 0, dataPoints: 0 },
        monthly: { period: 'monthly', burnRate: 0, trend: 'stable', confidence: 0, dataPoints: 0 },
        velocity: 0,
      };
    }

    // Group expenses by date
    const dailySpending = expenses.reduce((acc, expense) => {
      const date = expense.date.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const dates = Object.keys(dailySpending).sort();
    const amounts = dates.map(date => dailySpending[date]);

    // Calculate daily burn rate
    const dailyBurnRate = amounts.reduce((sum, amount) => sum + amount, 0) / Math.max(1, dates.length);

    // Calculate weekly burn rate (last 7 days or available data)
    const weeklyData = amounts.slice(-7);
    const weeklyBurnRate = weeklyData.length > 0 ? weeklyData.reduce((sum, amount) => sum + amount, 0) / weeklyData.length : dailyBurnRate;

    // Calculate monthly burn rate (last 30 days or available data)
    const monthlyData = amounts.slice(-30);
    const monthlyBurnRate = monthlyData.length > 0 ? monthlyData.reduce((sum, amount) => sum + amount, 0) / monthlyData.length : dailyBurnRate;

    // Calculate trends
    const dailyTrend = this.calculateTrend(amounts);
    const weeklyTrend = this.calculateTrend(weeklyData);
    const monthlyTrend = this.calculateTrend(monthlyData);

    // Calculate velocity (acceleration/deceleration)
    const velocity = this.calculateVelocity(amounts, elapsedDays);

    return {
      daily: {
        period: 'daily',
        burnRate: dailyBurnRate,
        trend: dailyTrend,
        confidence: Math.min(dates.length / 7, 1), // Higher confidence with more data
        dataPoints: dates.length,
      },
      weekly: {
        period: 'weekly',
        burnRate: weeklyBurnRate,
        trend: weeklyTrend,
        confidence: Math.min(weeklyData.length / 7, 1),
        dataPoints: weeklyData.length,
      },
      monthly: {
        period: 'monthly',
        burnRate: monthlyBurnRate,
        trend: monthlyTrend,
        confidence: Math.min(monthlyData.length / 30, 1),
        dataPoints: monthlyData.length,
      },
      velocity,
    };
  }

  /**
   * Calculate spending trend
   */
  private calculateTrend(amounts: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (amounts.length < 2) return 'stable';

    const recent = amounts.slice(-Math.min(7, amounts.length));
    const earlier = amounts.slice(-Math.min(14, amounts.length), -Math.min(7, amounts.length));

    if (earlier.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, amt) => sum + amt, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, amt) => sum + amt, 0) / earlier.length;

    const change = (recentAvg - earlierAvg) / earlierAvg;

    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  /**
   * Calculate spending velocity (rate of change)
   */
  private calculateVelocity(amounts: number[], elapsedDays: number): number {
    if (amounts.length < 3) return 0;

    // Calculate linear regression slope
    const n = amounts.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = amounts;

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    // Normalize by average spending
    const avgSpending = sumY / n;
    return avgSpending > 0 ? slope / avgSpending : 0;
  }

  /**
   * Calculate projected burn rate based on recent trends
   */
  private calculateProjectedBurnRate(
    analysis: {
      daily: BurnRateAnalysis;
      weekly: BurnRateAnalysis;
      monthly: BurnRateAnalysis;
      velocity: number;
    },
    remainingDays: number
  ): number {
    // Weight recent data more heavily
    const weights = { daily: 0.5, weekly: 0.3, monthly: 0.2 };
    const projectedRate =
      analysis.daily.burnRate * weights.daily +
      analysis.weekly.burnRate * weights.weekly +
      analysis.monthly.burnRate * weights.monthly;

    // Adjust for velocity (trend)
    const velocityAdjustment = 1 + (analysis.velocity * 0.1); // 10% adjustment per velocity unit
    return Math.max(0, projectedRate * velocityAdjustment);
  }

  /**
   * Assess risk level based on burn rate analysis
   */
  private assessRiskLevel(
    projectedBurnRate: number,
    remainingBudget: number,
    remainingDays: number,
    velocity: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (remainingDays === 0) return 'critical';

    const dailyBudget = remainingBudget / remainingDays;
    const burnRateRatio = projectedBurnRate / dailyBudget;

    // Factor in velocity (acceleration increases risk)
    const velocityRisk = velocity > 0.2 ? 0.2 : velocity < -0.2 ? -0.2 : 0;
    const adjustedRatio = burnRateRatio + velocityRisk;

    if (adjustedRatio > 1.5) return 'critical';
    if (adjustedRatio > 1.2) return 'high';
    if (adjustedRatio > 0.9) return 'medium';
    return 'low';
  }

  /**
   * Generate recommendations based on burn rate analysis
   */
  private generateRecommendations(
    riskLevel: string,
    projectedBurnRate: number,
    remainingBudget: number,
    remainingDays: number,
    analysis: any
  ): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'critical') {
      recommendations.push('🚨 Critical: Your spending rate exceeds budget capacity. Immediate action required.');
      recommendations.push('Consider postponing non-essential expenses.');
      recommendations.push('Review and adjust your daily spending limits.');
    } else if (riskLevel === 'high') {
      recommendations.push('⚠️ High Risk: Spending rate is concerning. Monitor closely.');
      recommendations.push('Identify areas where you can reduce spending.');
      recommendations.push('Consider reallocating budget from less critical categories.');
    } else if (riskLevel === 'medium') {
      recommendations.push('📊 Moderate Risk: Keep an eye on your spending velocity.');
      recommendations.push('Track expenses daily to ensure you stay on budget.');
    }

    if (analysis.velocity > 0.1) {
      recommendations.push('📈 Spending is accelerating. Consider implementing stricter daily limits.');
    } else if (analysis.velocity < -0.1) {
      recommendations.push('📉 Spending is decelerating. You may have room for planned expenses.');
    }

    if (remainingDays > 0) {
      const suggestedDailyLimit = remainingBudget / remainingDays;
      recommendations.push(`💡 Suggested daily limit: IDR ${suggestedDailyLimit.toLocaleString('id-ID')}`);
    }

    return recommendations;
  }

  /**
   * Calculate projected end date based on current spending
   */
  private calculateProjectedEndDate(
    spent: number,
    projectedBurnRate: number,
    totalBudget: number,
    currentDate: Date
  ): Date {
    const remainingBudget = totalBudget - spent;

    if (projectedBurnRate <= 0) {
      return new Date(currentDate.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year from now
    }

    const daysToExhaust = remainingBudget / projectedBurnRate;
    return new Date(currentDate.getTime() + (daysToExhaust * 24 * 60 * 60 * 1000));
  }

  /**
   * Get burn rate history for visualization
   */
  async getBurnRateHistory(userId: string, budgetId: string, days: number = 30): Promise<any[]> {
    const cacheKey = `burn-rate-history:${userId}:${budgetId}:${days}`;

    const cached = await this.cacheManager.get<any[]>(cacheKey);
    if (cached && Array.isArray(cached)) return cached;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const expenses = await this.prisma.expense.findMany({
      where: {
        userId,
        budgetId,
        date: {
          gte: startDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Group by date and calculate cumulative spending
    const dailyData = expenses.reduce((acc, expense) => {
      const date = expense.date.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, amount: 0, cumulative: 0 };
      }
      acc[date].amount += expense.amount;
      return acc;
    }, {} as Record<string, any>);

    // Calculate cumulative spending
    const dates = Object.keys(dailyData).sort();
    let cumulative = 0;

    const history = dates.map(date => {
      cumulative += dailyData[date].amount;
      return {
        date,
        dailyAmount: dailyData[date].amount,
        cumulativeAmount: cumulative,
        burnRate: dailyData[date].amount, // Daily burn rate
      };
    });

    await this.cacheManager.set(cacheKey, history, 300000); // Cache for 5 minutes
    return history;
  }

  /**
   * Clear cache for a specific budget
   */
  async clearCache(userId: string, budgetId: string): Promise<void> {
    const cacheKey = `burn-rate:${userId}:${budgetId}`;
    await this.cacheManager.del(cacheKey);

    // Note: History cache clearing not implemented for in-memory cache
  }
}