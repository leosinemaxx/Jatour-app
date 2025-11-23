import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { DealMatchingService, DealMatchingRequest, DealMatchingResult, ScoredDeal } from './deal-matching.service';

@Controller('deal-matching')
export class DealMatchingController {
  constructor(
    private readonly dealMatchingService: DealMatchingService,
  ) {}

  @Post('match')
  async matchDeals(@Body() request: DealMatchingRequest): Promise<DealMatchingResult> {
    return this.dealMatchingService.findMatchingDeals(request);
  }

  @Get('category/:category')
  async getCategoryDeals(
    @Param('category') category: string,
    @Query('userId') userId: string,
    @Query('budgetConstraints') budgetConstraints: string,
    @Query('userPreferences') userPreferences: string,
    @Query('limit') limit?: string,
  ): Promise<ScoredDeal[]> {
    const parsedBudgetConstraints = JSON.parse(budgetConstraints);
    const parsedUserPreferences = JSON.parse(userPreferences);

    return this.dealMatchingService.getCategoryRecommendations(
      userId,
      category,
      parsedBudgetConstraints,
      parsedUserPreferences,
      limit ? parseInt(limit) : 10
    );
  }

  @Post('budget-optimized')
  async getBudgetOptimizedDeals(
    @Body('userId') userId: string,
    @Body('budgetConstraints') budgetConstraints: any,
    @Body('userPreferences') userPreferences: any,
    @Body('targetSavings') targetSavings: number,
  ): Promise<ScoredDeal[]> {
    return this.dealMatchingService.getBudgetOptimizedDeals(
      userId,
      budgetConstraints,
      userPreferences,
      targetSavings
    );
  }

  @Post('clear-cache/:userId')
  async clearUserCache(@Param('userId') userId: string): Promise<{ success: boolean }> {
    await this.dealMatchingService.clearUserCache(userId);
    return { success: true };
  }
}