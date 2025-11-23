import { Module } from '@nestjs/common';
import { DashboardAggregationService } from './dashboard-aggregation.service';
import { DashboardAggregationController } from './dashboard-aggregation.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BurnRateModule } from '../burn-rate/burn-rate.module';
import { ExpensesModule } from '../expenses/expenses.module';
import { BudgetModule } from '../budget/budget.module';

@Module({
  imports: [
    PrismaModule,
    BurnRateModule,
    ExpensesModule,
    BudgetModule,
  ],
  controllers: [DashboardAggregationController],
  providers: [DashboardAggregationService],
  exports: [DashboardAggregationService],
})
export class DashboardAggregationModule {}