import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { DealNotificationService, DealNotification, NotificationPreferences } from './deal-notification.service';

@Controller('deal-notification')
export class DealNotificationController {
  constructor(
    private readonly dealNotificationService: DealNotificationService,
  ) {}

  @Post('notify')
  async notifyMatchingDeals(
    @Body('userId') userId: string,
    @Body('deals') deals: any[],
    @Body('context') context: 'budget_update' | 'location_change' | 'scheduled_check' | 'manual_request',
  ): Promise<DealNotification[]> {
    return this.dealNotificationService.notifyMatchingDeals(userId, deals, context);
  }

  @Post('preferences/:userId')
  async updatePreferences(
    @Param('userId') userId: string,
    @Body() preferences: Partial<NotificationPreferences>,
  ): Promise<{ success: boolean }> {
    await this.dealNotificationService.updateNotificationPreferences(userId, preferences);
    return { success: true };
  }

  @Get('preferences/:userId')
  async getPreferences(@Param('userId') userId: string): Promise<NotificationPreferences> {
    return this.dealNotificationService.getUserNotificationPreferences(userId);
  }

  @Post('process-queue/:userId')
  async processQueuedNotifications(
    @Param('userId') userId: string,
    @Query('frequency') frequency: 'daily' | 'weekly' = 'daily',
  ): Promise<{ success: boolean }> {
    await this.dealNotificationService.processQueuedNotifications(userId, frequency);
    return { success: true };
  }
}