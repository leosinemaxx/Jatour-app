import { Module } from '@nestjs/common';
import { DealMatchingService } from './deal-matching.service';
import { DealMatchingController } from './deal-matching.controller';
import { MerchantIntegrationModule } from '../merchant-integration/merchant-integration.module';
import { RelevanceScoringModule } from '../relevance-scoring/relevance-scoring.module';

@Module({
  imports: [MerchantIntegrationModule, RelevanceScoringModule],
  providers: [DealMatchingService],
  controllers: [DealMatchingController],
  exports: [DealMatchingService],
})
export class DealMatchingModule {}