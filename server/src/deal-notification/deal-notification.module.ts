import { Module } from '@nestjs/common';
import { DealNotificationService } from './deal-notification.service';
import { DealNotificationController } from './deal-notification.controller';

@Module({
  providers: [DealNotificationService],
  controllers: [DealNotificationController],
  exports: [DealNotificationService],
})
export class DealNotificationModule {}