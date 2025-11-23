import { Module } from '@nestjs/common';
import { GoalsGateway } from './goals.gateway';

@Module({
  providers: [GoalsGateway],
  exports: [GoalsGateway],
})
export class GoalsModule {}