import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { DestinationsModule } from './destinations/destinations.module';
import { ItinerariesModule } from './itineraries/itineraries.module';
import { PlannerModule } from './planner/planner.module';
import { BudgetModule } from './budget/budget.module';
import { AccommodationsModule } from './accommodations/accommodations.module';
import { ExpensesModule } from './expenses/expenses.module';
import { PriceComparisonModule } from './price-comparison/price-comparison.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { GoalsModule } from './goals/goals.module';
import { BurnRateModule } from './burn-rate/burn-rate.module';
import { DashboardAggregationModule } from './dashboard-aggregation/dashboard-aggregation.module';
import { VisualizationEngineModule } from './visualization-engine/visualization-engine.module';
import { AlertSystemModule } from './alert-system/alert-system.module';
import { MerchantIntegrationModule } from './merchant-integration/merchant-integration.module';
import { RelevanceScoringModule } from './relevance-scoring/relevance-scoring.module';
import { DealMatchingModule } from './deal-matching/deal-matching.module';
import { DealNotificationModule } from './deal-notification/deal-notification.module';
import { BudgetDealOrchestratorModule } from './budget-deal-orchestrator/budget-deal-orchestrator.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => ({
        ttl: 300000, // 5 minutes
        max: 100,
      }),
    }),
    PrismaModule,
    UsersModule,
    DestinationsModule,
    ItinerariesModule,
    PlannerModule,
    BudgetModule,
    AccommodationsModule,
    ExpensesModule,
    PriceComparisonModule,
    AnalyticsModule,
    GoalsModule,
    BurnRateModule,
    DashboardAggregationModule,
    VisualizationEngineModule,
    AlertSystemModule,
    MerchantIntegrationModule,
    RelevanceScoringModule,
    DealMatchingModule,
    DealNotificationModule,
    BudgetDealOrchestratorModule,
  ],
})
export class AppModule {}
