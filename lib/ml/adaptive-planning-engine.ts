// Adaptive Planning Engine for JaTour Smart Trip Goals
// Dynamically modifies itineraries based on goal progress and real-time conditions

import { TripGoal } from './goal-management-engine';
import { SmartItineraryResult, SmartItineraryDay, SmartDestination } from './smart-itinerary-engine';
import { ProgressReport } from './progress-tracking-service';

export interface AdaptationSuggestion {
  type: 'add_activity' | 'remove_activity' | 'change_accommodation' | 'adjust_budget' | 'reroute' | 'reschedule';
  priority: 'high' | 'medium' | 'low';
  reason: string;
  impact: {
    costChange: number;
    timeChange: number;
    satisfactionChange: number;
  };
  alternativeOptions: any[];
  recommendedAction: any;
}

export interface AdaptiveItineraryUpdate {
  originalItinerary: SmartItineraryResult;
  adaptedItinerary: SmartItineraryResult;
  changes: Array<{
    dayIndex: number;
    changeType: string;
    description: string;
    impact: any;
  }>;
  reasoning: string[];
  confidence: number;
  appliedAt: number;
}

export class AdaptivePlanningEngine {
  // Analyze current progress and suggest adaptations
  analyzeAndAdapt(
    goal: TripGoal,
    currentItinerary: SmartItineraryResult,
    progressReport: ProgressReport,
    availableAlternatives: {
      destinations?: SmartDestination[];
      accommodations?: any[];
      activities?: any[];
    } = {}
  ): AdaptiveItineraryUpdate {
    const suggestions = this.generateAdaptationSuggestions(goal, currentItinerary, progressReport, availableAlternatives);
    const adaptations = this.applyAdaptations(currentItinerary, suggestions, goal);

    return {
      originalItinerary: currentItinerary,
      adaptedItinerary: adaptations.itinerary,
      changes: adaptations.changes,
      reasoning: adaptations.reasoning,
      confidence: adaptations.confidence,
      appliedAt: Date.now()
    };
  }

  // Generate adaptation suggestions based on goal progress
  private generateAdaptationSuggestions(
    goal: TripGoal,
    itinerary: SmartItineraryResult,
    progress: ProgressReport,
    alternatives: any
  ): AdaptationSuggestion[] {
    const suggestions: AdaptationSuggestion[] = [];

    // Budget-based adaptations
    const budgetProgress = goal.progress.currentBudget / (goal.targetMetrics.maxBudget || 1);
    if (budgetProgress > 0.8) {
      suggestions.push({
        type: 'adjust_budget',
        priority: 'high',
        reason: 'Budget is running low - need to optimize remaining spending',
        impact: { costChange: -0.2, timeChange: 0, satisfactionChange: -0.1 },
        alternativeOptions: this.findBudgetFriendlyAlternatives(itinerary, alternatives),
        recommendedAction: { action: 'reduce_costs', targetReduction: 0.15 }
      });
    } else if (budgetProgress < 0.4) {
      suggestions.push({
        type: 'adjust_budget',
        priority: 'medium',
        reason: 'Budget has room for enhancement',
        impact: { costChange: 0.1, timeChange: 0, satisfactionChange: 0.15 },
        alternativeOptions: this.findPremiumAlternatives(itinerary, alternatives),
        recommendedAction: { action: 'enhance_experience', targetIncrease: 0.1 }
      });
    }

    // Rating-based adaptations
    const ratingProgress = goal.progress.averageRating / (goal.targetMetrics.minRating || 3.0);
    if (ratingProgress < 0.8) {
      suggestions.push({
        type: 'add_activity',
        priority: 'high',
        reason: 'Current destinations not meeting quality standards',
        impact: { costChange: 0.05, timeChange: 0.1, satisfactionChange: 0.2 },
        alternativeOptions: this.findHigherRatedAlternatives(itinerary, alternatives),
        recommendedAction: { action: 'replace_low_rated', minRating: goal.targetMetrics.minRating }
      });
    }

    // Activity completion adaptations
    const activityTarget = (goal.targetMetrics.maxDailyActivities || 4) * 7;
    const activityProgress = goal.progress.activitiesCompleted / activityTarget;
    if (activityProgress < 0.6) {
      suggestions.push({
        type: 'add_activity',
        priority: 'medium',
        reason: 'Not enough activities completed - need to add more',
        impact: { costChange: 0.1, timeChange: 0.2, satisfactionChange: 0.15 },
        alternativeOptions: this.findAdditionalActivities(itinerary, alternatives),
        recommendedAction: { action: 'add_activities', targetCount: Math.ceil(activityTarget * 0.3) }
      });
    }

    // Goal-specific adaptations
    switch (goal.type) {
      case 'budget':
        suggestions.push(...this.getBudgetGoalAdaptations(goal, itinerary, progress));
        break;
      case 'luxury':
        suggestions.push(...this.getLuxuryGoalAdaptations(goal, itinerary, progress));
        break;
      case 'backpacker':
        suggestions.push(...this.getBackpackerGoalAdaptations(goal, itinerary, progress));
        break;
      case 'balanced':
        suggestions.push(...this.getBalancedGoalAdaptations(goal, itinerary, progress));
        break;
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Apply selected adaptations to itinerary
  private applyAdaptations(
    originalItinerary: SmartItineraryResult,
    suggestions: AdaptationSuggestion[],
    goal: TripGoal
  ): { itinerary: SmartItineraryResult; changes: any[]; reasoning: string[]; confidence: number } {
    let adaptedItinerary = { ...originalItinerary };
    const changes: any[] = [];
    const reasoning: string[] = [];
    let confidence = 0.8; // Base confidence

    // Apply high-priority suggestions first
    const highPrioritySuggestions = suggestions.filter(s => s.priority === 'high');

    for (const suggestion of highPrioritySuggestions.slice(0, 2)) { // Limit to 2 high-priority changes
      const adaptation = this.applySingleAdaptation(adaptedItinerary, suggestion, goal);
      if (adaptation) {
        adaptedItinerary = adaptation.itinerary;
        changes.push(...adaptation.changes);
        reasoning.push(suggestion.reason);
        confidence *= 0.95; // Slight confidence reduction per change
      }
    }

    // Apply one medium-priority suggestion if no high-priority changes
    if (changes.length === 0) {
      const mediumSuggestion = suggestions.find(s => s.priority === 'medium');
      if (mediumSuggestion) {
        const adaptation = this.applySingleAdaptation(adaptedItinerary, mediumSuggestion, goal);
        if (adaptation) {
          adaptedItinerary = adaptation.itinerary;
          changes.push(...adaptation.changes);
          reasoning.push(mediumSuggestion.reason);
        }
      }
    }

    return {
      itinerary: adaptedItinerary,
      changes,
      reasoning,
      confidence
    };
  }

  // Apply a single adaptation suggestion
  private applySingleAdaptation(
    itinerary: SmartItineraryResult,
    suggestion: AdaptationSuggestion,
    goal: TripGoal
  ): { itinerary: SmartItineraryResult; changes: any[] } | null {
    switch (suggestion.type) {
      case 'adjust_budget':
        return this.applyBudgetAdjustment(itinerary, suggestion, goal);
      case 'add_activity':
        return this.applyActivityAddition(itinerary, suggestion, goal);
      case 'remove_activity':
        return this.applyActivityRemoval(itinerary, suggestion, goal);
      case 'change_accommodation':
        return this.applyAccommodationChange(itinerary, suggestion, goal);
      default:
        return null;
    }
  }

  // Budget adjustment adaptation
  private applyBudgetAdjustment(
    itinerary: SmartItineraryResult,
    suggestion: AdaptationSuggestion,
    goal: TripGoal
  ): { itinerary: SmartItineraryResult; changes: any[] } {
    const adaptedItinerary = { ...itinerary };
    const changes: any[] = [];

    // Reduce costs across destinations
    adaptedItinerary.itinerary = adaptedItinerary.itinerary.map((day, dayIndex) => {
      const adaptedDay = { ...day };
      adaptedDay.destinations = day.destinations.map(dest => {
        const costReduction = dest.estimatedCost * 0.1; // 10% reduction
        const adaptedDest = {
          ...dest,
          estimatedCost: dest.estimatedCost - costReduction
        };
        changes.push({
          dayIndex,
          changeType: 'budget_adjustment',
          description: `Reduced cost for ${dest.name} by ${costReduction}`,
          impact: { costChange: -costReduction }
        });
        return adaptedDest;
      });
      adaptedDay.totalCost = adaptedDay.destinations.reduce((sum, dest) => sum + dest.estimatedCost, 0);
      return adaptedDay;
    });

    adaptedItinerary.totalCost = adaptedItinerary.itinerary.reduce((sum, day) => sum + day.totalCost, 0);

    return { itinerary: adaptedItinerary, changes };
  }

  // Activity addition adaptation
  private applyActivityAddition(
    itinerary: SmartItineraryResult,
    suggestion: AdaptationSuggestion,
    goal: TripGoal
  ): { itinerary: SmartItineraryResult; changes: any[] } {
    const adaptedItinerary = { ...itinerary };
    const changes: any[] = [];

    // Add activities to days with low activity count
    adaptedItinerary.itinerary = adaptedItinerary.itinerary.map((day, dayIndex) => {
      if (day.destinations.length < (goal.targetMetrics.maxDailyActivities || 4)) {
        // Add a budget-friendly activity
        const newActivity: SmartDestination = {
          id: `adapted-${Date.now()}`,
          name: 'Local Exploration',
          category: 'cultural',
          location: day.destinations[0]?.location || 'Local Area',
          coordinates: day.destinations[0]?.coordinates || { lat: 0, lng: 0 },
          scheduledTime: '14:00',
          duration: 120,
          estimatedCost: 50000,
          rating: 4.0,
          tags: ['local', 'culture'],
          mlScore: 0.7,
          predictedSatisfaction: 0.8
        };

        const adaptedDay = { ...day };
        adaptedDay.destinations = [...day.destinations, newActivity];
        adaptedDay.totalCost += newActivity.estimatedCost;
        adaptedDay.totalTime += newActivity.duration;

        changes.push({
          dayIndex,
          changeType: 'activity_added',
          description: `Added ${newActivity.name} to day ${dayIndex + 1}`,
          impact: { costChange: newActivity.estimatedCost, timeChange: newActivity.duration }
        });

        return adaptedDay;
      }
      return day;
    });

    adaptedItinerary.totalCost = adaptedItinerary.itinerary.reduce((sum, day) => sum + day.totalCost, 0);
    adaptedItinerary.totalDuration = adaptedItinerary.itinerary.reduce((sum, day) => sum + day.totalTime, 0);

    return { itinerary: adaptedItinerary, changes };
  }

  // Activity removal adaptation
  private applyActivityRemoval(
    itinerary: SmartItineraryResult,
    suggestion: AdaptationSuggestion,
    goal: TripGoal
  ): { itinerary: SmartItineraryResult; changes: any[] } {
    const adaptedItinerary = { ...itinerary };
    const changes: any[] = [];

    // Remove lowest-rated activities if over budget
    adaptedItinerary.itinerary = adaptedItinerary.itinerary.map((day, dayIndex) => {
      if (day.destinations.length > 2) {
        const sortedDests = [...day.destinations].sort((a, b) => a.rating - b.rating);
        const toRemove = sortedDests[0];

        const adaptedDay = { ...day };
        adaptedDay.destinations = day.destinations.filter(dest => dest.id !== toRemove.id);
        adaptedDay.totalCost -= toRemove.estimatedCost;
        adaptedDay.totalTime -= toRemove.duration;

        changes.push({
          dayIndex,
          changeType: 'activity_removed',
          description: `Removed ${toRemove.name} from day ${dayIndex + 1} to save costs`,
          impact: { costChange: -toRemove.estimatedCost, timeChange: -toRemove.duration }
        });

        return adaptedDay;
      }
      return day;
    });

    adaptedItinerary.totalCost = adaptedItinerary.itinerary.reduce((sum, day) => sum + day.totalCost, 0);
    adaptedItinerary.totalDuration = adaptedItinerary.itinerary.reduce((sum, day) => sum + day.totalTime, 0);

    return { itinerary: adaptedItinerary, changes };
  }

  // Accommodation change adaptation
  private applyAccommodationChange(
    itinerary: SmartItineraryResult,
    suggestion: AdaptationSuggestion,
    goal: TripGoal
  ): { itinerary: SmartItineraryResult; changes: any[] } {
    const adaptedItinerary = { ...itinerary };
    const changes: any[] = [];

    // Upgrade or downgrade accommodation based on goal
    adaptedItinerary.itinerary = adaptedItinerary.itinerary.map((day, dayIndex) => {
      if (day.accommodation) {
        const currentCost = day.accommodation.cost;
        let newCost = currentCost;

        if (goal.type === 'budget' && currentCost > 200000) {
          newCost = currentCost * 0.7; // 30% reduction
        } else if (goal.type === 'luxury' && currentCost < 500000) {
          newCost = currentCost * 1.5; // 50% increase
        }

        if (newCost !== currentCost) {
          const adaptedDay = { ...day };
          adaptedDay.accommodation = {
            ...day.accommodation,
            cost: newCost
          };
          adaptedDay.totalCost = adaptedDay.totalCost - currentCost + newCost;

          changes.push({
            dayIndex,
            changeType: 'accommodation_changed',
            description: `Adjusted accommodation cost for day ${dayIndex + 1}`,
            impact: { costChange: newCost - currentCost }
          });

          return adaptedDay;
        }
      }
      return day;
    });

    adaptedItinerary.totalCost = adaptedItinerary.itinerary.reduce((sum, day) => sum + day.totalCost, 0);

    return { itinerary: adaptedItinerary, changes };
  }

  // Goal-specific adaptation methods
  private getBudgetGoalAdaptations(goal: TripGoal, itinerary: SmartItineraryResult, progress: ProgressReport): AdaptationSuggestion[] {
    const suggestions: AdaptationSuggestion[] = [];

    if (goal.progress.currentBudget > (goal.targetMetrics.maxBudget || 0) * 0.7) {
      suggestions.push({
        type: 'remove_activity',
        priority: 'high',
        reason: 'Budget goal requires strict cost control',
        impact: { costChange: -0.15, timeChange: -0.1, satisfactionChange: -0.05 },
        alternativeOptions: [],
        recommendedAction: { action: 'remove_expensive_activities' }
      });
    }

    return suggestions;
  }

  private getLuxuryGoalAdaptations(goal: TripGoal, itinerary: SmartItineraryResult, progress: ProgressReport): AdaptationSuggestion[] {
    const suggestions: AdaptationSuggestion[] = [];

    if (goal.progress.averageRating < 4.2) {
      suggestions.push({
        type: 'change_accommodation',
        priority: 'high',
        reason: 'Luxury goal requires premium accommodations',
        impact: { costChange: 0.3, timeChange: 0, satisfactionChange: 0.2 },
        alternativeOptions: [],
        recommendedAction: { action: 'upgrade_accommodations' }
      });
    }

    return suggestions;
  }

  private getBackpackerGoalAdaptations(goal: TripGoal, itinerary: SmartItineraryResult, progress: ProgressReport): AdaptationSuggestion[] {
    const suggestions: AdaptationSuggestion[] = [];

    if (goal.progress.activitiesCompleted < (goal.targetMetrics.maxDailyActivities || 4) * 3) {
      suggestions.push({
        type: 'add_activity',
        priority: 'medium',
        reason: 'Backpacker goal focuses on immersive experiences',
        impact: { costChange: 0.05, timeChange: 0.15, satisfactionChange: 0.1 },
        alternativeOptions: [],
        recommendedAction: { action: 'add_local_experiences' }
      });
    }

    return suggestions;
  }

  private getBalancedGoalAdaptations(goal: TripGoal, itinerary: SmartItineraryResult, progress: ProgressReport): AdaptationSuggestion[] {
    // Balanced goals are more flexible, fewer forced adaptations
    return [];
  }

  // Helper methods for finding alternatives
  private findBudgetFriendlyAlternatives(itinerary: SmartItineraryResult, alternatives: any): any[] {
    // Simplified implementation
    return alternatives.destinations?.filter((dest: any) => dest.estimatedCost < 100000) || [];
  }

  private findPremiumAlternatives(itinerary: SmartItineraryResult, alternatives: any): any[] {
    return alternatives.destinations?.filter((dest: any) => dest.estimatedCost > 200000) || [];
  }

  private findHigherRatedAlternatives(itinerary: SmartItineraryResult, alternatives: any): any[] {
    return alternatives.destinations?.filter((dest: any) => dest.rating > 4.0) || [];
  }

  private findAdditionalActivities(itinerary: SmartItineraryResult, alternatives: any): any[] {
    return alternatives.activities || [];
  }
}

// Singleton instance
export const adaptivePlanningEngine = new AdaptivePlanningEngine();