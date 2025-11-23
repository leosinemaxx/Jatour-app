import { Module } from '@nestjs/common';
import { VisualizationEngineService } from './visualization-engine.service';
import { VisualizationEngineController } from './visualization-engine.controller';
import { BurnRateModule } from '../burn-rate/burn-rate.module';
import { DashboardAggregationModule } from '../dashboard-aggregation/dashboard-aggregation.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    BurnRateModule,
    DashboardAggregationModule,
    PrismaModule,
  ],
  controllers: [VisualizationEngineController],
  providers: [VisualizationEngineService],
  exports: [VisualizationEngineService],
})
export class VisualizationEngineModule {}