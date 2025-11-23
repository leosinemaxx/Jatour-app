import { Controller, Get, Param, Query, BadRequestException } from '@nestjs/common';
import { AnalyticsService, SpendingInsightsRequest } from './analytics.service';
import { InsightGenerationService, PersonalizedInsight } from './insight-generation.service';
import { SavingsOpportunityDetector, SavingsOpportunity } from './savings-opportunity-detector.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly insightService: InsightGenerationService,
    private readonly savingsDetector: SavingsOpportunityDetector,
  ) {}

  @Get('insights/:userId')
  async getSpendingInsights(
    @Param('userId') userId: string,
    @Query('period') period: string = 'month',
    @Query('categories') categories?: string,
    @Query('compareWith') compareWith?: string,
  ) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    // Validate period
    const validPeriods = ['week', 'month', 'year', 'all'];
    if (!validPeriods.includes(period)) {
      throw new BadRequestException('Invalid period. Must be one of: week, month, year, all');
    }

    // Validate compareWith
    const validCompareWith = ['previous_period', 'similar_users', 'city_average'];
    if (compareWith && !validCompareWith.includes(compareWith)) {
      throw new BadRequestException('Invalid compareWith. Must be one of: previous_period, similar_users, city_average');
    }

    const request: SpendingInsightsRequest = {
      period: period as any,
      categories: categories ? categories.split(',') : undefined,
      compareWith: compareWith as any,
    };

    try {
      // Generate basic spending insights
      const spendingInsights = await this.analyticsService.generateSpendingInsights(userId, request);

      // Generate personalized insights
      const personalizedInsights = await this.insightService.generatePersonalizedInsights(userId, spendingInsights);

      // Detect savings opportunities
      const savingsOpportunities = await this.savingsDetector.detectSavingsOpportunities(userId);

      return {
        spendingInsights,
        personalizedInsights,
        savingsOpportunities,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating spending insights:', error);
      throw new BadRequestException('Failed to generate spending insights');
    }
  }

  @Get('savings/:userId')
  async getSavingsOpportunities(@Param('userId') userId: string): Promise<SavingsOpportunity[]> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    try {
      return await this.savingsDetector.detectSavingsOpportunities(userId);
    } catch (error) {
      console.error('Error detecting savings opportunities:', error);
      throw new BadRequestException('Failed to detect savings opportunities');
    }
  }
}