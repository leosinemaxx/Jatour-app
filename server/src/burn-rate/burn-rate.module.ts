import { Module } from '@nestjs/common';
import { BurnRateService } from './burn-rate.service';
import { BurnRateController } from './burn-rate.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BurnRateController],
  providers: [BurnRateService],
  exports: [BurnRateService],
})
export class BurnRateModule {}