import { Controller, Get, Query } from '@nestjs/common';
import { DashboardAggregationService } from './dashboard-aggregation.service';

@Controller('dashboard-aggregation')
export class DashboardAggregationController {
  constructor(private readonly dashboardAggregationService: DashboardAggregationService) {}

  @Get()
  async getDashboardData(@Query('userId') userId: string) {
    return this.dashboardAggregationService.getDashboardData(userId);
  }

  @Get('realtime')
  async getRealtimeUpdate(
    @Query('userId') userId: string,
    @Query('budgetId') budgetId?: string,
  ) {
    return this.dashboardAggregationService.getRealtimeUpdate(userId, budgetId);
  }
}