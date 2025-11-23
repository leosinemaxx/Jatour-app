import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ItinerariesService } from './itineraries.service';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';
import { BudgetOptimizationRequest } from '../../../lib/ml/budget-aligned-itinerary-engine';

@Controller('itineraries')
export class ItinerariesController {
  constructor(private readonly itinerariesService: ItinerariesService) {}

  @Post()
  create(@Body() createItineraryDto: CreateItineraryDto) {
    return this.itinerariesService.create(createItineraryDto);
  }

  @Get()
  findAll(@Query('userId') userId?: string) {
    return this.itinerariesService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.itinerariesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateItineraryDto: UpdateItineraryDto) {
    return this.itinerariesService.update(id, updateItineraryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.itinerariesService.remove(id);
  }

  @Post('optimize-budget')
  optimizeBudget(@Body() budgetOptimizationRequest: BudgetOptimizationRequest) {
    return this.itinerariesService.optimizeBudget(budgetOptimizationRequest);
  }
}

