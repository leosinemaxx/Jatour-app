import { Module } from '@nestjs/common';
import { BudgetDealOrchestratorService } from './budget-deal-orchestrator.service';
import { BudgetDealOrchestratorController } from './budget-deal-orchestrator.controller';
import { DealMatchingModule } from '../deal-matching/deal-matching.module';
import { DealNotificationModule } from '../deal-notification/deal-notification.module';
import { BudgetModule } from '../budget/budget.module';

@Module({
  imports: [DealMatchingModule, DealNotificationModule, BudgetModule],
  providers: [BudgetDealOrchestratorService],
  controllers: [BudgetDealOrchestratorController],
  exports: [BudgetDealOrchestratorService],
})
export class BudgetDealOrchestratorModule {}