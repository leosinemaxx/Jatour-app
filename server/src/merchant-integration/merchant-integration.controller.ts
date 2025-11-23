import { Controller, Get, Query } from '@nestjs/common';
import { MerchantIntegrationService, MerchantDeal } from './merchant-integration.service';

@Controller('merchant-integration')
export class MerchantIntegrationController {
  constructor(
    private readonly merchantIntegrationService: MerchantIntegrationService,
  ) {}

  @Get('deals')
  async getDeals(
    @Query('location') location?: string,
    @Query('category') category?: string,
    @Query('minBudget') minBudget?: string,
    @Query('maxBudget') maxBudget?: string,
  ): Promise<MerchantDeal[]> {
    const budgetRange = minBudget && maxBudget ? {
      min: parseInt(minBudget),
      max: parseInt(maxBudget)
    } : undefined;

    return this.merchantIntegrationService.fetchDealsFromAggregator(
      location,
      category,
      budgetRange
    );
  }

  @Get('dining-deals')
  async getDiningDeals(
    @Query('location') location: string,
    @Query('budgetPerHour') budgetPerHour: string,
    @Query('guestCount') guestCount?: string,
  ): Promise<MerchantDeal[]> {
    return this.merchantIntegrationService.fetchDiningDeals(
      location,
      parseInt(budgetPerHour),
      guestCount ? parseInt(guestCount) : 1
    );
  }

  @Get('merchant/:merchantId')
  async getMerchantDetails(@Query('merchantId') merchantId: string): Promise<any> {
    return this.merchantIntegrationService.getMerchantDetails(merchantId);
  }
}