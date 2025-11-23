import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { InsightGenerationService } from './insight-generation.service';
import { SavingsOpportunityDetector } from './savings-opportunity-detector.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AnalyticsService, InsightGenerationService, SavingsOpportunityDetector],
  exports: [AnalyticsService, InsightGenerationService, SavingsOpportunityDetector],
})
export class AnalyticsModule {}