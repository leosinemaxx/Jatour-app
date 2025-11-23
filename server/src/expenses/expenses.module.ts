import { Module, forwardRef } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { ExpensesGateway } from './expenses.gateway';
import { ExpenseSyncManager } from './expense-sync-manager';
import { PrismaModule } from '../prisma/prisma.module';
import { BurnRateModule } from '../burn-rate/burn-rate.module';
import { AlertSystemModule } from '../alert-system/alert-system.module';

@Module({
  imports: [
    PrismaModule,
    BurnRateModule,
    forwardRef(() => AlertSystemModule),
  ],
  controllers: [ExpensesController],
  providers: [ExpensesService, ExpensesGateway, ExpenseSyncManager],
  exports: [ExpensesService, ExpensesGateway, ExpenseSyncManager],
})
export class ExpensesModule {}