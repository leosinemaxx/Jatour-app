import { Module } from '@nestjs/common';
import { RelevanceScoringService } from './relevance-scoring.service';
import { RelevanceScoringController } from './relevance-scoring.controller';

@Module({
  providers: [RelevanceScoringService],
  controllers: [RelevanceScoringController],
  exports: [RelevanceScoringService],
})
export class RelevanceScoringModule {}