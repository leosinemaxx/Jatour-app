// Smart Trip Goals Integration for JaTour
// Integrates Goal Management, Recommendation Adjustment, Progress Tracking, and Adaptive Planning

import { goalManagementEngine, TripGoal } from './goal-management-engine';
import { recommendationAdjustmentSystem } from './recommendation-adjustment-system';
import { progressTrackingService } from './progress-tracking-service';
import { adaptivePlanningEngine } from './adaptive-planning-engine';
import { smartItineraryEngine, SmartItineraryInput, SmartItineraryResult, SmartDestination } from './smart-itinerary-engine';
import { mlEngine } from './ml-engine';

export interface GoalBasedItineraryRequest {
  userId: string;
  goalType: TripGoal['type'];
  baseInput: SmartItineraryInput;
  customGoalMetrics?: Partial<TripGoal['targetMetrics']>;
}

export interface GoalBasedItineraryResult extends SmartItineraryResult {
  goal: TripGoal;
  goalAlignment: number;
  progressTracking: {
    milestones: any[];
    recommendations: string[];
  };
  adaptiveFeatures: {
    canAdapt: boolean;
    lastAdapted?: number;
    adaptationHistory: any[];
  };
}

export class SmartTripGoalsIntegration {
  // Create goal-based itinerary
  async createGoalBasedItinerary(request: GoalBasedItineraryRequest): Promise<GoalBasedItineraryResult> {
    const { userId, goalType, baseInput, customGoalMetrics } = request;

    // 1. Create or get user's trip goal
    let goal = goalManagementEngine.getUserGoals(userId).find(g => g.type === goalType);
    if (!goal) {
      goal = goalManagementEngine.createGoal(userId, goalType, customGoalMetrics);
    }

    // 2. Initialize progress tracking
    progressTrackingService.initializeGoalMilestones(goal);

    // 3. Adjust recommendations based on goal
    // Convert available destinations to SmartDestination format
    const smartDestinations: SmartDestination[] = baseInput.availableDestinations.map(dest => ({
      ...dest,
      coordinates: dest.coordinates || { lat: 0, lng: 0 }, // Provide default coordinates
      scheduledTime: '09:00', // Default
      mlScore: 0.5, // Default
      predictedSatisfaction: dest.rating / 5 // Default based on rating
    }));

    const adjustedDestinations = recommendationAdjustmentSystem.filterDestinationsForGoal(
      smartDestinations,
      goal
    );

    // 4. Get goal-specific constraints and budget allocation
    const goalConstraints = recommendationAdjustmentSystem.getGoalConstraints(goal);
    const budgetAllocation = recommendationAdjustmentSystem.getGoalBudgetAllocation(goal);

    // 5. Create enhanced input with goal adjustments
    const enhancedInput: SmartItineraryInput = {
      ...baseInput,
      availableDestinations: adjustedDestinations,
      constraints: {
        ...baseInput.constraints,
        ...goalConstraints
      },
      preferences: {
        ...baseInput.preferences,
        // Adjust budget based on goal allocation
        budget: Math.min(baseInput.preferences.budget, goal.targetMetrics.maxBudget || baseInput.preferences.budget)
      }
    };

    // 6. Generate itinerary using SmartItineraryEngine
    const baseItinerary = smartItineraryEngine.createSmartItinerary(enhancedInput);

    // 7. Calculate goal alignment
    const goalAlignment = this.calculateOverallGoalAlignment(baseItinerary, goal);

    // 8. Get progress tracking info
    const progressReport = progressTrackingService.getProgressReport(goal.id);
    const progressTracking = {
      milestones: progressReport?.milestones || [],
      recommendations: progressReport?.recommendations || []
    };

    // 9. Set up adaptive features
    const adaptiveFeatures = {
      canAdapt: true,
      adaptationHistory: []
    };

    return {
      ...baseItinerary,
      goal,
      goalAlignment,
      progressTracking,
      adaptiveFeatures
    };
  }

  // Update goal progress and potentially adapt itinerary
  async updateProgressAndAdapt(
    goalId: string,
    progressUpdate: any,
    currentItinerary?: SmartItineraryResult,
    availableAlternatives?: any
  ): Promise<{
    goal: TripGoal;
    progressReport: any;
    adaptedItinerary?: any;
    adaptations?: any[];
  }> {
    const goal = goalManagementEngine.getGoal(goalId);
    if (!goal) {
      throw new Error('Goal not found');
    }

    // Update progress
    const progressReport = progressTrackingService.updateProgress(progressUpdate, goal);

    // Update goal in management engine
    goalManagementEngine.updateProgress(progressUpdate);

    let adaptedItinerary;
    let adaptations;

    // Check if adaptation is needed
    if (this.shouldAdaptItinerary(goal, progressReport) && currentItinerary) {
      const adaptationResult = adaptivePlanningEngine.analyzeAndAdapt(
        goal,
        currentItinerary,
        progressReport,
        availableAlternatives
      );

      adaptedItinerary = adaptationResult.adaptedItinerary;
      adaptations = adaptationResult.changes;

      // Update goal with any changes from adaptation
      if (adaptations.length > 0) {
        // Could update goal progress based on adaptations
      }
    }

    return {
      goal,
      progressReport,
      adaptedItinerary,
      adaptations
    };
  }

  // Get goal recommendations for user
  getGoalRecommendations(userId: string, userPreferences: any): any[] {
    return goalManagementEngine.recommendGoals(userId, userPreferences);
  }

  // Register for real-time progress updates
  registerForProgressUpdates(userId: string, callback: (update: any) => void): () => void {
    return progressTrackingService.registerForUpdates(userId, callback);
  }

  // Export goal and progress data
  exportGoalData(userId: string): any {
    const goals = goalManagementEngine.getUserGoals(userId);
    const goalData = goals.map(goal => ({
      ...goal,
      progressReport: progressTrackingService.getProgressReport(goal.id),
      progressHistory: progressTrackingService.getProgressHistory(goal.id)
    }));

    return {
      userId,
      goals: goalData,
      exportedAt: Date.now()
    };
  }

  // Private helper methods
  private calculateOverallGoalAlignment(itinerary: SmartItineraryResult, goal: TripGoal): number {
    const destinations = itinerary.itinerary.flatMap(day => day.destinations);
    let totalAlignment = 0;
    let count = 0;

    destinations.forEach(dest => {
      const alignment = recommendationAdjustmentSystem.adjustDestinationRecommendations([dest], goal)[0];
      totalAlignment += alignment.goalAlignment;
      count++;
    });

    return count > 0 ? totalAlignment / count : 0;
  }

  private shouldAdaptItinerary(goal: TripGoal, progressReport: any): boolean {
    // Adapt if progress is significantly off track
    const progressPercentage = progressReport.overallProgress;

    // Adapt if budget is over 90% spent but goal is less than 50% complete
    if (goal.progress.currentBudget / (goal.targetMetrics.maxBudget || 1) > 0.9 && progressPercentage < 50) {
      return true;
    }

    // Adapt if rating is consistently below target
    if (goal.progress.averageRating < (goal.targetMetrics.minRating || 3.0) * 0.8) {
      return true;
    }

    // Adapt if activities completed is very low
    const activityTarget = (goal.targetMetrics.maxDailyActivities || 4) * 7;
    if (goal.progress.activitiesCompleted / activityTarget < 0.3) {
      return true;
    }

    return false;
  }
}

// Enhanced SmartItineraryEngine with goal integration
export class GoalAwareSmartItineraryEngine {
  private goalsIntegration = new SmartTripGoalsIntegration();

  // Enhanced createSmartItinerary with goal awareness
  async createSmartItinerary(input: SmartItineraryInput): Promise<SmartItineraryResult> {
    // Check if this request includes goal information
    const goalType = (input as any).goalType;
    if (goalType) {
      // Use goal-based approach
      const goalRequest: GoalBasedItineraryRequest = {
        userId: input.userId,
        goalType,
        baseInput: input,
        customGoalMetrics: (input as any).customGoalMetrics
      };

      const result = await this.goalsIntegration.createGoalBasedItinerary(goalRequest);
      // Return base itinerary result (without goal-specific fields for compatibility)
      return {
        itinerary: result.itinerary,
        totalCost: result.totalCost,
        totalDuration: result.totalDuration,
        budgetBreakdown: result.budgetBreakdown,
        mlInsights: result.mlInsights,
        optimization: result.optimization,
        costVariability: result.costVariability
      };
    }

    // Use standard approach
    return smartItineraryEngine.createSmartItinerary(input);
  }

  // New method for goal-based itinerary creation
  createGoalBasedItinerary(request: GoalBasedItineraryRequest): Promise<GoalBasedItineraryResult> {
    return this.goalsIntegration.createGoalBasedItinerary(request);
  }

  // New method for progress updates
  updateProgressAndAdapt(
    goalId: string,
    progressUpdate: any,
    currentItinerary?: SmartItineraryResult,
    availableAlternatives?: any
  ): Promise<any> {
    return this.goalsIntegration.updateProgressAndAdapt(goalId, progressUpdate, currentItinerary, availableAlternatives);
  }
}

// Singleton instances
export const smartTripGoalsIntegration = new SmartTripGoalsIntegration();
export const goalAwareSmartItineraryEngine = new GoalAwareSmartItineraryEngine();