import { Injectable, Logger, Inject } from '@nestjs/common';
import { DealMatchingService, DealMatchingRequest, DealMatchingResult, ScoredDeal } from '../deal-matching/deal-matching.service';
import { DealNotificationService } from '../deal-notification/deal-notification.service';
import { BudgetService } from '../budget/budget.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export interface BudgetDealOrchestrationRequest {
  userId: string;
  itineraryId?: string;
  trigger: 'budget_update' | 'itinerary_change' | 'scheduled_check' | 'manual_request';
  location?: string;
  forceRefresh?: boolean;
}

export interface BudgetDealOrchestrationResult {
  success: boolean;
  dealsFound: number;
  notificationsSent: number;
  budgetAnalysis: {
    totalBudget: number;
    remainingBudget: number;
    recommendedSavings: number;
    dealCoverage: number; // percentage of budget covered by deals
  };
  topDeals: ScoredDeal[];
  processingTime: number;
  cacheUsed: boolean;
}

@Injectable()
export class BudgetDealOrchestratorService {
  private readonly logger = new Logger(BudgetDealOrchestratorService.name);

  constructor(
    private readonly dealMatchingService: DealMatchingService,
    private readonly dealNotificationService: DealNotificationService,
    private readonly budgetService: BudgetService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Main orchestration method that coordinates the entire budget deal matching flow
   */
  async orchestrateBudgetDeals(request: BudgetDealOrchestrationRequest): Promise<BudgetDealOrchestrationResult> {
    const startTime = Date.now();
    const cacheKey = `budget-deals:${request.userId}:${request.itineraryId || 'all'}:${request.trigger}`;

    // Check cache unless force refresh is requested
    if (!request.forceRefresh) {
      const cachedResult = await this.cacheManager.get<BudgetDealOrchestrationResult>(cacheKey);
      if (cachedResult) {
        this.logger.log(`Using cached budget deal orchestration for user ${request.userId}`);
        return { ...cachedResult, cacheUsed: true };
      }
    }

    try {
      // Step 1: Get user's budget constraints
      const budgetConstraints = await this.getBudgetConstraints(request.userId, request.itineraryId);

      // Step 2: Get user's preferences (mock for now)
      const userPreferences = await this.getUserPreferences(request.userId);

      // Step 3: Create deal matching request
      const matchingRequest: DealMatchingRequest = {
        userId: request.userId,
        budgetConstraints,
        userPreferences,
        filters: {
          location: request.location || budgetConstraints.location,
        },
        limit: 50,
        minRelevanceScore: 50
      };

      // Step 4: Execute deal matching
      const matchingResult = await this.dealMatchingService.findMatchingDeals(matchingRequest);

      // Step 5: Send notifications for matching deals
      const notificationsSent = await this.sendDealNotifications(
        request.userId,
        matchingResult.topRecommendations,
        request.trigger
      );

      // Step 6: Calculate budget analysis
      const budgetAnalysis = this.calculateBudgetAnalysis(budgetConstraints, matchingResult);

      const result: BudgetDealOrchestrationResult = {
        success: true,
        dealsFound: matchingResult.deals.length,
        notificationsSent,
        budgetAnalysis,
        topDeals: matchingResult.topRecommendations,
        processingTime: Date.now() - startTime,
        cacheUsed: false
      };

      // Cache result for 1 hour
      await this.cacheManager.set(cacheKey, result, 60 * 60 * 1000);

      this.logger.log(`Budget deal orchestration completed for user ${request.userId}: ${matchingResult.deals.length} deals found, ${notificationsSent} notifications sent`);
      return result;

    } catch (error) {
      this.logger.error(`Error in budget deal orchestration for user ${request.userId}:`, error);

      return {
        success: false,
        dealsFound: 0,
        notificationsSent: 0,
        budgetAnalysis: {
          totalBudget: 0,
          remainingBudget: 0,
          recommendedSavings: 0,
          dealCoverage: 0
        },
        topDeals: [],
        processingTime: Date.now() - startTime,
        cacheUsed: false
      };
    }
  }

  /**
   * Get budget constraints for a user
   */
  private async getBudgetConstraints(userId: string, itineraryId?: string): Promise<any> {
    try {
      if (itineraryId) {
        // Get budget breakdown for specific itinerary
        const breakdown = await this.budgetService.calculateBudgetBreakdown(itineraryId);
        return {
          totalBudget: breakdown.totalEstimated,
          dailyBudget: breakdown.totalEstimated / (breakdown.days || 1),
          categoryBudgets: {
            dining: breakdown.estimated.food, // Use actual food estimate
            accommodation: breakdown.estimated.accommodation,
            transportation: breakdown.estimated.transport,
            activities: breakdown.estimated.activities,
            miscellaneous: breakdown.estimated.miscellaneous
          },
          diningBudgetPerHour: 50000, // 50k IDR per hour for dining
          location: 'Surabaya', // Default location
          tripDuration: breakdown.days || 3
        };
      } else {
        // Get all user budgets and use the most recent/active one
        const budgets = await this.budgetService.findAll(userId);
        if (budgets.length === 0) {
          // Return default budget constraints
          return {
            totalBudget: 2000000, // 2M IDR default
            dailyBudget: 200000, // 200k per day
            categoryBudgets: {
              dining: 400000,
              accommodation: 600000,
              transportation: 400000,
              activities: 400000,
              miscellaneous: 200000
            },
            diningBudgetPerHour: 50000,
            location: 'Surabaya',
            tripDuration: 7
          };
        }

        // Use the first budget (most recent)
        const budget = budgets[0];
        const dailyBudget = budget.totalBudget / 7; // Assume 7 days

        return {
          totalBudget: budget.totalBudget,
          dailyBudget,
          categoryBudgets: {
            dining: dailyBudget * 2,
            accommodation: dailyBudget * 3,
            transportation: dailyBudget * 2,
            activities: dailyBudget * 2,
            miscellaneous: dailyBudget
          },
          diningBudgetPerHour: 50000,
          location: 'Surabaya', // Would be derived from itinerary
          tripDuration: 7
        };
      }
    } catch (error) {
      this.logger.error(`Error getting budget constraints for user ${userId}:`, error);
      // Return default constraints
      return {
        totalBudget: 2000000,
        dailyBudget: 200000,
        categoryBudgets: {
          dining: 400000,
          accommodation: 600000,
          transportation: 400000,
          activities: 400000,
          miscellaneous: 200000
        },
        diningBudgetPerHour: 50000,
        location: 'Surabaya',
        tripDuration: 7
      };
    }
  }

  /**
   * Get user preferences for deal matching
   */
  private async getUserPreferences(userId: string): Promise<any> {
    // In production, this would fetch from user preferences database
    // For now, return default preferences
    return {
      preferredCategories: ['dining', 'accommodation', 'activities'],
      priceSensitivity: 'medium',
      dealTypes: ['discount', 'bundle', 'flash'],
      preferredLocations: ['Surabaya', 'Malang', 'Batu'],
      diningStyle: 'moderate',
      accommodationType: 'moderate'
    };
  }

  /**
   * Send notifications for matching deals
   */
  private async sendDealNotifications(
    userId: string,
    deals: ScoredDeal[],
    trigger: string
  ): Promise<number> {
    if (deals.length === 0) return 0;

    try {
      const notifications = await this.dealNotificationService.notifyMatchingDeals(
        userId,
        deals,
        trigger as any
      );

      return notifications.length;
    } catch (error) {
      this.logger.error(`Error sending deal notifications for user ${userId}:`, error);
      return 0;
    }
  }

  /**
   * Calculate budget analysis based on matching deals
   */
  private calculateBudgetAnalysis(budgetConstraints: any, matchingResult: DealMatchingResult): BudgetDealOrchestrationResult['budgetAnalysis'] {
    const totalPotentialSavings = matchingResult.budgetAnalysis.totalSavings;
    const remainingBudget = budgetConstraints.totalBudget - (budgetConstraints.totalBudget * 0.1); // Assume 10% already spent

    // Calculate what percentage of remaining budget could be covered by deals
    const dealCoverage = remainingBudget > 0 ? (totalPotentialSavings / remainingBudget) * 100 : 0;

    return {
      totalBudget: budgetConstraints.totalBudget,
      remainingBudget,
      recommendedSavings: Math.min(totalPotentialSavings, remainingBudget * 0.3), // Recommend up to 30% savings
      dealCoverage: Math.min(dealCoverage, 100)
    };
  }

  /**
   * Trigger budget deal orchestration when budget is updated
   */
  async onBudgetUpdate(userId: string, itineraryId?: string): Promise<BudgetDealOrchestrationResult> {
    return this.orchestrateBudgetDeals({
      userId,
      itineraryId,
      trigger: 'budget_update',
      forceRefresh: true
    });
  }

  /**
   * Trigger budget deal orchestration when itinerary changes
   */
  async onItineraryChange(userId: string, itineraryId: string): Promise<BudgetDealOrchestrationResult> {
    return this.orchestrateBudgetDeals({
      userId,
      itineraryId,
      trigger: 'itinerary_change',
      forceRefresh: true
    });
  }

  /**
   * Scheduled check for new deals (could be called by a cron job)
   */
  async scheduledDealCheck(userId: string): Promise<BudgetDealOrchestrationResult> {
    return this.orchestrateBudgetDeals({
      userId,
      trigger: 'scheduled_check'
    });
  }

  /**
   * Manual request for deal recommendations
   */
  async manualDealRequest(
    userId: string,
    location?: string,
    itineraryId?: string
  ): Promise<BudgetDealOrchestrationResult> {
    return this.orchestrateBudgetDeals({
      userId,
      itineraryId,
      trigger: 'manual_request',
      location,
      forceRefresh: true
    });
  }

  /**
   * Clear orchestration cache for a user
   */
  async clearUserCache(userId: string): Promise<void> {
    // This would need to be implemented to clear all cache keys for the user
    this.logger.log(`Cache clearing requested for budget deal orchestration - user ${userId}`);
  }
}