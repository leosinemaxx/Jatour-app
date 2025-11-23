"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, TrendingUp, TrendingDown, Award, Users, Building2, Heart, Leaf, Calendar, MapPin, Sparkles, Activity, DollarSign, Clock, AlertTriangle, Target, Lightbulb, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface SpendingInsightsData {
  spendingInsights: {
    userId: string;
    period: string;
    totalSpent: number;
    categoryBreakdown: Record<string, number>;
    comparisons: Array<{
      type: string;
      category: string;
      userAverage: number;
      comparisonAverage: number;
      difference: number;
      percentage: number;
      insight: string;
    }>;
    savingsTips: Array<{
      category: string;
      currentSpending: number;
      potentialSavings: number;
      tip: string;
      confidence: number;
    }>;
    efficiencyInsights: Array<{
      category: string;
      currentTime: number;
      optimizedTime: number;
      timeSaved: number;
      insight: string;
    }>;
    trends: {
      spendingTrend: 'increasing' | 'decreasing' | 'stable';
      trendPercentage: number;
      categoryTrends: Record<string, 'increasing' | 'decreasing' | 'stable'>;
    };
    generatedAt: string;
  };
  personalizedInsights: Array<{
    id: string;
    type: 'comparison' | 'savings' | 'efficiency' | 'trend' | 'recommendation';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    actionable: boolean;
    data: any;
    generatedAt: string;
  }>;
  savingsOpportunities: Array<{
    id: string;
    category: string;
    type: string;
    title: string;
    description: string;
    potentialSavings: number;
    confidence: number;
    difficulty: 'easy' | 'medium' | 'hard';
    timeframe: 'immediate' | 'short_term' | 'long_term';
    requirements?: string[];
    alternatives?: Array<{
      option: string;
      cost: number;
      benefits: string[];
    }>;
    detectedAt: string;
  }>;
  generatedAt: string;
}

interface SpendingInsightsProps {
  userId: string;
  onDataLoaded?: (data: SpendingInsightsData) => void;
}

export default function SpendingInsights({ userId, onDataLoaded }: SpendingInsightsProps) {
  const [insightsData, setInsightsData] = useState<SpendingInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [selectedComparison, setSelectedComparison] = useState<'previous_period' | 'similar_users' | 'city_average'>('similar_users');

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/analytics/insights?userId=${userId}&period=${selectedPeriod}&compareWith=${selectedComparison}`);

        if (!response.ok) {
          throw new Error('Failed to fetch spending insights');
        }

        const data = await response.json();
        setInsightsData(data);
        onDataLoaded?.(data);
      } catch (err) {
        console.error('Error fetching insights:', err);
        setError('Failed to load spending insights. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchInsights();
    }
  }, [userId, selectedPeriod, selectedComparison, onDataLoaded]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing your spending patterns with AI...</p>
        </div>
      </div>
    );
  }

  if (error || !insightsData) {
    return (
      <div className="text-center py-8">
        <Brain className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Insights Unavailable</h2>
        <p className="text-gray-600 mb-6">{error || 'No spending data available'}</p>
        <Button
          onClick={() => window.location.reload()}
          className="bg-purple-500 text-white px-6 py-2"
        >
          Try Again
        </Button>
      </div>
    );
  }

  const { spendingInsights, personalizedInsights, savingsOpportunities } = insightsData;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <BarChart3 className="h-12 w-12 text-purple-600 mr-4" />
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Spending Insights</h1>
            <p className="text-gray-600">AI-powered analysis of your travel expenses</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center justify-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Period:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Compare with:</span>
            <select
              value={selectedComparison}
              onChange={(e) => setSelectedComparison(e.target.value as any)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="previous_period">Previous Period</option>
              <option value="similar_users">Similar Travelers</option>
              <option value="city_average">City Average</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-purple-900">
              IDR {spendingInsights.totalSpent.toLocaleString()}
            </h3>
            <p className="text-purple-600">Total Spent</p>
            <p className="text-sm text-gray-500 mt-1">
              {selectedPeriod === 'week' ? 'This week' : selectedPeriod === 'month' ? 'This month' : 'This year'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-8 w-8 text-green-600" />
              <Sparkles className="h-6 w-6 text-yellow-500" />
            </div>
            <h3 className="text-2xl font-bold text-green-900">
              {savingsOpportunities.length}
            </h3>
            <p className="text-green-600">Savings Opportunities</p>
            <p className="text-sm text-gray-500 mt-1">
              Potential savings: IDR {savingsOpportunities.reduce((sum, opp) => sum + opp.potentialSavings, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Activity className="h-8 w-8 text-blue-600" />
              {spendingInsights.trends.spendingTrend === 'increasing' ? (
                <TrendingUp className="h-6 w-6 text-red-500" />
              ) : spendingInsights.trends.spendingTrend === 'decreasing' ? (
                <TrendingDown className="h-6 w-6 text-green-500" />
              ) : (
                <Activity className="h-6 w-6 text-gray-500" />
              )}
            </div>
            <h3 className="text-2xl font-bold text-blue-900">
              {Math.abs(spendingInsights.trends.trendPercentage).toFixed(1)}%
            </h3>
            <p className="text-blue-600">Spending Trend</p>
            <p className="text-sm text-gray-500 mt-1 capitalize">
              {spendingInsights.trends.spendingTrend}
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Lightbulb className="h-8 w-8 text-orange-600" />
              <Brain className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="text-2xl font-bold text-orange-900">
              {personalizedInsights.length}
            </h3>
            <p className="text-orange-600">AI Insights</p>
            <p className="text-sm text-gray-500 mt-1">
              Personalized recommendations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-purple-600" />
            Spending Breakdown by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(spendingInsights.categoryBreakdown)
              .sort(([,a], [,b]) => b - a)
              .map(([category, amount]) => {
                const percentage = (amount / spendingInsights.totalSpent) * 100;
                return (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-sm font-medium capitalize min-w-0 flex-1">{category}</span>
                      <div className="flex-1 max-w-32">
                        <Progress value={percentage} className="h-2" />
                      </div>
                      <span className="text-sm text-gray-500 min-w-0">{percentage.toFixed(1)}%</span>
                    </div>
                    <span className="text-sm font-medium ml-4">IDR {amount.toLocaleString()}</span>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Comparisons */}
      {spendingInsights.comparisons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600" />
              Spending Comparisons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {spendingInsights.comparisons.slice(0, 5).map((comparison, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium capitalize">{comparison.category}</h4>
                    <Badge variant={comparison.difference > 0 ? "destructive" : "secondary"}>
                      {comparison.difference > 0 ? '+' : ''}{comparison.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{comparison.insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Savings Opportunities */}
      {savingsOpportunities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-6 w-6 text-green-600" />
              Savings Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {savingsOpportunities.slice(0, 5).map((opportunity) => (
                <div key={opportunity.id} className="p-4 border-l-4 border-green-500 bg-green-50 rounded-r-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{opportunity.title}</h4>
                    <div className="text-right">
                      <div className="font-bold text-green-600">IDR {opportunity.potentialSavings.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Confidence: {Math.round(opportunity.confidence * 100)}%</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{opportunity.description}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {opportunity.difficulty}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {opportunity.timeframe.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Efficiency Insights */}
      {spendingInsights.efficiencyInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-6 w-6 text-orange-600" />
              Time-Saving Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {spendingInsights.efficiencyInsights.map((insight, index) => (
                <div key={index} className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium capitalize">{insight.category}</h4>
                    <Badge className="bg-orange-500">
                      Save {insight.timeSaved} min
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{insight.insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personalized AI Insights */}
      {personalizedInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-purple-600" />
              AI-Powered Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {personalizedInsights
                .sort((a, b) => {
                  const impactOrder = { high: 3, medium: 2, low: 1 };
                  return impactOrder[b.impact] - impactOrder[a.impact];
                })
                .slice(0, 6)
                .map((insight) => (
                <div key={insight.id} className={`p-4 rounded-lg border-l-4 ${
                  insight.impact === 'high' ? 'border-l-red-500 bg-red-50' :
                  insight.impact === 'medium' ? 'border-l-yellow-500 bg-yellow-50' :
                  'border-l-gray-500 bg-gray-50'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{insight.title}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        insight.impact === 'high' ? 'destructive' :
                        insight.impact === 'medium' ? 'default' : 'secondary'
                      }>
                        {insight.impact} impact
                      </Badge>
                      {insight.actionable && (
                        <Badge variant="outline">Actionable</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{insight.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}