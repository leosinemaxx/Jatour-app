import { useState, useEffect } from 'react';

interface SpendingInsights {
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

interface SpendingComparison {
  type: 'personal' | 'peer' | 'city';
  category: string;
  userAverage: number;
  comparisonAverage: number;
  difference: number;
  percentage: number;
  insight: string;
}

interface SavingsTip {
  category: string;
  currentSpending: number;
  potentialSavings: number;
  tip: string;
  confidence: number;
}

interface EfficiencyInsight {
  category: string;
  currentTime: number;
  optimizedTime: number;
  timeSaved: number;
  insight: string;
}

interface PredictiveInsight {
  type: 'budget' | 'behavior' | 'opportunity';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  timeHorizon: 'immediate' | 'short_term' | 'long_term';
  recommendation: string;
}

interface PersonalizationProfile {
  spendingPersonality: 'budget_conscious' | 'value_seeker' | 'premium_experience' | 'spontaneous';
  preferredCategories: string[];
  riskTolerance: 'low' | 'medium' | 'high';
  planningStyle: 'detailed' | 'flexible' | 'minimal';
  socialPreferences: 'solo' | 'couple' | 'family' | 'group';
  activityLevel: 'low' | 'medium' | 'high';
}

export function useAdvancedAnalytics(userId: string, currentBudget: number) {
  const [insights, setInsights] = useState<SpendingInsights | null>(null);
  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsight[]>([]);
  const [personalizationProfile, setPersonalizationProfile] = useState<PersonalizationProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSpendingInsights = async (
    period: 'week' | 'month' | 'year' = 'month',
    compareWith?: 'previous_period' | 'similar_users' | 'city_average'
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analytics/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          period,
          categories: ['food', 'transportation', 'accommodation', 'activities'],
          compareWith
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate insights');
      }

      const data: SpendingInsights = await response.json();
      setInsights(data);

      // Generate predictive insights based on the data
      const predictions = generatePredictiveInsights(data, currentBudget);
      setPredictiveInsights(predictions);

      // Update personalization profile
      const profile = generatePersonalizationProfile(data);
      setPersonalizationProfile(profile);

    } catch (err) {
      console.error('Failed to generate spending insights:', err);
      setError('Failed to generate analytics insights');
    } finally {
      setLoading(false);
    }
  };

  const generatePredictiveInsights = (insights: SpendingInsights, budget: number): PredictiveInsight[] => {
    const predictions: PredictiveInsight[] = [];

    // Budget overrun prediction
    const totalSpent = insights.totalSpent;
    const budgetUtilization = (totalSpent / budget) * 100;

    if (budgetUtilization > 80) {
      predictions.push({
        type: 'budget',
        title: 'Potential Budget Overrun',
        description: `Current spending is at ${budgetUtilization.toFixed(1)}% of budget. At current velocity, you may exceed budget in ${Math.ceil((budget - totalSpent) / (totalSpent / 30))} days.`,
        confidence: Math.min(budgetUtilization / 100, 0.95),
        impact: budgetUtilization > 95 ? 'high' : 'medium',
        timeHorizon: 'immediate',
        recommendation: 'Consider implementing spending controls or adjusting daily limits.'
      });
    }

    // Spending trend analysis
    if (insights.trends.spendingTrend === 'increasing' && insights.trends.trendPercentage > 10) {
      predictions.push({
        type: 'behavior',
        title: 'Accelerating Spending Trend',
        description: `Your spending has increased by ${insights.trends.trendPercentage.toFixed(1)}% compared to last period.`,
        confidence: 0.8,
        impact: 'medium',
        timeHorizon: 'short_term',
        recommendation: 'Review recent expenses and identify areas for cost optimization.'
      });
    }

    // Savings opportunities
    insights.savingsTips.forEach(tip => {
      if (tip.confidence > 0.7) {
        predictions.push({
          type: 'opportunity',
          title: `Savings Opportunity in ${tip.category}`,
          description: tip.tip,
          confidence: tip.confidence,
          impact: tip.potentialSavings > 100000 ? 'high' : 'medium',
          timeHorizon: 'short_term',
          recommendation: `Potential savings: IDR ${tip.potentialSavings.toLocaleString()}`
        });
      }
    });

    // Efficiency improvements
    insights.efficiencyInsights.forEach(insight => {
      if (insight.timeSaved > 15) {
        predictions.push({
          type: 'opportunity',
          title: `Time Efficiency in ${insight.category}`,
          description: insight.insight,
          confidence: 0.75,
          impact: 'medium',
          timeHorizon: 'immediate',
          recommendation: `Save ${insight.timeSaved} minutes per activity.`
        });
      }
    });

    return predictions;
  };

  const generatePersonalizationProfile = (insights: SpendingInsights): PersonalizationProfile => {
    // Analyze spending patterns to determine personality
    const categoryBreakdown = insights.categoryBreakdown;
    const totalSpent = insights.totalSpent;

    // Calculate spending distribution
    const foodRatio = (categoryBreakdown.food || 0) / totalSpent;
    const transportRatio = (categoryBreakdown.transportation || 0) / totalSpent;
    const accommodationRatio = (categoryBreakdown.accommodation || 0) / totalSpent;
    const activitiesRatio = (categoryBreakdown.activities || 0) / totalSpent;

    // Determine spending personality
    let spendingPersonality: PersonalizationProfile['spendingPersonality'];
    if (accommodationRatio > 0.4 || activitiesRatio > 0.3) {
      spendingPersonality = 'premium_experience';
    } else if (foodRatio > 0.3 || transportRatio > 0.25) {
      spendingPersonality = 'value_seeker';
    } else if (totalSpent < currentBudget * 0.6) {
      spendingPersonality = 'budget_conscious';
    } else {
      spendingPersonality = 'spontaneous';
    }

    // Determine preferred categories
    const preferredCategories = Object.entries(categoryBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);

    // Determine risk tolerance based on spending patterns
    const riskTolerance: PersonalizationProfile['riskTolerance'] =
      insights.trends.spendingTrend === 'increasing' && insights.trends.trendPercentage > 15 ? 'high' :
      insights.trends.spendingTrend === 'stable' ? 'medium' : 'low';

    // Determine planning style based on spending consistency
    const planningStyle: PersonalizationProfile['planningStyle'] =
      Math.abs(insights.trends.trendPercentage) < 5 ? 'detailed' :
      Math.abs(insights.trends.trendPercentage) < 15 ? 'flexible' : 'minimal';

    // Social preferences (simplified - would need more data)
    const socialPreferences: PersonalizationProfile['socialPreferences'] = 'couple'; // Default

    // Activity level based on activities spending
    const activityLevel: PersonalizationProfile['activityLevel'] =
      activitiesRatio > 0.25 ? 'high' :
      activitiesRatio > 0.15 ? 'medium' : 'low';

    return {
      spendingPersonality,
      preferredCategories,
      riskTolerance,
      planningStyle,
      socialPreferences,
      activityLevel
    };
  };

  const getTopInsights = (limit = 5): PredictiveInsight[] => {
    return predictiveInsights
      .sort((a, b) => {
        // Sort by impact, then confidence
        const impactOrder = { high: 3, medium: 2, low: 1 };
        const impactDiff = impactOrder[b.impact] - impactOrder[a.impact];
        if (impactDiff !== 0) return impactDiff;
        return b.confidence - a.confidence;
      })
      .slice(0, limit);
  };

  const getInsightsByType = (type: PredictiveInsight['type']): PredictiveInsight[] => {
    return predictiveInsights.filter(insight => insight.type === type);
  };

  const getInsightsByTimeHorizon = (horizon: PredictiveInsight['timeHorizon']): PredictiveInsight[] => {
    return predictiveInsights.filter(insight => insight.timeHorizon === horizon);
  };

  const getPersonalizedRecommendations = (): string[] => {
    if (!personalizationProfile) return [];

    const recommendations: string[] = [];

    switch (personalizationProfile.spendingPersonality) {
      case 'budget_conscious':
        recommendations.push('Consider budget-friendly alternatives for accommodation and activities');
        recommendations.push('Look for group deals and early booking discounts');
        break;
      case 'value_seeker':
        recommendations.push('Focus on experiences with high value-for-money ratios');
        recommendations.push('Compare multiple options before booking');
        break;
      case 'premium_experience':
        recommendations.push('Prioritize quality experiences and premium services');
        recommendations.push('Consider VIP tours and exclusive access options');
        break;
      case 'spontaneous':
        recommendations.push('Keep flexible booking options for last-minute changes');
        recommendations.push('Consider travel insurance for spontaneous plans');
        break;
    }

    switch (personalizationProfile.activityLevel) {
      case 'high':
        recommendations.push('Plan for multiple activities per day with buffer time');
        break;
      case 'medium':
        recommendations.push('Balance activities with relaxation time');
        break;
      case 'low':
        recommendations.push('Focus on quality over quantity of experiences');
        break;
    }

    return recommendations;
  };

  const getSpendingEfficiency = (): number => {
    if (!insights || !personalizationProfile) return 0;

    // Calculate efficiency based on spending personality alignment
    const optimalRatios = {
      budget_conscious: { food: 0.25, transportation: 0.2, accommodation: 0.3, activities: 0.25 },
      value_seeker: { food: 0.3, transportation: 0.25, accommodation: 0.25, activities: 0.2 },
      premium_experience: { food: 0.2, transportation: 0.2, accommodation: 0.4, activities: 0.2 },
      spontaneous: { food: 0.25, transportation: 0.3, accommodation: 0.2, activities: 0.25 }
    };

    const optimal = optimalRatios[personalizationProfile.spendingPersonality];
    const actual = insights.categoryBreakdown;
    const total = insights.totalSpent;

    let efficiency = 0;
    let count = 0;

    Object.keys(optimal).forEach(category => {
      const actualRatio = (actual[category] || 0) / total;
      const optimalRatio = optimal[category as keyof typeof optimal];
      const deviation = Math.abs(actualRatio - optimalRatio);
      efficiency += Math.max(0, 1 - deviation);
      count++;
    });

    return count > 0 ? (efficiency / count) * 100 : 0;
  };

  useEffect(() => {
    generateSpendingInsights('month', 'previous_period');
  }, [userId]);

  return {
    insights,
    predictiveInsights,
    personalizationProfile,
    loading,
    error,
    generateSpendingInsights,
    getTopInsights,
    getInsightsByType,
    getInsightsByTimeHorizon,
    getPersonalizedRecommendations,
    getSpendingEfficiency,
  };
}