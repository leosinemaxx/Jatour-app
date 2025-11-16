import { Controller, Get, Query, Param } from '@nestjs/common';
import { PlannerService } from './planner.service';

@Controller('planner')
export class PlannerController {
  constructor(private readonly plannerService: PlannerService) {}

  @Get('recommendations/:userId')
  getRecommendations(
    @Param('userId') userId: string,
    @Query('budget') budget?: string,
    @Query('days') days?: string,
    @Query('interests') interests?: string,
    @Query('city') city?: string,
  ) {
    return this.plannerService.getRecommendations(userId, {
      budget: budget ? parseFloat(budget) : undefined,
      days: days ? parseInt(days) : undefined,
      interests: interests ? interests.split(',') : undefined,
      city,
    });
  }

  @Get('route')
  calculateRoute(
    @Query('destinations') destinationIds: string,
    @Query('startLat') startLat?: string,
    @Query('startLng') startLng?: string,
  ) {
    const ids = destinationIds.split(',');
    const startLocation = startLat && startLng
      ? { lat: parseFloat(startLat), lng: parseFloat(startLng) }
      : undefined;

    return this.plannerService.calculateOptimalRoute(ids, startLocation);
  }
}

