import { Injectable, Logger } from '@nestjs/common';
import { MerchantDeal } from '../merchant-integration/merchant-integration.service';

export interface BudgetConstraints {
  totalBudget: number;
  dailyBudget: number;
  categoryBudgets: {
    dining: number;
    accommodation: number;
    transportation: number;
    activities: number;
    miscellaneous: number;
  };
  diningBudgetPerHour?: number; // Specific for dining deals
  location: string;
  tripDuration: number; // in days
}

export interface ScoredDeal extends MerchantDeal {
  relevanceScore: number;
  budgetAlignmentScore: number;
  categoryFitScore: number;
  locationRelevanceScore: number;
  timeRelevanceScore: number;
  userPreferenceScore: number;
  reasoning: string[];
}

export interface UserPreferences {
  preferredCategories: string[];
  priceSensitivity: 'low' | 'medium' | 'high';
  dealTypes: ('discount' | 'bundle' | 'flash' | 'loyalty')[];
  preferredLocations: string[];
  diningStyle: 'budget' | 'moderate' | 'premium';
  accommodationType: 'budget' | 'moderate' | 'luxury';
}

@Injectable()
export class RelevanceScoringService {
  private readonly logger = new Logger(RelevanceScoringService.name);

  /**
   * Score deals based on budget constraints and user preferences
   */
  async scoreDealsForUser(
    deals: MerchantDeal[],
    budgetConstraints: BudgetConstraints,
    userPreferences: UserPreferences
  ): Promise<ScoredDeal[]> {
    const scoredDeals: ScoredDeal[] = [];

    for (const deal of deals) {
      const scoredDeal = await this.scoreIndividualDeal(deal, budgetConstraints, userPreferences);
      scoredDeals.push(scoredDeal);
    }

    // Sort by relevance score (highest first)
    scoredDeals.sort((a, b) => b.relevanceScore - a.relevanceScore);

    this.logger.log(`Scored ${scoredDeals.length} deals for user with budget ${budgetConstraints.totalBudget}`);
    return scoredDeals;
  }

  /**
   * Score an individual deal based on multiple factors
   */
  private async scoreIndividualDeal(
    deal: MerchantDeal,
    budget: BudgetConstraints,
    preferences: UserPreferences
  ): Promise<ScoredDeal> {
    const reasoning: string[] = [];

    // 1. Budget Alignment Score (40% weight)
    const budgetAlignmentScore = this.calculateBudgetAlignmentScore(deal, budget);
    if (budgetAlignmentScore >= 80) reasoning.push('Excellent budget fit');
    else if (budgetAlignmentScore >= 60) reasoning.push('Good budget alignment');
    else if (budgetAlignmentScore >= 40) reasoning.push('Moderate budget fit');
    else reasoning.push('Budget constraints may be tight');

    // 2. Category Fit Score (25% weight)
    const categoryFitScore = this.calculateCategoryFitScore(deal, budget, preferences);
    if (categoryFitScore >= 80) reasoning.push('Perfect category match');
    else if (categoryFitScore >= 60) reasoning.push('Good category alignment');

    // 3. Location Relevance Score (15% weight)
    const locationRelevanceScore = this.calculateLocationRelevanceScore(deal, budget);
    if (locationRelevanceScore >= 80) reasoning.push('Ideal location match');
    else if (locationRelevanceScore >= 60) reasoning.push('Convenient location');

    // 4. Time Relevance Score (10% weight)
    const timeRelevanceScore = this.calculateTimeRelevanceScore(deal, budget);
    if (timeRelevanceScore >= 80) reasoning.push('Available during trip dates');

    // 5. User Preference Score (10% weight)
    const userPreferenceScore = this.calculateUserPreferenceScore(deal, preferences);
    if (userPreferenceScore >= 80) reasoning.push('Matches your preferences perfectly');

    // Calculate overall relevance score
    const relevanceScore = Math.round(
      budgetAlignmentScore * 0.4 +
      categoryFitScore * 0.25 +
      locationRelevanceScore * 0.15 +
      timeRelevanceScore * 0.1 +
      userPreferenceScore * 0.1
    );

    return {
      ...deal,
      relevanceScore,
      budgetAlignmentScore,
      categoryFitScore,
      locationRelevanceScore,
      timeRelevanceScore,
      userPreferenceScore,
      reasoning
    };
  }

  /**
   * Calculate how well the deal fits within budget constraints
   */
  private calculateBudgetAlignmentScore(deal: MerchantDeal, budget: BudgetConstraints): number {
    const dealPrice = deal.discountedPrice;

    // For dining deals, consider per-hour budget
    if (deal.category === 'dining' && deal.averageSpendPerHour && budget.diningBudgetPerHour) {
      const hourlyFit = (budget.diningBudgetPerHour / deal.averageSpendPerHour) * 100;
      return Math.min(100, Math.max(0, hourlyFit));
    }

    // Get category budget
    const categoryBudget = this.getCategoryBudget(deal.category, budget);
    if (!categoryBudget) return 50; // Neutral score if no category budget defined

    // Calculate what percentage of category budget this deal represents
    const budgetPercentage = (dealPrice / categoryBudget) * 100;

    // Score based on budget utilization
    if (budgetPercentage <= 10) return 100; // Excellent - very small portion of budget
    if (budgetPercentage <= 25) return 90;  // Very good
    if (budgetPercentage <= 50) return 75;  // Good
    if (budgetPercentage <= 75) return 60;  // Moderate
    if (budgetPercentage <= 100) return 40; // Tight fit
    return 20; // Over budget - poor fit
  }

  /**
   * Calculate how well the deal fits user's category preferences
   */
  private calculateCategoryFitScore(
    deal: MerchantDeal,
    budget: BudgetConstraints,
    preferences: UserPreferences
  ): number {
    let score = 50; // Base score

    // Check if category is in user's preferred categories
    if (preferences.preferredCategories.includes(deal.category)) {
      score += 30;
    }

    // Category-specific scoring
    switch (deal.category) {
      case 'dining':
        if (deal.budgetCategory === preferences.diningStyle) {
          score += 20;
        }
        break;
      case 'accommodation':
        if (deal.budgetCategory === preferences.accommodationType) {
          score += 20;
        }
        break;
    }

    // Price sensitivity adjustment
    if (preferences.priceSensitivity === 'high' && deal.discountPercentage >= 30) {
      score += 15;
    }

    return Math.min(100, score);
  }

  /**
   * Calculate location relevance
   */
  private calculateLocationRelevanceScore(deal: MerchantDeal, budget: BudgetConstraints): number {
    // Simple location matching for now
    const dealLocation = deal.location.toLowerCase();
    const budgetLocation = budget.location.toLowerCase();

    if (dealLocation.includes(budgetLocation) || budgetLocation.includes(dealLocation)) {
      return 100;
    }

    // Partial match
    const dealWords = dealLocation.split(' ');
    const budgetWords = budgetLocation.split(' ');

    const commonWords = dealWords.filter(word =>
      budgetWords.some(budgetWord =>
        budgetWord.includes(word) || word.includes(budgetWord)
      )
    );

    if (commonWords.length > 0) {
      return 70;
    }

    return 30; // Not in preferred location
  }

  /**
   * Calculate time relevance (deal validity vs trip dates)
   */
  private calculateTimeRelevanceScore(deal: MerchantDeal, budget: BudgetConstraints): number {
    const now = new Date();
    const dealEndDate = new Date(deal.validUntil);
    const daysUntilExpiry = Math.ceil((dealEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Deal should be valid for at least the trip duration
    if (daysUntilExpiry >= budget.tripDuration) {
      return 100;
    }

    // Deal valid for at least half the trip
    if (daysUntilExpiry >= budget.tripDuration / 2) {
      return 70;
    }

    // Deal expires soon
    if (daysUntilExpiry >= 1) {
      return 40;
    }

    return 10; // Deal expired or expires today
  }

  /**
   * Calculate user preference alignment
   */
  private calculateUserPreferenceScore(deal: MerchantDeal, preferences: UserPreferences): number {
    let score = 50; // Base score

    // Deal type preferences
    if (deal.discountPercentage >= 50 && preferences.dealTypes.includes('discount')) {
      score += 20;
    }

    if (deal.tags.includes('Flash') && preferences.dealTypes.includes('flash')) {
      score += 15;
    }

    // Rating preference
    if (deal.rating && deal.rating >= 4.5) {
      score += 10;
    }

    // Location preferences
    if (preferences.preferredLocations.some(loc =>
      deal.location.toLowerCase().includes(loc.toLowerCase())
    )) {
      score += 15;
    }

    return Math.min(100, score);
  }

  /**
   * Get category budget from budget constraints
   */
  private getCategoryBudget(category: string, budget: BudgetConstraints): number {
    switch (category) {
      case 'dining':
        return budget.categoryBudgets.dining;
      case 'accommodation':
        return budget.categoryBudgets.accommodation;
      case 'transportation':
        return budget.categoryBudgets.transportation;
      case 'activities':
        return budget.categoryBudgets.activities;
      default:
        return budget.categoryBudgets.miscellaneous;
    }
  }

  /**
   * Filter deals by minimum relevance score
   */
  filterDealsByRelevance(deals: ScoredDeal[], minScore: number = 50): ScoredDeal[] {
    return deals.filter(deal => deal.relevanceScore >= minScore);
  }

  /**
   * Get top N deals by relevance score
   */
  getTopDeals(deals: ScoredDeal[], limit: number = 10): ScoredDeal[] {
    return deals.slice(0, limit);
  }
}