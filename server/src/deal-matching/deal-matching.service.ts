import { Injectable, Logger, Inject } from '@nestjs/common';
import { MerchantIntegrationService, MerchantDeal } from '../merchant-integration/merchant-integration.service';
import { RelevanceScoringService, BudgetConstraints, UserPreferences, ScoredDeal } from '../relevance-scoring/relevance-scoring.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export interface DealMatchingRequest {
  userId: string;
  budgetConstraints: BudgetConstraints;
  userPreferences: UserPreferences;
  filters?: {
    categories?: string[];
    minDiscount?: number;
    maxPrice?: number;
    location?: string;
    dealTypes?: string[];
  };
  limit?: number;
  minRelevanceScore?: number;
}

export interface DealMatchingResult {
  deals: ScoredDeal[];
  totalFound: number;
  filteredCount: number;
  topRecommendations: ScoredDeal[];
  budgetAnalysis: {
    totalSavings: number;
    averageDiscount: number;
    bestValueDeals: ScoredDeal[];
  };
  metadata: {
    processingTime: number;
    cacheUsed: boolean;
    lastUpdated: Date;
  };
}

// Re-export ScoredDeal for convenience
export { ScoredDeal };

@Injectable()
export class DealMatchingService {
  private readonly logger = new Logger(DealMatchingService.name);

  constructor(
    private readonly merchantIntegrationService: MerchantIntegrationService,
    private readonly relevanceScoringService: RelevanceScoringService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Main entry point for deal matching
   */
  async findMatchingDeals(request: DealMatchingRequest): Promise<DealMatchingResult> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(request);

    // Check cache first
    const cachedResult = await this.cacheManager.get<DealMatchingResult>(cacheKey);
    if (cachedResult) {
      this.logger.log(`Using cached deal matching results for user ${request.userId}`);
      return {
        ...cachedResult,
        metadata: {
          ...cachedResult.metadata,
          cacheUsed: true
        }
      };
    }

    try {
      // Step 1: Fetch deals from merchant integration service
      const allDeals = await this.fetchDealsForUser(request);

      // Step 2: Apply initial filters
      const filteredDeals = this.applyInitialFilters(allDeals, request.filters);

      // Step 3: Score deals for relevance
      const scoredDeals = await this.relevanceScoringService.scoreDealsForUser(
        filteredDeals,
        request.budgetConstraints,
        request.userPreferences
      );

      // Step 4: Apply relevance filtering
      const relevantDeals = this.relevanceScoringService.filterDealsByRelevance(
        scoredDeals,
        request.minRelevanceScore || 40
      );

      // Step 5: Get top recommendations
      const topRecommendations = this.relevanceScoringService.getTopDeals(
        relevantDeals,
        request.limit || 20
      );

      // Step 6: Generate budget analysis
      const budgetAnalysis = this.generateBudgetAnalysis(relevantDeals);

      const result: DealMatchingResult = {
        deals: relevantDeals,
        totalFound: allDeals.length,
        filteredCount: relevantDeals.length,
        topRecommendations,
        budgetAnalysis,
        metadata: {
          processingTime: Date.now() - startTime,
          cacheUsed: false,
          lastUpdated: new Date()
        }
      };

      // Cache the result for 30 minutes
      await this.cacheManager.set(cacheKey, result, 30 * 60 * 1000);

      this.logger.log(`Found ${relevantDeals.length} relevant deals for user ${request.userId} (${topRecommendations.length} top recommendations)`);
      return result;

    } catch (error) {
      this.logger.error(`Error in deal matching for user ${request.userId}:`, error);
      throw new Error(`Deal matching failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch deals based on user context
   */
  private async fetchDealsForUser(request: DealMatchingRequest): Promise<MerchantDeal[]> {
    const { budgetConstraints, filters } = request;

    // Fetch deals from multiple sources
    const promises = [];

    // General deals
    promises.push(
      this.merchantIntegrationService.fetchDealsFromAggregator(
        filters?.location || budgetConstraints.location,
        filters?.categories?.[0], // Primary category
        budgetConstraints.totalBudget ? {
          min: 0,
          max: budgetConstraints.totalBudget * 0.5 // Deals up to 50% of total budget
        } : undefined
      )
    );

    // Dining-specific deals if dining budget per hour is specified
    if (budgetConstraints.diningBudgetPerHour) {
      promises.push(
        this.merchantIntegrationService.fetchDiningDeals(
          budgetConstraints.location,
          budgetConstraints.diningBudgetPerHour,
          2 // Assume 2 people for dining
        )
      );
    }

    // Wait for all deal sources
    const dealArrays = await Promise.all(promises);

    // Combine and deduplicate deals
    const allDeals = dealArrays.flat();
    const uniqueDeals = this.deduplicateDeals(allDeals);

    return uniqueDeals;
  }

  /**
   * Apply initial filters before scoring
   */
  private applyInitialFilters(deals: MerchantDeal[], filters?: DealMatchingRequest['filters']): MerchantDeal[] {
    if (!filters) return deals;

    return deals.filter(deal => {
      // Category filter
      if (filters.categories && filters.categories.length > 0) {
        if (!filters.categories.includes(deal.category)) return false;
      }

      // Minimum discount filter
      if (filters.minDiscount && deal.discountPercentage < filters.minDiscount) {
        return false;
      }

      // Maximum price filter
      if (filters.maxPrice && deal.discountedPrice > filters.maxPrice) {
        return false;
      }

      // Location filter
      if (filters.location && !deal.location.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }

      // Deal types filter
      if (filters.dealTypes && filters.dealTypes.length > 0) {
        const hasMatchingType = filters.dealTypes.some(type =>
          deal.tags.some(tag => tag.toLowerCase().includes(type.toLowerCase()))
        );
        if (!hasMatchingType) return false;
      }

      return true;
    });
  }

  /**
   * Remove duplicate deals based on ID and merchant
   */
  private deduplicateDeals(deals: MerchantDeal[]): MerchantDeal[] {
    const seen = new Set<string>();
    return deals.filter(deal => {
      const key = `${deal.merchantId}-${deal.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Generate budget analysis from scored deals
   */
  private generateBudgetAnalysis(deals: ScoredDeal[]): DealMatchingResult['budgetAnalysis'] {
    if (deals.length === 0) {
      return {
        totalSavings: 0,
        averageDiscount: 0,
        bestValueDeals: []
      };
    }

    const totalSavings = deals.reduce((sum, deal) => {
      const savings = deal.originalPrice - deal.discountedPrice;
      return sum + savings;
    }, 0);

    const averageDiscount = deals.reduce((sum, deal) => sum + deal.discountPercentage, 0) / deals.length;

    // Find best value deals (highest savings per IDR spent)
    const bestValueDeals = deals
      .map(deal => ({
        ...deal,
        valueRatio: (deal.originalPrice - deal.discountedPrice) / deal.discountedPrice
      }))
      .sort((a, b) => b.valueRatio - a.valueRatio)
      .slice(0, 5);

    return {
      totalSavings,
      averageDiscount,
      bestValueDeals
    };
  }

  /**
   * Generate cache key for deal matching requests
   */
  private generateCacheKey(request: DealMatchingRequest): string {
    const keyData = {
      userId: request.userId,
      budget: request.budgetConstraints,
      preferences: request.userPreferences,
      filters: request.filters,
      limit: request.limit,
      minScore: request.minRelevanceScore
    };

    // Create a hash of the key data
    const keyString = JSON.stringify(keyData);
    let hash = 0;
    for (let i = 0; i < keyString.length; i++) {
      const char = keyString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return `deal-matching:${Math.abs(hash)}`;
  }

  /**
   * Clear cache for a specific user
   */
  async clearUserCache(userId: string): Promise<void> {
    // Simplified cache clearing - in a real implementation, you'd track cache keys per user
    // For now, we'll just log that cache should be cleared
    this.logger.log(`Cache clearing requested for user ${userId} - implement proper cache key tracking in production`);
  }

  /**
   * Get deal recommendations for specific categories
   */
  async getCategoryRecommendations(
    userId: string,
    category: string,
    budgetConstraints: BudgetConstraints,
    userPreferences: UserPreferences,
    limit: number = 10
  ): Promise<ScoredDeal[]> {
    const request: DealMatchingRequest = {
      userId,
      budgetConstraints,
      userPreferences,
      filters: { categories: [category] },
      limit,
      minRelevanceScore: 50
    };

    const result = await this.findMatchingDeals(request);
    return result.topRecommendations;
  }

  /**
   * Get budget-optimized deal suggestions
   */
  async getBudgetOptimizedDeals(
    userId: string,
    budgetConstraints: BudgetConstraints,
    userPreferences: UserPreferences,
    targetSavings: number
  ): Promise<ScoredDeal[]> {
    const request: DealMatchingRequest = {
      userId,
      budgetConstraints,
      userPreferences,
      limit: 50,
      minRelevanceScore: 60
    };

    const result = await this.findMatchingDeals(request);

    // Sort by savings potential and return deals that can help reach target savings
    const sortedBySavings = result.deals
      .map(deal => ({
        ...deal,
        potentialSavings: deal.originalPrice - deal.discountedPrice
      }))
      .sort((a, b) => b.potentialSavings - a.potentialSavings);

    let accumulatedSavings = 0;
    const selectedDeals: ScoredDeal[] = [];

    for (const deal of sortedBySavings) {
      if (accumulatedSavings >= targetSavings) break;
      selectedDeals.push(deal);
      accumulatedSavings += deal.potentialSavings;
    }

    return selectedDeals;
  }
}