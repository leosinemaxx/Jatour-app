import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { mlEngine } from '../../../lib/ml/ml-engine';

export interface SpendingInsightsRequest {
  period: 'week' | 'month' | 'year' | 'all';
  categories?: string[];
  compareWith?: 'previous_period' | 'similar_users' | 'city_average';
}

export interface SpendingComparison {
  type: 'personal' | 'peer' | 'city';
  category: string;
  userAverage: number;
  comparisonAverage: number;
  difference: number;
  percentage: number;
  insight: string;
}

export interface SavingsTip {
  category: string;
  currentSpending: number;
  potentialSavings: number;
  tip: string;
  confidence: number;
}

export interface EfficiencyInsight {
  category: string;
  currentTime: number;
  optimizedTime: number;
  timeSaved: number;
  insight: string;
}

export interface SpendingInsights {
  userId: string;
  period: string;
  totalSpent: number;
  categoryBreakdown: Record<string, number>;
  comparisons: SpendingComparison[];
  savingsTips: SavingsTip[];
  efficiencyInsights: EfficiencyInsight[];
  trends: {
    spendingTrend: 'increasing' | 'decreasing' | 'stable';
    trendPercentage: number;
    categoryTrends: Record<string, 'increasing' | 'decreasing' | 'stable'>;
  };
  generatedAt: Date;
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async generateSpendingInsights(
    userId: string,
    request: SpendingInsightsRequest
  ): Promise<SpendingInsights> {
    // Get expense data for the specified period
    const expenses = await this.getExpensesForPeriod(userId, request.period);

    // Calculate basic analytics
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const categoryBreakdown = this.calculateCategoryBreakdown(expenses);

    // Generate comparisons
    const comparisons = await this.generateComparisons(userId, request, categoryBreakdown);

    // Generate savings tips
    const savingsTips = await this.generateSavingsTips(userId, expenses, categoryBreakdown);

    // Generate efficiency insights
    const efficiencyInsights = await this.generateEfficiencyInsights(userId, expenses);

    // Analyze trends
    const trends = await this.analyzeTrends(userId, request.period, categoryBreakdown);

    return {
      userId,
      period: request.period,
      totalSpent,
      categoryBreakdown,
      comparisons,
      savingsTips,
      efficiencyInsights,
      trends,
      generatedAt: new Date(),
    };
  }

  private async getExpensesForPeriod(userId: string, period: string) {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(0); // All time
    }

    return this.prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: now,
        },
      },
      include: {
        itinerary: true,
        budget: true,
      },
    });
  }

  private calculateCategoryBreakdown(expenses: any[]): Record<string, number> {
    return expenses.reduce((acc, expense) => {
      const category = expense.category || 'miscellaneous';
      acc[category] = (acc[category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);
  }

  private async generateComparisons(
    userId: string,
    request: SpendingInsightsRequest,
    userBreakdown: Record<string, number>
  ): Promise<SpendingComparison[]> {
    const comparisons: SpendingComparison[] = [];

    if (request.compareWith === 'previous_period') {
      // Compare with previous period
      const previousPeriodExpenses = await this.getExpensesForPeriod(
        userId,
        this.getPreviousPeriod(request.period)
      );
      const previousBreakdown = this.calculateCategoryBreakdown(previousPeriodExpenses);

      for (const category of Object.keys(userBreakdown)) {
        const userAvg = userBreakdown[category];
        const prevAvg = previousBreakdown[category] || 0;
        const difference = userAvg - prevAvg;
        const percentage = prevAvg > 0 ? (difference / prevAvg) * 100 : 0;

        comparisons.push({
          type: 'personal',
          category,
          userAverage: userAvg,
          comparisonAverage: prevAvg,
          difference,
          percentage,
          insight: this.generateComparisonInsight(category, difference, percentage, 'previous_period'),
        });
      }
    }

    if (request.compareWith === 'similar_users' || request.compareWith === 'city_average') {
      // Get peer data (simplified - in real implementation, would use ML clustering)
      const peerData = await this.getPeerSpendingData(userId, request.compareWith === 'city_average');

      for (const category of Object.keys(userBreakdown)) {
        const userAvg = userBreakdown[category];
        const peerAvg = peerData[category] || userAvg * 0.8; // Simplified peer average
        const difference = userAvg - peerAvg;
        const percentage = peerAvg > 0 ? (difference / peerAvg) * 100 : 0;

        comparisons.push({
          type: request.compareWith === 'city_average' ? 'city' : 'peer',
          category,
          userAverage: userAvg,
          comparisonAverage: peerAvg,
          difference,
          percentage,
          insight: this.generateComparisonInsight(category, difference, percentage, request.compareWith),
        });
      }
    }

    return comparisons;
  }

  private getPreviousPeriod(period: string): string {
    switch (period) {
      case 'week': return 'week';
      case 'month': return 'month';
      case 'year': return 'year';
      default: return 'month';
    }
  }

  private async getPeerSpendingData(userId: string, isCityAverage: boolean): Promise<Record<string, number>> {
    // Simplified peer data - in real implementation, would query similar users
    // For now, return mock data
    return {
      food: 150000,
      transportation: 200000,
      accommodation: 300000,
      'tourism tickets': 100000,
      shopping: 80000,
    };
  }

  private generateComparisonInsight(
    category: string,
    difference: number,
    percentage: number,
    compareType: string
  ): string {
    const isHigher = difference > 0;
    const absPercentage = Math.abs(percentage);

    if (compareType === 'previous_period') {
      if (isHigher) {
        return `You spent ${absPercentage.toFixed(1)}% more on ${category} compared to last period`;
      } else {
        return `You spent ${absPercentage.toFixed(1)}% less on ${category} compared to last period`;
      }
    } else if (compareType === 'similar_users') {
      if (isHigher) {
        return `You spend ${absPercentage.toFixed(1)}% more on ${category} than similar travelers`;
      } else {
        return `You spend ${absPercentage.toFixed(1)}% less on ${category} than similar travelers`;
      }
    } else {
      if (isHigher) {
        return `You spend ${absPercentage.toFixed(1)}% more on ${category} than the city average`;
      } else {
        return `You spend ${absPercentage.toFixed(1)}% less on ${category} than the city average`;
      }
    }
  }

  private async generateSavingsTips(
    userId: string,
    expenses: any[],
    categoryBreakdown: Record<string, number>
  ): Promise<SavingsTip[]> {
    const tips: SavingsTip[] = [];

    // Analyze transportation spending
    if (categoryBreakdown.transportation > 100000) {
      tips.push({
        category: 'transportation',
        currentSpending: categoryBreakdown.transportation,
        potentialSavings: Math.min(categoryBreakdown.transportation * 0.3, 112000),
        tip: 'Switching to bus transport could save up to 112,000 per trip',
        confidence: 0.8,
      });
    }

    // Analyze food spending
    if (categoryBreakdown.food > 200000) {
      tips.push({
        category: 'food',
        currentSpending: categoryBreakdown.food,
        potentialSavings: categoryBreakdown.food * 0.2,
        tip: 'Try local street food instead of restaurants to save 20%',
        confidence: 0.7,
      });
    }

    // Analyze accommodation spending
    if (categoryBreakdown.accommodation > 500000) {
      tips.push({
        category: 'accommodation',
        currentSpending: categoryBreakdown.accommodation,
        potentialSavings: categoryBreakdown.accommodation * 0.15,
        tip: 'Book accommodation in advance for better rates',
        confidence: 0.6,
      });
    }

    return tips;
  }

  private async generateEfficiencyInsights(
    userId: string,
    expenses: any[]
  ): Promise<EfficiencyInsight[]> {
    const insights: EfficiencyInsight[] = [];

    // Analyze transportation efficiency
    const transportExpenses = expenses.filter(e => e.category === 'transportation');
    if (transportExpenses.length > 0) {
      const avgTransportCost = transportExpenses.reduce((sum, e) => sum + e.amount, 0) / transportExpenses.length;

      insights.push({
        category: 'transportation',
        currentTime: 45, // Average time per destination
        optimizedTime: 22, // Optimized time
        timeSaved: 23,
        insight: 'Renting a motorbike saves an average of 22 minutes per destination',
      });
    }

    // Analyze activity efficiency
    const activityExpenses = expenses.filter(e => e.category === 'tourism tickets');
    if (activityExpenses.length > 0) {
      insights.push({
        category: 'activities',
        currentTime: 120, // Average time per activity
        optimizedTime: 90, // Optimized time
        timeSaved: 30,
        insight: 'Pre-booking tickets reduces waiting time by 30 minutes',
      });
    }

    return insights;
  }

  private async analyzeTrends(
    userId: string,
    period: string,
    currentBreakdown: Record<string, number>
  ): Promise<SpendingInsights['trends']> {
    // Get previous period data for trend analysis
    const previousExpenses = await this.getExpensesForPeriod(userId, this.getPreviousPeriod(period));
    const previousBreakdown = this.calculateCategoryBreakdown(previousExpenses);

    const currentTotal = Object.values(currentBreakdown).reduce((sum, val) => sum + val, 0);
    const previousTotal = Object.values(previousBreakdown).reduce((sum, val) => sum + val, 0);

    const trendPercentage = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
    const spendingTrend = trendPercentage > 5 ? 'increasing' : trendPercentage < -5 ? 'decreasing' : 'stable';

    const categoryTrends: Record<string, 'increasing' | 'decreasing' | 'stable'> = {};
    for (const category of Object.keys(currentBreakdown)) {
      const current = currentBreakdown[category];
      const previous = previousBreakdown[category] || 0;
      const catTrend = previous > 0 ? ((current - previous) / previous) * 100 : 0;
      categoryTrends[category] = catTrend > 5 ? 'increasing' : catTrend < -5 ? 'decreasing' : 'stable';
    }

    return {
      spendingTrend,
      trendPercentage,
      categoryTrends,
    };
  }
}