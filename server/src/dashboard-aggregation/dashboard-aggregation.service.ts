import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BurnRateService } from '../burn-rate/burn-rate.service';
import { ExpensesService } from '../expenses/expenses.service';
import { BudgetService } from '../budget/budget.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export interface DashboardData {
  userId: string;
  budgets: BudgetSummary[];
  burnRateOverview: BurnRateOverview;
  spendingInsights: SpendingInsights;
  alerts: Alert[];
  recommendations: string[];
  lastUpdated: Date;
}

export interface BudgetSummary {
  id: string;
  name: string;
  totalBudget: number;
  spent: number;
  remaining: number;
  utilizationPercentage: number;
  burnRate: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  daysRemaining: number;
  projectedEndDate: Date;
}

export interface BurnRateOverview {
  averageDailyBurn: number;
  totalActiveBudgets: number;
  highRiskBudgets: number;
  criticalRiskBudgets: number;
  totalSpentToday: number;
  totalSpentThisWeek: number;
  totalSpentThisMonth: number;
  spendingTrend: 'increasing' | 'decreasing' | 'stable';
}

export interface SpendingInsights {
  topCategories: CategorySpending[];
  recentTransactions: RecentTransaction[];
  unusualSpending: UnusualSpending[];
  savingsOpportunities: SavingsOpportunity[];
}

export interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface RecentTransaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  merchant?: string;
}

export interface UnusualSpending {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  anomalyScore: number;
  reason: string;
}

export interface SavingsOpportunity {
  category: string;
  potentialSavings: number;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

export interface Alert {
  id: string;
  type: 'budget_warning' | 'budget_critical' | 'burn_rate_high' | 'unusual_spending';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
}

@Injectable()
export class DashboardAggregationService {
  constructor(
    private prisma: PrismaService,
    private burnRateService: BurnRateService,
    @Inject(forwardRef(() => ExpensesService))
    private expensesService: ExpensesService,
    private budgetService: BudgetService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Aggregate comprehensive dashboard data for a user
   */
  async getDashboardData(userId: string): Promise<DashboardData> {
    const cacheKey = `dashboard:${userId}`;

    // Check cache first
    const cached = await this.cacheManager.get<DashboardData>(cacheKey);
    if (cached) {
      return cached;
    }

    // Aggregate data from multiple sources
    const [budgets, burnRateOverview, spendingInsights, alerts] = await Promise.all([
      this.getBudgetSummaries(userId),
      this.getBurnRateOverview(userId),
      this.getSpendingInsights(userId),
      this.getActiveAlerts(userId),
    ]);

    // Generate recommendations based on aggregated data
    const recommendations = this.generateRecommendations(budgets, burnRateOverview, spendingInsights);

    const dashboardData: DashboardData = {
      userId,
      budgets,
      burnRateOverview,
      spendingInsights,
      alerts,
      recommendations,
      lastUpdated: new Date(),
    };

    // Cache for 2 minutes
    await this.cacheManager.set(cacheKey, dashboardData, 120000);

    return dashboardData;
  }

  /**
   * Get summarized data for all user budgets
   */
  private async getBudgetSummaries(userId: string): Promise<BudgetSummary[]> {
    const budgets = await this.prisma.budget.findMany({
      where: { userId },
      include: {
        itinerary: true,
        expenses: {
          orderBy: { date: 'desc' },
          take: 50, // Limit for performance
        },
      },
    });

    const budgetSummaries: BudgetSummary[] = [];

    for (const budget of budgets) {
      try {
        // Get burn rate data for this budget
        const burnRateData = await this.burnRateService.calculateBurnRate(userId, budget.id);

        const summary: BudgetSummary = {
          id: budget.id,
          name: budget.itinerary?.title || `Budget ${budget.id.slice(-8)}`,
          totalBudget: budget.totalBudget,
          spent: budget.spent,
          remaining: budget.totalBudget - budget.spent,
          utilizationPercentage: (budget.spent / budget.totalBudget) * 100,
          burnRate: burnRateData.projectedBurnRate,
          riskLevel: burnRateData.riskLevel,
          daysRemaining: burnRateData.remainingDays,
          projectedEndDate: burnRateData.projectedEndDate,
        };

        budgetSummaries.push(summary);
      } catch (error) {
        console.error(`Error calculating burn rate for budget ${budget.id}:`, error);
        // Fallback summary without burn rate data
        const summary: BudgetSummary = {
          id: budget.id,
          name: budget.itinerary?.title || `Budget ${budget.id.slice(-8)}`,
          totalBudget: budget.totalBudget,
          spent: budget.spent,
          remaining: budget.totalBudget - budget.spent,
          utilizationPercentage: (budget.spent / budget.totalBudget) * 100,
          burnRate: 0,
          riskLevel: 'low',
          daysRemaining: 0,
          projectedEndDate: new Date(),
        };
        budgetSummaries.push(summary);
      }
    }

    return budgetSummaries;
  }

  /**
   * Get overview of burn rates across all budgets
   */
  private async getBurnRateOverview(userId: string): Promise<BurnRateOverview> {
    const budgets = await this.prisma.budget.findMany({
      where: { userId },
      select: { id: true },
    });

    let totalActiveBudgets = budgets.length;
    let highRiskBudgets = 0;
    let criticalRiskBudgets = 0;
    let totalAverageBurn = 0;
    let validBurnRates = 0;

    // Calculate spending for different periods
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    const monthAgo = new Date(now);
    monthAgo.setMonth(now.getMonth() - 1);

    const [todayExpenses, weekExpenses, monthExpenses] = await Promise.all([
      this.prisma.expense.findMany({
        where: { userId, date: { gte: today, lt: tomorrow } },
        select: { amount: true },
      }),
      this.prisma.expense.findMany({
        where: { userId, date: { gte: weekAgo } },
        select: { amount: true, date: true },
      }),
      this.prisma.expense.findMany({
        where: { userId, date: { gte: monthAgo } },
        select: { amount: true },
      }),
    ]);

    const totalSpentToday = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalSpentThisWeek = weekExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalSpentThisMonth = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Analyze burn rates for each budget
    for (const budget of budgets) {
      try {
        const burnRateData = await this.burnRateService.calculateBurnRate(userId, budget.id);
        totalAverageBurn += burnRateData.projectedBurnRate;
        validBurnRates++;

        if (burnRateData.riskLevel === 'high') highRiskBudgets++;
        if (burnRateData.riskLevel === 'critical') criticalRiskBudgets++;
      } catch (error) {
        console.error(`Error getting burn rate for budget ${budget.id}:`, error);
      }
    }

    const averageDailyBurn = validBurnRates > 0 ? totalAverageBurn / validBurnRates : 0;

    // Determine spending trend
    const recentDailyAmounts = weekExpenses
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(exp => exp.amount);

    const spendingTrend = this.calculateTrend(recentDailyAmounts);

    return {
      averageDailyBurn,
      totalActiveBudgets,
      highRiskBudgets,
      criticalRiskBudgets,
      totalSpentToday,
      totalSpentThisWeek,
      totalSpentThisMonth,
      spendingTrend,
    };
  }

  /**
   * Get spending insights and analytics
   */
  private async getSpendingInsights(userId: string): Promise<SpendingInsights> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get expenses for analysis
    const expenses = await this.prisma.expense.findMany({
      where: {
        userId,
        date: { gte: thirtyDaysAgo },
      },
      orderBy: { date: 'desc' },
      take: 100, // Limit for performance
    });

    // Calculate top categories
    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const totalSpending = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

    const topCategories: CategorySpending[] = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalSpending) * 100,
        trend: 'stable' as const, // Could be calculated with more historical data
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Recent transactions
    const recentTransactions: RecentTransaction[] = expenses
      .slice(0, 10)
      .map(expense => ({
        id: expense.id,
        amount: expense.amount,
        category: expense.category,
        description: expense.description || 'No description',
        date: expense.date,
        merchant: expense.merchant || undefined,
      }));

    // Detect unusual spending (simplified - could use ML anomaly detection)
    const unusualSpending: UnusualSpending[] = expenses
      .filter(expense => expense.amount > 100000) // Simple threshold for unusual spending
      .slice(0, 5)
      .map(expense => ({
        id: expense.id,
        amount: expense.amount,
        category: expense.category,
        description: expense.description || 'No description',
        date: expense.date,
        anomalyScore: 0.8, // Placeholder
        reason: 'Amount exceeds typical spending threshold',
      }));

    // Generate savings opportunities (simplified logic)
    const savingsOpportunities: SavingsOpportunity[] = [];

    // Check for high food spending
    const foodSpending = categoryTotals['food'] || 0;
    if (foodSpending > 500000) { // Over 500k on food
      savingsOpportunities.push({
        category: 'food',
        potentialSavings: foodSpending * 0.1, // 10% savings potential
        description: 'Consider meal planning and cooking at accommodation to reduce food costs',
        impact: 'high',
      });
    }

    // Check for high transportation spending
    const transportSpending = categoryTotals['transportation'] || 0;
    if (transportSpending > 300000) { // Over 300k on transport
      savingsOpportunities.push({
        category: 'transportation',
        potentialSavings: transportSpending * 0.15, // 15% savings potential
        description: 'Use public transportation or walk for short distances',
        impact: 'medium',
      });
    }

    return {
      topCategories,
      recentTransactions,
      unusualSpending,
      savingsOpportunities,
    };
  }

  /**
   * Get active alerts for the user
   */
  private async getActiveAlerts(userId: string): Promise<Alert[]> {
    const recentNotifications = await this.prisma.notification.findMany({
      where: {
        userId,
        type: {
          in: ['budget_warning', 'budget_critical', 'daily_budget_warning', 'daily_budget_critical'],
        },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return recentNotifications.map(notification => ({
      id: notification.id,
      type: notification.type as any,
      title: notification.title,
      message: notification.message,
      severity: this.mapNotificationTypeToSeverity(notification.type),
      createdAt: notification.createdAt,
    }));
  }

  /**
   * Generate personalized recommendations based on aggregated data
   */
  private generateRecommendations(
    budgets: BudgetSummary[],
    burnRateOverview: BurnRateOverview,
    spendingInsights: SpendingInsights
  ): string[] {
    const recommendations: string[] = [];

    // Budget risk recommendations
    const criticalBudgets = budgets.filter(b => b.riskLevel === 'critical');
    if (criticalBudgets.length > 0) {
      recommendations.push(`🚨 ${criticalBudgets.length} budget(s) are at critical risk. Immediate action required.`);
    }

    const highRiskBudgets = budgets.filter(b => b.riskLevel === 'high');
    if (highRiskBudgets.length > 0) {
      recommendations.push(`⚠️ ${highRiskBudgets.length} budget(s) need attention. Review spending patterns.`);
    }

    // Spending trend recommendations
    if (burnRateOverview.spendingTrend === 'increasing') {
      recommendations.push('📈 Your spending is increasing. Consider setting stricter daily limits.');
    }

    // Savings opportunities
    if (spendingInsights.savingsOpportunities.length > 0) {
      const highImpactSavings = spendingInsights.savingsOpportunities.filter(s => s.impact === 'high');
      if (highImpactSavings.length > 0) {
        recommendations.push(`💰 High savings potential identified in ${highImpactSavings[0].category}.`);
      }
    }

    // Daily spending recommendations
    if (burnRateOverview.totalSpentToday > burnRateOverview.averageDailyBurn * 1.5) {
      recommendations.push('💸 Today\'s spending is above average. Monitor remaining budget carefully.');
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('✅ Your budgets are on track. Keep up the good work!');
      recommendations.push('💡 Track expenses daily for better budget control.');
    }

    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }

  /**
   * Calculate spending trend
   */
  private calculateTrend(amounts: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (amounts.length < 3) return 'stable';

    const recent = amounts.slice(-7).reduce((sum, amt) => sum + amt, 0) / Math.min(7, amounts.length);
    const earlier = amounts.slice(-14, -7);

    if (earlier.length === 0) return 'stable';

    const earlierAvg = earlier.reduce((sum, amt) => sum + amt, 0) / earlier.length;
    const change = (recent - earlierAvg) / earlierAvg;

    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  /**
   * Map notification type to severity level
   */
  private mapNotificationTypeToSeverity(type: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (type) {
      case 'budget_critical':
      case 'daily_budget_critical':
        return 'critical';
      case 'budget_warning':
      case 'daily_budget_warning':
        return 'high';
      default:
        return 'medium';
    }
  }

  /**
   * Clear dashboard cache for a user
   */
  async clearCache(userId: string): Promise<void> {
    const cacheKey = `dashboard:${userId}`;
    await this.cacheManager.del(cacheKey);
  }

  /**
   * Get real-time dashboard updates (for WebSocket integration)
   */
  async getRealtimeUpdate(userId: string, budgetId?: string): Promise<Partial<DashboardData>> {
    if (budgetId) {
      // Update specific budget data
      const budgets = await this.getBudgetSummaries(userId);
      const burnRateOverview = await this.getBurnRateOverview(userId);

      return {
        budgets,
        burnRateOverview,
        lastUpdated: new Date(),
      };
    } else {
      // Full update
      return this.getDashboardData(userId);
    }
  }
}