import { Controller, Get, Query } from '@nestjs/common';
import { VisualizationEngineService } from './visualization-engine.service';

@Controller('visualization-engine')
export class VisualizationEngineController {
  constructor(private readonly visualizationEngineService: VisualizationEngineService) {}

  @Get('burn-rate-charts')
  async getBurnRateCharts(
    @Query('userId') userId: string,
    @Query('budgetId') budgetId: string,
  ) {
    return this.visualizationEngineService.generateBurnRateCharts(userId, budgetId);
  }

  @Get('custom-chart')
  async getCustomChart(
    @Query('userId') userId: string,
    @Query('chartType') chartType: string,
    @Query('dataSource') dataSource: string,
    @Query('timeRange') timeRange: number = 30,
  ) {
    return this.visualizationEngineService.generateCustomChart(userId, chartType, dataSource, timeRange);
  }
}