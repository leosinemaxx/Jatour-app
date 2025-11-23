import { Module } from '@nestjs/common';
import { MerchantIntegrationService } from './merchant-integration.service';
import { MerchantIntegrationController } from './merchant-integration.controller';

@Module({
  providers: [MerchantIntegrationService],
  controllers: [MerchantIntegrationController],
  exports: [MerchantIntegrationService],
})
export class MerchantIntegrationModule {}