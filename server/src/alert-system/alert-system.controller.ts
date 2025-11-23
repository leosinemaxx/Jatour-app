import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { AlertSystemService } from './alert-system.service';

@Controller('alert-system')
export class AlertSystemController {
  constructor(private readonly alertSystemService: AlertSystemService) {}

  @Get('evaluate/:userId')
  async evaluateAlerts(
    @Param('userId') userId: string,
    @Query('budgetId') budgetId?: string,
  ) {
    return this.alertSystemService.evaluateAlerts(userId, budgetId);
  }

  @Get('active/:userId')
  async getActiveAlerts(@Param('userId') userId: string) {
    return this.alertSystemService.getActiveAlerts(userId);
  }

  @Post('resolve/:alertId')
  async resolveAlert(
    @Param('alertId') alertId: string,
    @Query('userId') userId: string,
  ) {
    await this.alertSystemService.resolveAlert(alertId, userId);
    return { message: 'Alert resolved successfully' };
  }

  @Get('statistics/:userId')
  async getAlertStatistics(@Param('userId') userId: string) {
    return this.alertSystemService.getAlertStatistics(userId);
  }

  @Post('configure/:userId')
  async configureAlertRules(
    @Param('userId') userId: string,
    @Body() rules: any[],
  ) {
    await this.alertSystemService.configureAlertRules(userId, rules);
    return { message: 'Alert rules configured successfully' };
  }
}