import { Injectable } from '@nestjs/common';
import { AnalyticsService, SpendingInsights } from './analytics.service';
import { mlEngine } from '../../../lib/ml/ml-engine';

export interface PersonalizedInsight {
  id: string;
  type: 'comparison' | 'savings' | 'efficiency' | 'trend' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  data: any;
  generatedAt: Date;
}

@Injectable()
export class InsightGenerationService {
  constructor(private analyticsService: AnalyticsService) {}

  async generatePersonalizedInsights(
    userId: string,
    insights: SpendingInsights
  ): Promise<PersonalizedInsight[]> {
    const personalizedInsights: PersonalizedInsight[] = [];

    // Generate comparison insights
    const comparisonInsights = this.generateComparisonInsights(insights);
    personalizedInsights.push(...comparisonInsights);

    // Generate savings insights
    const savingsInsights = this.generateSavingsInsights(insights);
    personalizedInsights.push(...savingsInsights);

    // Generate efficiency insights
    const efficiencyInsights = this.generateEfficiencyInsights(insights);
    personalizedInsights.push(...efficiencyInsights);

    // Generate trend insights
    const trendInsights = this.generateTrendInsights(insights);
    personalizedInsights.push(...trendInsights);

    // Generate ML-powered recommendations
    const mlInsights = await this.generateMLInsights(userId, insights);
    personalizedInsights.push(...mlInsights);

    return personalizedInsights.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  }

  private generateComparisonInsights(insights: SpendingInsights): PersonalizedInsight[] {
    return insights.comparisons.map((comparison, index) => {
      let title = '';
      let description = '';
      let impact: 'high' | 'medium' | 'low' = 'medium';

      if (comparison.type === 'personal') {
        if (Math.abs(comparison.percentage) > 20) {
          impact = 'high';
          title = `Significant ${comparison.category} spending change`;
          description = comparison.insight;
        } else {
          title = `${comparison.category} spending comparison`;
          description = comparison.insight;
        }
      } else {
        if (Math.abs(comparison.percentage) > 30) {
          impact = 'high';
          title = `You spend ${Math.abs(comparison.percentage).toFixed(0)}% ${comparison.difference > 0 ? 'more' : 'less'} on ${comparison.category}`;
          description = comparison.insight;
        } else {
          title = `${comparison.category} spending vs ${comparison.type === 'city' ? 'city average' : 'similar travelers'}`;
          description = comparison.insight;
        }
      }

      return {
        id: `comparison-${index}`,
        type: 'comparison',
        title,
        description,
        impact,
        actionable: false,
        data: comparison,
        generatedAt: new Date(),
      };
    });
  }

  private generateSavingsInsights(insights: SpendingInsights): PersonalizedInsight[] {
    return insights.savingsTips.map((tip, index) => {
      const savingsPercentage = (tip.potentialSavings / tip.currentSpending) * 100;
      let impact: 'high' | 'medium' | 'low' = 'medium';

      if (savingsPercentage > 15) {
        impact = 'high';
      } else if (savingsPercentage > 5) {
        impact = 'medium';
      } else {
        impact = 'low';
      }

      return {
        id: `savings-${index}`,
        type: 'savings',
        title: `Save up to IDR ${tip.potentialSavings.toLocaleString()} on ${tip.category}`,
        description: tip.tip,
        impact,
        actionable: true,
        data: tip,
        generatedAt: new Date(),
      };
    });
  }

  private generateEfficiencyInsights(insights: SpendingInsights): PersonalizedInsight[] {
    return insights.efficiencyInsights.map((insight, index) => ({
      id: `efficiency-${index}`,
      type: 'efficiency',
      title: `Save ${insight.timeSaved} minutes on ${insight.category}`,
      description: insight.insight,
      impact: insight.timeSaved > 20 ? 'high' : 'medium',
      actionable: true,
      data: insight,
      generatedAt: new Date(),
    }));
  }

  private generateTrendInsights(insights: SpendingInsights): PersonalizedInsight[] {
    const trendInsights: PersonalizedInsight[] = [];

    // Overall spending trend
    if (Math.abs(insights.trends.trendPercentage) > 10) {
      trendInsights.push({
        id: 'trend-overall',
        type: 'trend',
        title: `Spending ${insights.trends.spendingTrend} by ${Math.abs(insights.trends.trendPercentage).toFixed(1)}%`,
        description: `Your overall spending is ${insights.trends.spendingTrend} compared to the previous period`,
        impact: Math.abs(insights.trends.trendPercentage) > 20 ? 'high' : 'medium',
        actionable: true,
        data: {
          trend: insights.trends.spendingTrend,
          percentage: insights.trends.trendPercentage,
        },
        generatedAt: new Date(),
      });
    }

    // Category-specific trends
    Object.entries(insights.trends.categoryTrends).forEach(([category, trend], index) => {
      if (trend !== 'stable') {
        trendInsights.push({
          id: `trend-${category}-${index}`,
          type: 'trend',
          title: `${category} spending is ${trend}`,
          description: `Your ${category} expenses are ${trend} compared to the previous period`,
          impact: 'medium',
          actionable: true,
          data: { category, trend },
          generatedAt: new Date(),
        });
      }
    });

    return trendInsights;
  }

  private async generateMLInsights(userId: string, insights: SpendingInsights): Promise<PersonalizedInsight[]> {
    const mlInsights: PersonalizedInsight[] = [];

    try {
      // Get user profile from ML engine
      const userProfile = mlEngine.getUserProfile(userId);

      if (userProfile) {
        // Price sensitivity insights
        if (userProfile.mlInsights.priceSensitivity > 0.7) {
          mlInsights.push({
            id: 'ml-price-sensitive',
            type: 'recommendation',
            title: 'You are price-sensitive - great savings opportunities!',
            description: 'Based on your behavior, you respond well to discounts and deals. Look for promotional offers.',
            impact: 'high',
            actionable: true,
            data: { priceSensitivity: userProfile.mlInsights.priceSensitivity },
            generatedAt: new Date(),
          });
        }

        // Activity preference insights
        if (userProfile.mlInsights.activityPreference > 0.7) {
          mlInsights.push({
            id: 'ml-activity-preference',
            type: 'recommendation',
            title: 'You prefer active experiences',
            description: 'Consider adventure activities and outdoor experiences for maximum satisfaction.',
            impact: 'medium',
            actionable: true,
            data: { activityPreference: userProfile.mlInsights.activityPreference },
            generatedAt: new Date(),
          });
        }

        // Spontaneity insights
        if (userProfile.mlInsights.spontaneityScore > 0.7) {
          mlInsights.push({
            id: 'ml-spontaneity',
            type: 'recommendation',
            title: 'You enjoy spontaneous travel',
            description: 'Last-minute bookings and flexible itineraries suit your travel style.',
            impact: 'medium',
            actionable: true,
            data: { spontaneityScore: userProfile.mlInsights.spontaneityScore },
            generatedAt: new Date(),
          });
        }
      }

      // Generate spending pattern recommendations
      const highSpendingCategories = Object.entries(insights.categoryBreakdown)
        .filter(([_, amount]) => amount > insights.totalSpent * 0.3)
        .map(([category]) => category);

      if (highSpendingCategories.length > 0) {
        mlInsights.push({
          id: 'ml-spending-pattern',
          type: 'recommendation',
          title: 'Optimize your spending patterns',
          description: `You're spending heavily on ${highSpendingCategories.join(', ')}. Consider balancing your budget across categories.`,
          impact: 'high',
          actionable: true,
          data: { highSpendingCategories },
          generatedAt: new Date(),
        });
      }

    } catch (error) {
      console.error('Error generating ML insights:', error);
    }

    return mlInsights;
  }
}