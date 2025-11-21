import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { DestinationsModule } from './destinations/destinations.module';
import { ItinerariesModule } from './itineraries/itineraries.module';
import { PlannerModule } from './planner/planner.module';
import { BudgetModule } from './budget/budget.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UsersModule,
    DestinationsModule,
    ItinerariesModule,
    PlannerModule,
    BudgetModule,
  ],
})
export class AppModule {}

