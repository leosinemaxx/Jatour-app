import { Controller, Post, Body, Query } from '@nestjs/common';
import { RelevanceScoringService, BudgetConstraints, UserPreferences, ScoredDeal } from './relevance-scoring.service';

@Controller('relevance-scoring')
export class RelevanceScoringController {
  constructor(
    private readonly relevanceScoringService: RelevanceScoringService,
  ) {}

  @Post('score-deals')
  async scoreDeals(
    @Body('deals') deals: any[],
    @Body('budgetConstraints') budgetConstraints: BudgetConstraints,
    @Body('userPreferences') userPreferences: UserPreferences,
    @Query('minScore') minScore?: string,
    @Query('limit') limit?: string,
  ): Promise<ScoredDeal[]> {
    let scoredDeals = await this.relevanceScoringService.scoreDealsForUser(
      deals,
      budgetConstraints,
      userPreferences
    );

    // Apply filters if provided
    if (minScore) {
      scoredDeals = this.relevanceScoringService.filterDealsByRelevance(scoredDeals, parseInt(minScore));
    }

    if (limit) {
      scoredDeals = this.relevanceScoringService.getTopDeals(scoredDeals, parseInt(limit));
    }

    return scoredDeals;
  }
}