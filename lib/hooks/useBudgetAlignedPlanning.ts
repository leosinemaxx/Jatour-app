import { useState, useEffect } from 'react';

interface BudgetConstraints {
  totalBudget: number;
  categoryLimits?: {
    accommodation?: number;
    transportation?: number;
    food?: number;
    activities?: number;
    miscellaneous?: number;
  };
  flexibilityLevel: 'strict' | 'moderate' | 'flexible';
}

interface UserPreferences {
  priorityCategories: string[];
  costOptimizationGoals: string[];
  preferredTransportation: string[];
  timeConstraints?: {
    preferredStartTime?: string;
    preferredEndTime?: string;
    maxDailyTravelTime?: number;
  };
}

interface OptimizationGoals {
  primary: 'cost_minimization' | 'value_maximization' | 'time_efficiency' | 'experience_balance';
  secondary?: string[];
  constraints: {
    mustIncludeDestinations?: string[];
    avoidHighCostOptions?: boolean;
    preferLocalExperiences?: boolean;
  };
}

interface BudgetOptimizationRequest {
  itineraryId: string;
  userId: string;
  budgetConstraints: BudgetConstraints;
  userPreferences: UserPreferences;
  optimizationGoals: OptimizationGoals;
}

interface OptimizedItinerary {
  originalItinerary: any;
  optimizedItinerary: any;
  budgetAnalysis: {
    originalTotalCost: number;
    optimizedTotalCost: number;
    savings: number;
    savingsPercentage: number;
    categorySavings: Record<string, number>;
  };
  optimizationDetails: {
    appliedOptimizations: BudgetOptimization[];
    costBreakdown: any;
    transportationSuggestions: TransportationSuggestion[];
    alternativeOptions: AlternativeDestination[];
  };
  mlInsights: {
    budgetAlignmentScore: number;
    valueForMoneyScore: number;
    riskAssessment: string[];
  };
}

interface BudgetOptimization {
  type: 'cost_reduction' | 'value_enhancement' | 'time_optimization' | 'experience_upgrade';
  category: string;
  description: string;
  potentialSavings: number;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
}

interface TransportationSuggestion {
  day: number;
  originalOption: {
    type: string;
    cost: number;
    duration: number;
  };
  suggestedOption: {
    type: string;
    cost: number;
    duration: number;
    savings: number;
    reason: string;
  };
}

interface AlternativeDestination {
  originalDestinationId: string;
  alternativeDestination: {
    id: string;
    name: string;
    category: string;
    estimatedCost: number;
    savings: number;
    reason: string;
    tradeoffs: string[];
  };
}

interface TacticalSuggestion {
  id: string;
  type: 'immediate' | 'short_term' | 'preventive';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  potentialSavings: number;
  implementationEffort: 'easy' | 'medium' | 'complex';
  timeToImplement: string;
  successProbability: number;
  category: string;
}

export function useBudgetAlignedPlanning(
  userId: string,
  currentBudget: number,
  itineraryId?: string
) {
  const [optimizedItinerary, setOptimizedItinerary] = useState<OptimizedItinerary | null>(null);
  const [tacticalSuggestions, setTacticalSuggestions] = useState<TacticalSuggestion[]>([]);
  const [adherenceGuarantee, setAdherenceGuarantee] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optimizeBudgetItinerary = async (
    budgetConstraints: BudgetConstraints,
    userPreferences: UserPreferences,
    optimizationGoals: OptimizationGoals
  ) => {
    if (!itineraryId) return;

    setLoading(true);
    setError(null);

    try {
      const request: BudgetOptimizationRequest = {
        itineraryId,
        userId,
        budgetConstraints,
        userPreferences,
        optimizationGoals
      };

      // Call the budget-aligned itinerary engine
      const response = await fetch('/api/baap/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to optimize itinerary');
      }

      const result: OptimizedItinerary = await response.json();
      setOptimizedItinerary(result);

      // Generate tactical suggestions based on optimization results
      const suggestions = generateTacticalSuggestions(result);
      setTacticalSuggestions(suggestions);

      // Calculate adherence guarantee
      const guarantee = calculateAdherenceGuarantee(result);
      setAdherenceGuarantee(guarantee);

    } catch (err) {
      console.error('Failed to optimize budget itinerary:', err);
      setError('Failed to optimize itinerary');
    } finally {
      setLoading(false);
    }
  };

  const generateTacticalSuggestions = (optimizedResult: OptimizedItinerary): TacticalSuggestion[] => {
    const suggestions: TacticalSuggestion[] = [];

    // Immediate action suggestions (next 24 hours)
    if (optimizedResult.budgetAnalysis.savingsPercentage > 10) {
      suggestions.push({
        id: 'immediate-booking',
        type: 'immediate',
        priority: 'high',
        title: 'Book Optimized Accommodations Now',
        description: 'Secure the recommended budget-friendly accommodations before prices increase',
        potentialSavings: optimizedResult.budgetAnalysis.categorySavings.accommodation || 0,
        implementationEffort: 'easy',
        timeToImplement: '15 minutes',
        successProbability: 0.95,
        category: 'accommodation'
      });
    }

    // Short-term suggestions (next few days)
    optimizedResult.optimizationDetails.transportationSuggestions.forEach((transport, index) => {
      suggestions.push({
        id: `transport-optimization-${index}`,
        type: 'short_term',
        priority: transport.suggestedOption.savings > 50000 ? 'high' : 'medium',
        title: `Switch to ${transport.suggestedOption.type}`,
        description: transport.suggestedOption.reason,
        potentialSavings: transport.suggestedOption.savings,
        implementationEffort: 'medium',
        timeToImplement: '1-2 days',
        successProbability: 0.85,
        category: 'transportation'
      });
    });

    // Preventive suggestions
    if (optimizedResult.mlInsights.riskAssessment.length > 0) {
      optimizedResult.mlInsights.riskAssessment.forEach((risk, index) => {
        suggestions.push({
          id: `risk-mitigation-${index}`,
          type: 'preventive',
          priority: 'medium',
          title: 'Address Budget Risk',
          description: `Mitigate: ${risk}`,
          potentialSavings: optimizedResult.budgetAnalysis.savings * 0.1,
          implementationEffort: 'medium',
          timeToImplement: 'Ongoing',
          successProbability: 0.75,
          category: 'risk_management'
        });
      });
    }

    // Alternative destination suggestions
    optimizedResult.optimizationDetails.alternativeOptions.forEach((alt, index) => {
      suggestions.push({
        id: `alternative-destination-${index}`,
        type: 'short_term',
        priority: alt.alternativeDestination.savings > 100000 ? 'high' : 'medium',
        title: `Consider ${alt.alternativeDestination.name}`,
        description: alt.alternativeDestination.reason,
        potentialSavings: alt.alternativeDestination.savings,
        implementationEffort: 'easy',
        timeToImplement: '1 day',
        successProbability: 0.8,
        category: 'activities'
      });
    });

    return suggestions;
  };

  const calculateAdherenceGuarantee = (optimizedResult: OptimizedItinerary): number => {
    let guarantee = 95; // Base 95% guarantee

    // Reduce guarantee based on risks
    guarantee -= optimizedResult.mlInsights.riskAssessment.length * 5;

    // Reduce guarantee if budget alignment is poor
    if (optimizedResult.mlInsights.budgetAlignmentScore < 0.8) {
      guarantee -= 10;
    }

    // Reduce guarantee if value for money is low
    if (optimizedResult.mlInsights.valueForMoneyScore < 0.6) {
      guarantee -= 5;
    }

    // Increase guarantee for high optimization confidence
    const avgConfidence = optimizedResult.optimizationDetails.appliedOptimizations
      .reduce((sum, opt) => sum + opt.confidence, 0) /
      optimizedResult.optimizationDetails.appliedOptimizations.length;

    if (avgConfidence > 0.8) {
      guarantee += 5;
    }

    return Math.max(85, Math.min(98, guarantee)); // Clamp between 85% and 98%
  };

  const getBudgetStatus = () => {
    if (!optimizedItinerary) return null;

    const analysis = optimizedItinerary.budgetAnalysis;
    const remainingBudget = currentBudget - analysis.optimizedTotalCost;

    return {
      currentBudget,
      optimizedCost: analysis.optimizedTotalCost,
      remainingBudget,
      savings: analysis.savings,
      savingsPercentage: analysis.savingsPercentage,
      adherenceGuarantee,
      budgetUtilization: (analysis.optimizedTotalCost / currentBudget) * 100,
      riskLevel: adherenceGuarantee >= 95 ? 'low' :
                 adherenceGuarantee >= 90 ? 'medium' : 'high'
    };
  };

  const getTopTacticalSuggestions = (limit = 5): TacticalSuggestion[] => {
    return tacticalSuggestions
      .sort((a, b) => {
        // Sort by priority first, then by potential savings
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.potentialSavings - a.potentialSavings;
      })
      .slice(0, limit);
  };

  const getSuggestionsByType = (type: TacticalSuggestion['type']): TacticalSuggestion[] => {
    return tacticalSuggestions.filter(s => s.type === type);
  };

  const getSuggestionsByCategory = (category: string): TacticalSuggestion[] => {
    return tacticalSuggestions.filter(s => s.category === category);
  };

  const getTotalPotentialSavings = (): number => {
    return tacticalSuggestions.reduce((total, suggestion) => total + suggestion.potentialSavings, 0);
  };

  const applyTacticalSuggestion = async (suggestionId: string) => {
    // Mark suggestion as applied (in real implementation, this would update backend)
    setTacticalSuggestions(prev =>
      prev.map(s =>
        s.id === suggestionId
          ? { ...s, /* mark as applied */ }
          : s
      )
    );

    // Recalculate adherence guarantee after applying suggestion
    if (optimizedItinerary) {
      const newGuarantee = calculateAdherenceGuarantee(optimizedItinerary) + 1; // Slight boost
      setAdherenceGuarantee(Math.min(98, newGuarantee));
    }
  };

  return {
    optimizedItinerary,
    tacticalSuggestions,
    adherenceGuarantee,
    loading,
    error,
    optimizeBudgetItinerary,
    getBudgetStatus,
    getTopTacticalSuggestions,
    getSuggestionsByType,
    getSuggestionsByCategory,
    getTotalPotentialSavings,
    applyTacticalSuggestion,
  };
}