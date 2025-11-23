import { Controller, Get, Param, Query } from '@nestjs/common';
import { BurnRateService } from './burn-rate.service';

@Controller('burn-rate')
export class BurnRateController {
  constructor(private readonly burnRateService: BurnRateService) {}

  @Get(':budgetId')
  async getBurnRate(
    @Param('budgetId') budgetId: string,
    @Query('userId') userId: string,
  ) {
    return this.burnRateService.calculateBurnRate(userId, budgetId);
  }

  @Get(':budgetId/history')
  async getBurnRateHistory(
    @Param('budgetId') budgetId: string,
    @Query('userId') userId: string,
    @Query('days') days: number = 30,
  ) {
    return this.burnRateService.getBurnRateHistory(userId, budgetId, days);
  }
}