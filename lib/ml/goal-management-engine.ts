// Goal Management Engine for JaTour Smart Trip Goals
// Manages user trip goals and tracks progress towards achieving them

export interface TripGoal {
  id: string;
  userId: string;
  type: 'budget' | 'balanced' | 'luxury' | 'backpacker';
  name: string;
  description: string;
  targetMetrics: {
    maxBudget?: number;
    minRating?: number;
    preferredAccommodation?: 'budget' | 'moderate' | 'luxury';
    travelStyle?: 'cultural' | 'adventure' | 'relaxation' | 'food' | 'nature';
    maxDailyActivities?: number;
    preferredDestinations?: string[];
  };
  progress: {
    currentBudget: number;
    averageRating: number;
    accommodationLevel: 'budget' | 'moderate' | 'luxury';
    activitiesCompleted: number;
    destinationsVisited: number;
    lastUpdated: number;
  };
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  createdAt: number;
  updatedAt: number;
}

export interface GoalProgressUpdate {
  goalId: string;
  metric: keyof TripGoal['progress'];
  value: any;
  timestamp: number;
  reason?: string;
}

export interface GoalRecommendation {
  goalType: TripGoal['type'];
  suitability: number; // 0-1 score
  reasons: string[];
  suggestedAdjustments: {
    budget?: number;
    destinations?: string[];
    activities?: string[];
  };
}

export class GoalManagementEngine {
  private goals: Map<string, TripGoal> = new Map();
  private progressHistory: Map<string, GoalProgressUpdate[]> = new Map();

  // Predefined goal templates
  private goalTemplates: Record<TripGoal['type'], Omit<TripGoal, 'id' | 'userId' | 'progress' | 'status' | 'createdAt' | 'updatedAt' | 'type'>> = {
    budget: {
      name: 'Budget Traveler',
      description: 'Focus on cost-effective travel with great value experiences',
      targetMetrics: {
        maxBudget: 2000000, // IDR 2M
        minRating: 3.5,
        preferredAccommodation: 'budget',
        travelStyle: 'cultural',
        maxDailyActivities: 3,
      }
    },
    balanced: {
      name: 'Balanced Explorer',
      description: 'Mix of comfort and adventure with moderate spending',
      targetMetrics: {
        maxBudget: 5000000, // IDR 5M
        minRating: 4.0,
        preferredAccommodation: 'moderate',
        travelStyle: 'cultural',
        maxDailyActivities: 4,
      }
    },
    luxury: {
      name: 'Luxury Experience',
      description: 'Premium travel with high-end accommodations and exclusive experiences',
      targetMetrics: {
        maxBudget: 15000000, // IDR 15M
        minRating: 4.5,
        preferredAccommodation: 'luxury',
        travelStyle: 'relaxation',
        maxDailyActivities: 3,
      }
    },
    backpacker: {
      name: 'Backpacker Adventure',
      description: 'Authentic, immersive travel with focus on local experiences',
      targetMetrics: {
        maxBudget: 1500000, // IDR 1.5M
        minRating: 3.0,
        preferredAccommodation: 'budget',
        travelStyle: 'adventure',
        maxDailyActivities: 5,
      }
    }
  };

  // Create a new trip goal for a user
  createGoal(userId: string, goalType: TripGoal['type'], customMetrics?: Partial<TripGoal['targetMetrics']>): TripGoal {
    const template = this.goalTemplates[goalType];
    const goalId = `${userId}-${goalType}-${Date.now()}`;

    const goal: TripGoal = {
      id: goalId,
      userId,
      type: goalType,
      name: template.name,
      description: template.description,
      targetMetrics: {
        ...template.targetMetrics,
        ...customMetrics
      },
      progress: {
        currentBudget: 0,
        averageRating: 0,
        accommodationLevel: 'moderate',
        activitiesCompleted: 0,
        destinationsVisited: 0,
        lastUpdated: Date.now()
      },
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.goals.set(goalId, goal);
    return goal;
  }

  // Update goal progress
  updateProgress(update: GoalProgressUpdate): void {
    const goal = this.goals.get(update.goalId);
    if (!goal) return;

    // Update progress
    (goal.progress as any)[update.metric] = update.value;
    goal.progress.lastUpdated = update.timestamp;
    goal.updatedAt = update.timestamp;

    // Store progress history
    const history = this.progressHistory.get(update.goalId) || [];
    history.push(update);
    this.progressHistory.set(update.goalId, history);

    // Check if goal is completed
    this.checkGoalCompletion(goal);

    this.goals.set(update.goalId, goal);
  }

  // Get user's active goals
  getUserGoals(userId: string): TripGoal[] {
    return Array.from(this.goals.values())
      .filter(goal => goal.userId === userId && goal.status === 'active');
  }

  // Get specific goal
  getGoal(goalId: string): TripGoal | null {
    return this.goals.get(goalId) || null;
  }

  // Calculate goal achievement percentage
  calculateGoalProgress(goal: TripGoal): number {
    const metrics = goal.targetMetrics;
    let totalScore = 0;
    let achievedScore = 0;

    // Budget achievement (lower is better for budget goals)
    if (metrics.maxBudget) {
      totalScore += 1;
      const budgetRatio = goal.progress.currentBudget / metrics.maxBudget;
      achievedScore += Math.max(0, 1 - budgetRatio); // 1 if under budget, 0 if over
    }

    // Rating achievement
    if (metrics.minRating) {
      totalScore += 1;
      achievedScore += Math.min(1, goal.progress.averageRating / metrics.minRating);
    }

    // Accommodation level match
    if (metrics.preferredAccommodation) {
      totalScore += 1;
      const levelScores = { budget: 1, moderate: 2, luxury: 3 };
      const targetScore = levelScores[metrics.preferredAccommodation];
      const currentScore = levelScores[goal.progress.accommodationLevel];
      achievedScore += 1 - Math.abs(targetScore - currentScore) / 2; // Closer levels get higher scores
    }

    // Activities completion
    if (metrics.maxDailyActivities) {
      totalScore += 1;
      achievedScore += Math.min(1, goal.progress.activitiesCompleted / (metrics.maxDailyActivities * 7)); // Assuming 7 days
    }

    return totalScore > 0 ? (achievedScore / totalScore) * 100 : 0;
  }

  // Recommend goals based on user preferences and behavior
  recommendGoals(userId: string, userPreferences: any): GoalRecommendation[] {
    const recommendations: GoalRecommendation[] = [];

    for (const [goalType, template] of Object.entries(this.goalTemplates)) {
      let suitability = 0.5; // Base suitability
      const reasons: string[] = [];
      const adjustments: GoalRecommendation['suggestedAdjustments'] = {};

      // Analyze budget compatibility
      if (userPreferences.budget && template.targetMetrics.maxBudget) {
        const budgetRatio = userPreferences.budget / template.targetMetrics.maxBudget;
        if (budgetRatio <= 1.2 && budgetRatio >= 0.8) {
          suitability += 0.2;
          reasons.push('Budget aligns well with your spending capacity');
        } else if (budgetRatio < 0.8) {
          suitability += 0.3;
          reasons.push('Great value for your budget');
          adjustments.budget = template.targetMetrics.maxBudget;
        }
      }

      // Analyze travel style preferences
      if (userPreferences.interests && template.targetMetrics.travelStyle) {
        const styleMatch = userPreferences.interests.some((interest: string) =>
          template.targetMetrics.travelStyle?.toLowerCase().includes(interest.toLowerCase())
        );
        if (styleMatch) {
          suitability += 0.3;
          reasons.push(`Matches your interest in ${template.targetMetrics.travelStyle}`);
        }
      }

      // Analyze accommodation preferences
      if (userPreferences.accommodationType === template.targetMetrics.preferredAccommodation) {
        suitability += 0.2;
        reasons.push('Accommodation preferences match');
      }

      recommendations.push({
        goalType: goalType as TripGoal['type'],
        suitability: Math.min(suitability, 1.0),
        reasons,
        suggestedAdjustments: adjustments
      });
    }

    return recommendations.sort((a, b) => b.suitability - a.suitability);
  }

  // Check if goal is completed
  private checkGoalCompletion(goal: TripGoal): void {
    const progress = this.calculateGoalProgress(goal);

    if (progress >= 90) {
      goal.status = 'completed';
    }
  }

  // Get progress history for a goal
  getProgressHistory(goalId: string): GoalProgressUpdate[] {
    return this.progressHistory.get(goalId) || [];
  }

  // Pause or resume a goal
  updateGoalStatus(goalId: string, status: TripGoal['status']): boolean {
    const goal = this.goals.get(goalId);
    if (!goal) return false;

    goal.status = status;
    goal.updatedAt = Date.now();
    this.goals.set(goalId, goal);
    return true;
  }

  // Export goal data for analysis
  exportGoalData(userId: string): any {
    const userGoals = this.getUserGoals(userId);
    const goalData = userGoals.map(goal => ({
      ...goal,
      progressPercentage: this.calculateGoalProgress(goal),
      progressHistory: this.getProgressHistory(goal.id)
    }));

    return {
      userId,
      goals: goalData,
      exportedAt: Date.now()
    };
  }
}

// Singleton instance
export const goalManagementEngine = new GoalManagementEngine();