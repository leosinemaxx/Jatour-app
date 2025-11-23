import { Module, forwardRef } from '@nestjs/common';
import { AlertSystemService } from './alert-system.service';
import { AlertSystemController } from './alert-system.controller';
import { BurnRateModule } from '../burn-rate/burn-rate.module';
import { ExpensesModule } from '../expenses/expenses.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    BurnRateModule,
    forwardRef(() => ExpensesModule),
    PrismaModule,
  ],
  controllers: [AlertSystemController],
  providers: [AlertSystemService],
  exports: [AlertSystemService],
})
export class AlertSystemModule {}