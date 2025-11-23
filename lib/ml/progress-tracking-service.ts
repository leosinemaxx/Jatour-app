// Progress Tracking Service for JaTour Smart Trip Goals
// Tracks goal progress and provides real-time updates

import { TripGoal, GoalProgressUpdate } from './goal-management-engine';

export interface ProgressMilestone {
  id: string;
  goalId: string;
  type: 'budget' | 'rating' | 'activities' | 'destinations' | 'time';
  target: number;
  current: number;
  achieved: boolean;
  achievedAt?: number;
  description: string;
}

export interface ProgressReport {
  goalId: string;
  overallProgress: number; // 0-100
  milestones: ProgressMilestone[];
  recentUpdates: GoalProgressUpdate[];
  nextMilestones: ProgressMilestone[];
  insights: string[];
  recommendations: string[];
  lastUpdated: number;
}

export interface RealTimeProgressUpdate {
  goalId: string;
  userId: string;
  type: 'progress_update' | 'milestone_achieved' | 'goal_completed';
  data: any;
  timestamp: number;
}

export class ProgressTrackingService {
  private milestones: Map<string, ProgressMilestone[]> = new Map();
  private progressReports: Map<string, ProgressReport> = new Map();
  private progressHistory: Map<string, GoalProgressUpdate[]> = new Map();
  private realTimeCallbacks: Map<string, ((update: RealTimeProgressUpdate) => void)[]> = new Map();

  // Initialize milestones for a goal
  initializeGoalMilestones(goal: TripGoal): ProgressMilestone[] {
    const milestones: ProgressMilestone[] = [];
    const metrics = goal.targetMetrics;

    // Budget milestones
    if (metrics.maxBudget) {
      milestones.push(
        {
          id: `${goal.id}-budget-25`,
          goalId: goal.id,
          type: 'budget',
          target: metrics.maxBudget * 0.25,
          current: 0,
          achieved: false,
          description: '25% of budget spent'
        },
        {
          id: `${goal.id}-budget-50`,
          goalId: goal.id,
          type: 'budget',
          target: metrics.maxBudget * 0.5,
          current: 0,
          achieved: false,
          description: '50% of budget spent'
        },
        {
          id: `${goal.id}-budget-75`,
          goalId: goal.id,
          type: 'budget',
          target: metrics.maxBudget * 0.75,
          current: 0,
          achieved: false,
          description: '75% of budget spent'
        }
      );
    }

    // Rating milestones
    if (metrics.minRating) {
      milestones.push({
        id: `${goal.id}-rating-target`,
        goalId: goal.id,
        type: 'rating',
        target: metrics.minRating,
        current: 0,
        achieved: false,
        description: `Average rating of ${metrics.minRating} achieved`
      });
    }

    // Activity milestones
    if (metrics.maxDailyActivities) {
      const totalActivities = metrics.maxDailyActivities * 7; // Assuming 7 days
      milestones.push(
        {
          id: `${goal.id}-activities-50`,
          goalId: goal.id,
          type: 'activities',
          target: Math.floor(totalActivities * 0.5),
          current: 0,
          achieved: false,
          description: '50% of planned activities completed'
        },
        {
          id: `${goal.id}-activities-100`,
          goalId: goal.id,
          type: 'activities',
          target: totalActivities,
          current: 0,
          achieved: false,
          description: 'All planned activities completed'
        }
      );
    }

    // Destination milestones
    if (metrics.preferredDestinations && metrics.preferredDestinations.length > 0) {
      milestones.push({
        id: `${goal.id}-destinations-target`,
        goalId: goal.id,
        type: 'destinations',
        target: metrics.preferredDestinations.length,
        current: 0,
        achieved: false,
        description: `Visited ${metrics.preferredDestinations.length} preferred destinations`
      });
    }

    this.milestones.set(goal.id, milestones);
    return milestones;
  }

  // Update progress and check milestones
  updateProgress(update: GoalProgressUpdate, goal: TripGoal): ProgressReport {
    // Update milestone progress
    const milestones = this.milestones.get(update.goalId) || [];
    let milestoneAchieved = false;

    milestones.forEach(milestone => {
      // Map progress metrics to milestone types
      const metricToMilestoneType: Record<string, ProgressMilestone['type']> = {
        currentBudget: 'budget',
        averageRating: 'rating',
        activitiesCompleted: 'activities',
        destinationsVisited: 'destinations'
      };

      const milestoneType = metricToMilestoneType[update.metric];
      if (milestone.type === milestoneType) {
        milestone.current = update.value;

        if (!milestone.achieved && milestone.current >= milestone.target) {
          milestone.achieved = true;
          milestone.achievedAt = update.timestamp;
          milestoneAchieved = true;

          // Send real-time update for milestone achievement
          this.sendRealTimeUpdate({
            goalId: update.goalId,
            userId: goal.userId,
            type: 'milestone_achieved',
            data: milestone,
            timestamp: update.timestamp
          });
        }
      }
    });

    // Generate progress report
    const report = this.generateProgressReport(goal, milestones, [update]);

    // Check if goal is completed
    if (report.overallProgress >= 100 && goal.status !== 'completed') {
      goal.status = 'completed';
      this.sendRealTimeUpdate({
        goalId: update.goalId,
        userId: goal.userId,
        type: 'goal_completed',
        data: report,
        timestamp: update.timestamp
      });
    }

    this.progressReports.set(update.goalId, report);

    // Send progress update
    this.sendRealTimeUpdate({
      goalId: update.goalId,
      userId: goal.userId,
      type: 'progress_update',
      data: report,
      timestamp: update.timestamp
    });

    return report;
  }

  // Get current progress report
  getProgressReport(goalId: string): ProgressReport | null {
    return this.progressReports.get(goalId) || null;
  }

  // Get upcoming milestones
  getUpcomingMilestones(goalId: string): ProgressMilestone[] {
    const milestones = this.milestones.get(goalId) || [];
    return milestones
      .filter(m => !m.achieved)
      .sort((a, b) => (a.target - a.current) - (b.target - b.current));
  }

  // Register for real-time updates
  registerForUpdates(userId: string, callback: (update: RealTimeProgressUpdate) => void): () => void {
    const callbacks = this.realTimeCallbacks.get(userId) || [];
    callbacks.push(callback);
    this.realTimeCallbacks.set(userId, callbacks);

    // Return unsubscribe function
    return () => {
      const currentCallbacks = this.realTimeCallbacks.get(userId) || [];
      const index = currentCallbacks.indexOf(callback);
      if (index > -1) {
        currentCallbacks.splice(index, 1);
        this.realTimeCallbacks.set(userId, currentCallbacks);
      }
    };
  }

  // Generate insights based on progress
  generateProgressInsights(goal: TripGoal, report: ProgressReport): string[] {
    const insights: string[] = [];

    if (report.overallProgress < 25) {
      insights.push("Just getting started! Keep up the momentum.");
    } else if (report.overallProgress < 50) {
      insights.push("Making good progress towards your goal!");
    } else if (report.overallProgress < 75) {
      insights.push("More than halfway there! Stay focused.");
    } else if (report.overallProgress < 100) {
      insights.push("So close to achieving your goal!");
    }

    // Budget insights
    const budgetProgress = goal.progress.currentBudget / (goal.targetMetrics.maxBudget || 1);
    if (budgetProgress > 0.8) {
      insights.push("Budget is running low. Consider cost-saving alternatives.");
    } else if (budgetProgress < 0.3) {
      insights.push("Plenty of budget remaining. Consider upgrading experiences.");
    }

    // Rating insights
    if (goal.progress.averageRating < (goal.targetMetrics.minRating || 3.0)) {
      insights.push("Consider higher-rated destinations to meet your quality goals.");
    }

    // Activity insights
    const activityTarget = (goal.targetMetrics.maxDailyActivities || 4) * 7;
    const activityProgress = goal.progress.activitiesCompleted / activityTarget;
    if (activityProgress < 0.5) {
      insights.push("Try to complete more activities to maximize your trip experience.");
    }

    return insights;
  }

  // Generate recommendations based on progress
  generateProgressRecommendations(goal: TripGoal, report: ProgressReport): string[] {
    const recommendations: string[] = [];

    // Budget recommendations
    if (goal.progress.currentBudget > (goal.targetMetrics.maxBudget || 0) * 0.8) {
      recommendations.push("Look for free or low-cost activities to extend your trip.");
      recommendations.push("Consider local transportation options to save money.");
    }

    // Rating recommendations
    if (goal.progress.averageRating < (goal.targetMetrics.minRating || 3.0)) {
      recommendations.push("Prioritize highly-rated destinations for remaining activities.");
      recommendations.push("Check recent reviews before booking.");
    }

    // Activity recommendations
    if (goal.progress.activitiesCompleted < (goal.targetMetrics.maxDailyActivities || 4) * 3) {
      recommendations.push("Add more activities to your remaining days.");
      recommendations.push("Consider combining multiple attractions in one day.");
    }

    // Goal-specific recommendations
    switch (goal.type) {
      case 'budget':
        recommendations.push("Look for group discounts and early booking deals.");
        break;
      case 'luxury':
        recommendations.push("Consider premium experiences and private tours.");
        break;
      case 'backpacker':
        recommendations.push("Connect with other travelers for shared experiences.");
        break;
      case 'balanced':
        recommendations.push("Mix high-value experiences with budget-friendly options.");
        break;
    }

    return recommendations;
  }

  // Get progress history for a goal
  getProgressHistory(goalId: string): GoalProgressUpdate[] {
    return this.progressHistory.get(goalId) || [];
  }

  // Export progress data
  exportProgressData(goalId: string): any {
    const milestones = this.milestones.get(goalId) || [];
    const report = this.progressReports.get(goalId);

    return {
      goalId,
      milestones,
      progressReport: report,
      exportedAt: Date.now()
    };
  }

  // Private methods
  private generateProgressReport(
    goal: TripGoal,
    milestones: ProgressMilestone[],
    recentUpdates: GoalProgressUpdate[]
  ): ProgressReport {
    // Calculate overall progress (simplified version)
    let totalScore = 0;
    let achievedScore = 0;

    // Budget progress
    if (goal.targetMetrics.maxBudget) {
      totalScore += 1;
      achievedScore += Math.min(1, goal.progress.currentBudget / goal.targetMetrics.maxBudget);
    }

    // Rating progress
    if (goal.targetMetrics.minRating) {
      totalScore += 1;
      achievedScore += Math.min(1, goal.progress.averageRating / goal.targetMetrics.minRating);
    }

    // Activity progress
    if (goal.targetMetrics.maxDailyActivities) {
      totalScore += 1;
      const targetActivities = goal.targetMetrics.maxDailyActivities * 7;
      achievedScore += Math.min(1, goal.progress.activitiesCompleted / targetActivities);
    }

    // Destination progress
    if (goal.targetMetrics.preferredDestinations) {
      totalScore += 1;
      achievedScore += Math.min(1, goal.progress.destinationsVisited / goal.targetMetrics.preferredDestinations.length);
    }

    const overallProgress = totalScore > 0 ? (achievedScore / totalScore) * 100 : 0;

    const nextMilestones = milestones
      .filter(m => !m.achieved)
      .sort((a, b) => (a.target - a.current) - (b.target - b.current))
      .slice(0, 3);

    return {
      goalId: goal.id,
      overallProgress,
      milestones,
      recentUpdates,
      nextMilestones,
      insights: this.generateProgressInsights(goal, { overallProgress } as ProgressReport),
      recommendations: this.generateProgressRecommendations(goal, { overallProgress } as ProgressReport),
      lastUpdated: Date.now()
    };
  }

  private sendRealTimeUpdate(update: RealTimeProgressUpdate): void {
    const callbacks = this.realTimeCallbacks.get(update.userId) || [];
    callbacks.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('Error sending real-time update:', error);
      }
    });
  }
}

// Singleton instance
export const progressTrackingService = new ProgressTrackingService();