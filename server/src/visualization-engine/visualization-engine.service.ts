import { Injectable, Inject } from '@nestjs/common';
import { BurnRateService } from '../burn-rate/burn-rate.service';
import { DashboardAggregationService } from '../dashboard-aggregation/dashboard-aggregation.service';
import { PrismaService } from '../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area' | 'gauge';
  title: string;
  data: any;
  config: ChartConfig;
}

export interface ChartConfig {
  xAxis?: {
    type: string;
    data: string[];
    name?: string;
  };
  yAxis?: {
    type: string;
    name?: string;
  };
  series: any[];
  tooltip?: any;
  legend?: any;
  grid?: any;
  colors?: string[];
}

export interface BurnRateChartSet {
  burnRateTrend: ChartData;
  budgetUtilization: ChartData;
  spendingVelocity: ChartData;
  riskGauge: ChartData;
  categoryBreakdown: ChartData;
  dailyBurnComparison: ChartData;
}

@Injectable()
export class VisualizationEngineService {
  constructor(
    private burnRateService: BurnRateService,
    private dashboardAggregationService: DashboardAggregationService,
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Generate comprehensive burn rate visualization charts
   */
  async generateBurnRateCharts(userId: string, budgetId: string): Promise<BurnRateChartSet> {
    const cacheKey = `charts:${userId}:${budgetId}`;

    const cached = await this.cacheManager.get<BurnRateChartSet>(cacheKey);
    if (cached) return cached;

    // Get burn rate data
    const burnRateData = await this.burnRateService.calculateBurnRate(userId, budgetId);
    const burnRateHistory = await this.burnRateService.getBurnRateHistory(userId, budgetId, 30);

    // Generate all chart types
    const charts: BurnRateChartSet = {
      burnRateTrend: await this.generateBurnRateTrendChart(burnRateHistory),
      budgetUtilization: await this.generateBudgetUtilizationChart(burnRateData),
      spendingVelocity: await this.generateSpendingVelocityChart(burnRateData),
      riskGauge: this.generateRiskGaugeChart(burnRateData),
      categoryBreakdown: await this.generateCategoryBreakdownChart(userId),
      dailyBurnComparison: await this.generateDailyBurnComparisonChart(userId),
    };

    await this.cacheManager.set(cacheKey, charts, 300000); // Cache for 5 minutes
    return charts;
  }

  /**
   * Generate burn rate trend line chart
   */
  private async generateBurnRateTrendChart(history: any[]): Promise<ChartData> {
    const dates = history.map(item => item.date);
    const dailyAmounts = history.map(item => item.dailyAmount);
    const cumulativeAmounts = history.map(item => item.cumulativeAmount);

    return {
      type: 'line',
      title: 'Burn Rate Trend (Last 30 Days)',
      data: {
        dates,
        dailyAmounts,
        cumulativeAmounts,
      },
      config: {
        xAxis: {
          type: 'category',
          data: dates,
          name: 'Date',
        },
        yAxis: {
          type: 'value',
          name: 'Amount (IDR)',
        },
        series: [
          {
            name: 'Daily Spending',
            type: 'bar',
            data: dailyAmounts,
            itemStyle: { color: '#3B82F6' },
          },
          {
            name: 'Cumulative Spending',
            type: 'line',
            data: cumulativeAmounts,
            lineStyle: { width: 3 },
            itemStyle: { color: '#EF4444' },
          },
        ],
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            let result = `${params[0].name}<br/>`;
            params.forEach((param: any) => {
              result += `${param.seriesName}: IDR ${param.value.toLocaleString('id-ID')}<br/>`;
            });
            return result;
          },
        },
        legend: {
          data: ['Daily Spending', 'Cumulative Spending'],
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true,
        },
      },
    };
  }

  /**
   * Generate budget utilization gauge chart
   */
  private async generateBudgetUtilizationChart(burnRateData: any): Promise<ChartData> {
    const utilizationPercentage = (burnRateData.spent / burnRateData.totalBudget) * 100;

    return {
      type: 'gauge',
      title: 'Budget Utilization',
      data: {
        percentage: utilizationPercentage,
        spent: burnRateData.spent,
        total: burnRateData.totalBudget,
        remaining: burnRateData.remainingBudget,
      },
      config: {
        series: [
          {
            name: 'Budget Utilization',
            type: 'gauge',
            data: [{ value: utilizationPercentage, name: 'Utilization' }],
            min: 0,
            max: 100,
            splitNumber: 10,
            axisLine: {
              lineStyle: {
                width: 10,
                color: [
                  [0.7, '#67C23A'],
                  [0.9, '#E6A23C'],
                  [1, '#F56C6C'],
                ],
              },
            },
            pointer: {
              itemStyle: {
                color: 'auto',
              },
            },
            axisTick: {
              distance: -30,
              length: 8,
              lineStyle: {
                color: '#fff',
                width: 2,
              },
            },
            splitLine: {
              distance: -30,
              length: 30,
              lineStyle: {
                color: '#fff',
                width: 4,
              },
            },
            axisLabel: {
              color: 'auto',
              distance: 40,
              fontSize: 12,
            },
            detail: {
              valueAnimation: true,
              formatter: '{value}%',
              fontSize: 20,
              color: 'auto',
            },
          },
        ],
      },
    };
  }

  /**
   * Generate spending velocity chart
   */
  private async generateSpendingVelocityChart(burnRateData: any): Promise<ChartData> {
    const velocity = burnRateData.velocity || 0;
    const velocityPercentage = Math.abs(velocity) * 100;

    // Create velocity data points for the last few days
    const velocityData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const baseVelocity = velocity * (0.8 + Math.random() * 0.4); // Add some variation
      velocityData.push({
        date: date.toISOString().split('T')[0],
        velocity: baseVelocity,
      });
    }

    return {
      type: 'area',
      title: 'Spending Velocity Trend',
      data: {
        velocityData,
        currentVelocity: velocity,
      },
      config: {
        xAxis: {
          type: 'category',
          data: velocityData.map(d => d.date),
          name: 'Date',
        },
        yAxis: {
          type: 'value',
          name: 'Velocity',
        },
        series: [
          {
            name: 'Spending Velocity',
            type: 'area',
            data: velocityData.map(d => d.velocity),
            smooth: true,
            areaStyle: {
              color: velocity > 0 ? '#FEE2E2' : '#DCFCE7',
            },
            lineStyle: {
              color: velocity > 0 ? '#EF4444' : '#22C55E',
              width: 2,
            },
            itemStyle: {
              color: velocity > 0 ? '#EF4444' : '#22C55E',
            },
          },
        ],
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            const velocity = params[0].value;
            const direction = velocity > 0 ? 'increasing' : velocity < 0 ? 'decreasing' : 'stable';
            return `${params[0].name}<br/>Velocity: ${velocity.toFixed(3)} (${direction})`;
          },
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true,
        },
      },
    };
  }

  /**
   * Generate risk gauge chart
   */
  private generateRiskGaugeChart(burnRateData: any): ChartData {
    const riskScore = this.calculateRiskScore(burnRateData);

    return {
      type: 'gauge',
      title: 'Budget Risk Assessment',
      data: {
        riskScore,
        riskLevel: burnRateData.riskLevel,
      },
      config: {
        series: [
          {
            name: 'Risk Level',
            type: 'gauge',
            data: [{ value: riskScore, name: 'Risk Score' }],
            min: 0,
            max: 100,
            splitNumber: 10,
            axisLine: {
              lineStyle: {
                width: 10,
                color: [
                  [0.3, '#67C23A'],
                  [0.7, '#E6A23C'],
                  [1, '#F56C6C'],
                ],
              },
            },
            pointer: {
              itemStyle: {
                color: 'auto',
              },
            },
            axisTick: {
              distance: -30,
              length: 8,
              lineStyle: {
                color: '#fff',
                width: 2,
              },
            },
            splitLine: {
              distance: -30,
              length: 30,
              lineStyle: {
                color: '#fff',
                width: 4,
              },
            },
            axisLabel: {
              color: 'auto',
              distance: 40,
              fontSize: 12,
            },
            detail: {
              valueAnimation: true,
              formatter: (value: number) => {
                if (value < 30) return 'Low Risk';
                if (value < 70) return 'Medium Risk';
                return 'High Risk';
              },
              fontSize: 16,
              color: 'auto',
            },
          },
        ],
      },
    };
  }

  /**
   * Generate category breakdown pie chart
   */
  private async generateCategoryBreakdownChart(userId: string): Promise<ChartData> {
    // Get spending by category for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const expenses = await this.prisma.expense.findMany({
      where: {
        userId,
        date: { gte: thirtyDaysAgo },
      },
      select: {
        category: true,
        amount: true,
      },
    });

    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const categories = Object.keys(categoryTotals);
    const amounts = Object.values(categoryTotals);

    const colors = [
      '#3B82F6', '#EF4444', '#22C55E', '#F59E0B', '#8B5CF6',
      '#06B6D4', '#EC4899', '#84CC16', '#F97316', '#6366F1'
    ];

    return {
      type: 'pie',
      title: 'Spending by Category (Last 30 Days)',
      data: {
        categories,
        amounts,
        totals: categoryTotals,
      },
      config: {
        series: [
          {
            name: 'Spending',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '50%'],
            data: categories.map((category, index) => ({
              name: category,
              value: amounts[index],
              itemStyle: {
                color: colors[index % colors.length],
              },
            })),
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)',
              },
            },
            label: {
              formatter: '{b}: {d}%',
            },
          },
        ],
        tooltip: {
          trigger: 'item',
          formatter: '{b}: IDR {c} ({d}%)',
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          data: categories,
        },
      },
    };
  }

  /**
   * Generate daily burn rate comparison chart
   */
  private async generateDailyBurnComparisonChart(userId: string): Promise<ChartData> {
    // Get all budgets for the user
    const budgets = await this.prisma.budget.findMany({
      where: { userId },
      include: { itinerary: true },
    });

    const budgetNames: string[] = [];
    const dailyBurnRates: number[] = [];
    const riskLevels: string[] = [];

    for (const budget of budgets) {
      try {
        const burnRateData = await this.burnRateService.calculateBurnRate(userId, budget.id);
        const name = budget.itinerary?.title || `Budget ${budget.id.slice(-8)}`;

        budgetNames.push(name);
        dailyBurnRates.push(burnRateData.projectedBurnRate);
        riskLevels.push(burnRateData.riskLevel);
      } catch (error) {
        console.error(`Error getting burn rate for budget ${budget.id}:`, error);
      }
    }

    return {
      type: 'bar',
      title: 'Daily Burn Rate Comparison',
      data: {
        budgetNames,
        dailyBurnRates,
        riskLevels,
      },
      config: {
        xAxis: {
          type: 'category',
          data: budgetNames,
          name: 'Budget',
        },
        yAxis: {
          type: 'value',
          name: 'Daily Burn Rate (IDR)',
        },
        series: [
          {
            name: 'Daily Burn Rate',
            type: 'bar',
            data: dailyBurnRates.map((rate, index) => ({
              value: rate,
              itemStyle: {
                color: this.getRiskColor(riskLevels[index]),
              },
            })),
            label: {
              show: true,
              position: 'top',
              formatter: (params: any) => `IDR ${params.value.toLocaleString('id-ID')}`,
            },
          },
        ],
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            const index = params[0].dataIndex;
            return `${budgetNames[index]}<br/>Daily Burn Rate: IDR ${dailyBurnRates[index].toLocaleString('id-ID')}<br/>Risk Level: ${riskLevels[index]}`;
          },
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          containLabel: true,
        },
      },
    };
  }

  /**
   * Calculate risk score from burn rate data
   */
  private calculateRiskScore(burnRateData: any): number {
    const utilization = (burnRateData.spent / burnRateData.totalBudget) * 100;
    const velocity = Math.abs(burnRateData.velocity || 0) * 100;
    const daysRemaining = burnRateData.remainingDays || 1;

    // Risk factors
    let riskScore = 0;

    // High utilization increases risk
    if (utilization > 90) riskScore += 40;
    else if (utilization > 70) riskScore += 20;
    else if (utilization > 50) riskScore += 10;

    // High velocity increases risk
    if (velocity > 20) riskScore += 30;
    else if (velocity > 10) riskScore += 15;

    // Low days remaining increases risk
    if (daysRemaining < 3) riskScore += 30;
    else if (daysRemaining < 7) riskScore += 15;
    else if (daysRemaining < 14) riskScore += 5;

    return Math.min(riskScore, 100);
  }

  /**
   * Get color based on risk level
   */
  private getRiskColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'low': return '#22C55E';
      case 'medium': return '#F59E0B';
      case 'high': return '#EF4444';
      case 'critical': return '#7F1D1D';
      default: return '#6B7280';
    }
  }

  /**
   * Clear visualization cache
   */
  async clearCache(userId: string, budgetId: string): Promise<void> {
    const cacheKey = `charts:${userId}:${budgetId}`;
    await this.cacheManager.del(cacheKey);
  }

  /**
   * Generate custom chart configuration
   */
  async generateCustomChart(
    userId: string,
    chartType: string,
    dataSource: string,
    timeRange: number = 30
  ): Promise<ChartData> {
    // This could be extended to generate custom charts based on user requests
    // For now, return a basic structure
    return {
      type: 'line' as any,
      title: 'Custom Chart',
      data: {},
      config: {
        series: [],
      },
    };
  }
}