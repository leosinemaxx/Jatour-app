// Auto Budget Correction Engine for JaTour
// Main orchestrator for automatic budget corrections based on spending patterns and user preferences

import { mlEngine } from './ml-engine';
import { spendingPatternAnalyzer, SpendingData, OverspendingAlert } from './spending-pattern-analyzer';
import { budgetAdjustmentEngine, BudgetAdjustment, AdjustmentContext } from './budget-adjustment-engine';
import { preferenceLearningSystem, PersonalizedRecommendation } from './preference-learning-system';
import { correctionNotificationSystem } from './correction-notification-system';

export interface BudgetCorrectionTrigger {
  type: 'scheduled_check' | 'spending_update' | 'itinerary_change' | 'manual_request';
  userId: string;
  data?: any;
  timestamp: Date;
}

export interface CorrectionResult {
  userId: string;
  correctionsApplied: BudgetAdjustment[];
  notificationsSent: string[];
  recommendationsGenerated: PersonalizedRecommendation[];
  expectedSavings: number;
  confidence: number;
  processingTime: number;
  timestamp: Date;
}

export interface BudgetCorrectionConfig {
  overspendingThresholds: {
    daily: number; // percentage
    weekly: number;
    monthly: number;
  };
  checkIntervals: {
    frequent: number; // minutes for high-risk users
    normal: number;   // minutes for normal users
    low: number;      // minutes for low-risk users
  };
  minimumAdjustmentAmount: number; // minimum amount to trigger adjustment
  proactiveCheckEnabled: boolean;
  learningEnabled: boolean;
}

export class AutoBudgetCorrectionEngine {
  private config: BudgetCorrectionConfig;
  private activeCorrections: Map<string, CorrectionResult> = new Map();
  private scheduledChecks: Map<string, NodeJS.Timeout> = new Map();

  constructor(config?: Partial<BudgetCorrectionConfig>) {
    this.config = {
      overspendingThresholds: {
        daily: 20, // 20% over budget
        weekly: 15,
        monthly: 10
      },
      checkIntervals: {
        frequent: 30, // 30 minutes
        normal: 120,  // 2 hours
        low: 480      // 8 hours
      },
      minimumAdjustmentAmount: 50000, // 50k IDR
      proactiveCheckEnabled: true,
      learningEnabled: true,
      ...config
    };
  }

  // Main entry point for budget correction processing
  async processBudgetCorrection(trigger: BudgetCorrectionTrigger): Promise<CorrectionResult> {
    const startTime = Date.now();
    const { userId } = trigger;

    try {
      // Step 1: Analyze current spending patterns
      const spendingPattern = spendingPatternAnalyzer.analyzePatterns(userId);

      // Step 2: Check for overspending alerts
      const overspendingAlerts = this.detectOverspending(userId);

      // Step 3: Generate adjustment context
      const adjustmentContext = await this.buildAdjustmentContext(userId, overspendingAlerts, spendingPattern);

      // Step 4: Generate budget adjustments if needed
      const correctionsApplied: BudgetAdjustment[] = [];
      if (this.shouldGenerateAdjustments(overspendingAlerts, spendingPattern)) {
        const adjustment = await budgetAdjustmentEngine.generateAdjustments(adjustmentContext);
        correctionsApplied.push(adjustment);
      }

      // Step 5: Generate personalized recommendations
      const recommendationsGenerated = await this.generateRecommendations(userId, adjustmentContext);

      // Step 6: Send notifications
      const notificationsSent = await this.sendNotifications(userId, overspendingAlerts, correctionsApplied);

      // Step 7: Apply learning updates
      if (this.config.learningEnabled) {
        await this.updateLearningModels(userId, trigger, correctionsApplied);
      }

      // Step 8: Schedule next check
      this.scheduleNextCheck(userId, spendingPattern.riskScore);

      const result: CorrectionResult = {
        userId,
        correctionsApplied,
        notificationsSent,
        recommendationsGenerated,
        expectedSavings: correctionsApplied.reduce((sum, adj) => sum + adj.expectedSavings, 0),
        confidence: this.calculateOverallConfidence(correctionsApplied),
        processingTime: Date.now() - startTime,
        timestamp: new Date()
      };

      // Store result
      this.activeCorrections.set(userId, result);

      return result;

    } catch (error) {
      console.error(`Error processing budget correction for user ${userId}:`, error);

      // Return error result
      return {
        userId,
        correctionsApplied: [],
        notificationsSent: [],
        recommendationsGenerated: [],
        expectedSavings: 0,
        confidence: 0,
        processingTime: Date.now() - startTime,
        timestamp: new Date()
      };
    }
  }

  // Track spending data and trigger corrections if needed
  async trackSpending(spendingData: SpendingData): Promise<void> {
    // Add spending data to analyzer
    spendingPatternAnalyzer.trackSpending(spendingData);

    // Check if immediate correction is needed
    const alerts = spendingPatternAnalyzer.detectOverspending(spendingData.userId, {
      daily: 100000, // Simplified budget limits
      weekly: 500000,
      monthly: 2000000
    });

    const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
    if (criticalAlerts.length > 0) {
      // Trigger immediate correction
      const trigger: BudgetCorrectionTrigger = {
        type: 'spending_update',
        userId: spendingData.userId,
        data: { spendingData, alerts: criticalAlerts },
        timestamp: new Date()
      };

      await this.processBudgetCorrection(trigger);
    }
  }

  // Manual trigger for budget correction
  async triggerManualCorrection(userId: string, reason?: string): Promise<CorrectionResult> {
    const trigger: BudgetCorrectionTrigger = {
      type: 'manual_request',
      userId,
      data: { reason },
      timestamp: new Date()
    };

    return await this.processBudgetCorrection(trigger);
  }

  // Get current correction status for a user
  getCorrectionStatus(userId: string): CorrectionResult | null {
    return this.activeCorrections.get(userId) || null;
  }

  // Update configuration
  updateConfig(newConfig: Partial<BudgetCorrectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Shutdown and cleanup
  shutdown(): void {
    // Clear all scheduled checks
    this.scheduledChecks.forEach(timeout => clearTimeout(timeout));
    this.scheduledChecks.clear();
  }

  private detectOverspending(userId: string): OverspendingAlert[] {
    // Use dynamic budget limits based on user profile
    const userProfile = mlEngine.getUserProfile(userId);
    const baseLimits = {
      daily: 200000, // Base daily budget
      weekly: 1000000,
      monthly: 4000000
    };

    // Adjust limits based on user preferences
    if (userProfile) {
      const priceMultiplier = userProfile.mlInsights.priceSensitivity > 0.7 ? 0.8 :
                             userProfile.mlInsights.priceSensitivity < 0.3 ? 1.5 : 1.0;

      baseLimits.daily *= priceMultiplier;
      baseLimits.weekly *= priceMultiplier;
      baseLimits.monthly *= priceMultiplier;
    }

    return spendingPatternAnalyzer.detectOverspending(userId, baseLimits);
  }

  private async buildAdjustmentContext(
    userId: string,
    alerts: OverspendingAlert[],
    spendingPattern: any
  ): Promise<AdjustmentContext> {
    // Get current budget from database (simplified)
    const currentBudget = await this.getCurrentBudget(userId);

    // Get upcoming expenses (simplified)
    const upcomingExpenses = await this.getUpcomingExpenses(userId);

    // Get user preferences
    const userPreferences = mlEngine.getUserProfile(userId);

    if (!userPreferences) {
      throw new Error(`User profile not found for user ${userId}`);
    }

    return {
      userId,
      currentBudget,
      overspendingAlerts: alerts,
      spendingPattern,
      upcomingExpenses,
      userPreferences
    };
  }

  private shouldGenerateAdjustments(alerts: OverspendingAlert[], spendingPattern: any): boolean {
    // Generate adjustments if:
    // 1. There are critical or high severity alerts
    const hasCriticalAlerts = alerts.some(alert => alert.severity === 'critical' || alert.severity === 'high');

    // 2. Risk score is high
    const highRisk = spendingPattern.riskScore > 0.7;

    // 3. Spending velocity indicates rapid increase
    const rapidIncrease = spendingPattern.spendingVelocity > 0.3;

    return hasCriticalAlerts || highRisk || rapidIncrease;
  }

  private async generateRecommendations(
    userId: string,
    context: AdjustmentContext
  ): Promise<PersonalizedRecommendation[]> {
    const options = await this.getAvailableOptions(userId, context);

    if (options.length === 0) return [];

    const recommendations = await preferenceLearningSystem.generatePersonalizedRecommendations(
      userId,
      'budget_adjustment',
      options
    );

    return [recommendations];
  }

  private async sendNotifications(
    userId: string,
    alerts: OverspendingAlert[],
    corrections: BudgetAdjustment[]
  ): Promise<string[]> {
    const notificationsSent: string[] = [];

    // Send overspending alerts
    for (const alert of alerts) {
      if (alert.severity !== 'low') {
        await correctionNotificationSystem.sendOverspendingAlert(alert);
        notificationsSent.push(`overspending_${alert.severity}`);
      }
    }

    // Send budget adjustment notifications
    for (const correction of corrections) {
      await correctionNotificationSystem.sendBudgetAdjustment(correction);
      notificationsSent.push(`adjustment_${correction.adjustmentId}`);
    }

    return notificationsSent;
  }

  private async updateLearningModels(
    userId: string,
    trigger: BudgetCorrectionTrigger,
    corrections: BudgetAdjustment[]
  ): Promise<void> {
    // Update preference learning system with behavior observations
    await preferenceLearningSystem.updatePreferences({
      userId,
      updateType: 'behavior_observation',
      data: {
        triggerType: trigger.type,
        correctionsApplied: corrections.length,
        timestamp: trigger.timestamp
      },
      timestamp: new Date()
    });

    // Update spending pattern analysis
    if (trigger.type === 'spending_update' && trigger.data?.spendingData) {
      await preferenceLearningSystem.updatePreferences({
        userId,
        updateType: 'spending_pattern',
        data: trigger.data.spendingData,
        timestamp: new Date()
      });
    }
  }

  private scheduleNextCheck(userId: string, riskScore: number): void {
    // Clear existing scheduled check
    const existingTimeout = this.scheduledChecks.get(userId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Determine check interval based on risk score
    let intervalMinutes: number;
    if (riskScore > 0.8) {
      intervalMinutes = this.config.checkIntervals.frequent;
    } else if (riskScore > 0.5) {
      intervalMinutes = this.config.checkIntervals.normal;
    } else {
      intervalMinutes = this.config.checkIntervals.low;
    }

    // Schedule next check
    const timeout = setTimeout(async () => {
      const trigger: BudgetCorrectionTrigger = {
        type: 'scheduled_check',
        userId,
        timestamp: new Date()
      };

      await this.processBudgetCorrection(trigger);
    }, intervalMinutes * 60 * 1000);

    this.scheduledChecks.set(userId, timeout);
  }

  private calculateOverallConfidence(corrections: BudgetAdjustment[]): number {
    if (corrections.length === 0) return 0;

    const totalConfidence = corrections.reduce((sum, correction) => sum + correction.confidence, 0);
    return totalConfidence / corrections.length;
  }

  private async getCurrentBudget(userId: string): Promise<AdjustmentContext['currentBudget']> {
    // In a real implementation, this would fetch from the database
    // For now, return mock data
    return {
      total: 3000000, // 3M IDR
      categories: {
        accommodation: 1000000,
        transportation: 600000,
        food: 750000,
        activities: 450000,
        miscellaneous: 200000
      },
      remainingDays: 14
    };
  }

  private async getUpcomingExpenses(userId: string): Promise<AdjustmentContext['upcomingExpenses']> {
    // In a real implementation, this would fetch upcoming itinerary items
    // For now, return mock data
    return [
      {
        id: 'upcoming_hotel_1',
        category: 'accommodation',
        estimatedCost: 300000,
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        flexibility: 'flexible'
      },
      {
        id: 'upcoming_food_1',
        category: 'food',
        estimatedCost: 150000,
        date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        flexibility: 'flexible'
      }
    ];
  }

  private async getAvailableOptions(userId: string, context: AdjustmentContext): Promise<Array<{
    id: string;
    name: string;
    category: string;
    cost: number;
    metadata?: any;
  }>> {
    // Generate alternative options based on current context
    const options: Array<{
      id: string;
      name: string;
      category: string;
      cost: number;
      metadata?: any;
    }> = [];

    // Add accommodation alternatives
    options.push({
      id: 'alt_accommodation_budget',
      name: 'Budget Hotel Option',
      category: 'accommodation',
      cost: 250000,
      metadata: { style: 'budget', originalCost: 400000 }
    });

    // Add food alternatives
    options.push({
      id: 'alt_food_local',
      name: 'Local Warung',
      category: 'food',
      cost: 80000,
      metadata: { type: 'local', originalCost: 150000 }
    });

    // Add transportation alternatives
    options.push({
      id: 'alt_transport_public',
      name: 'Public Transport',
      category: 'transportation',
      cost: 50000,
      metadata: { type: 'public', originalCost: 120000 }
    });

    return options;
  }
}

// Singleton instance
export const autoBudgetCorrectionEngine = new AutoBudgetCorrectionEngine();