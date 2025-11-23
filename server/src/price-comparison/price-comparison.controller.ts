import { Controller, Get, Query, Body, Post, ValidationPipe } from '@nestjs/common';
import { PriceComparisonService } from './price-comparison.service';
import { HotelComparisonRequestDto } from './dto/hotel-comparison.dto';
import { TransportationComparisonRequestDto } from './dto/transportation-comparison.dto';
import { DiningComparisonRequestDto } from './dto/dining-comparison.dto';

@Controller('price-comparison')
export class PriceComparisonController {
  constructor(private readonly priceComparisonService: PriceComparisonService) {}

  @Post('hotels')
  async compareHotels(@Body(ValidationPipe) request: HotelComparisonRequestDto) {
    return this.priceComparisonService.compareHotels(request);
  }

  @Post('transportation')
  async compareTransportation(@Body(ValidationPipe) request: TransportationComparisonRequestDto) {
    return this.priceComparisonService.compareTransportation(request);
  }

  @Post('dining')
  async compareDining(@Body(ValidationPipe) request: DiningComparisonRequestDto) {
    return this.priceComparisonService.compareDining(request);
  }

  // Alternative GET endpoints for simple queries
  @Get('hotels')
  async getHotelComparison(
    @Query('location') location: string,
    @Query('checkInDate') checkInDate: string,
    @Query('checkOutDate') checkOutDate: string,
    @Query('guests') guests: number,
    @Query('budget') budget?: number,
  ) {
    const request: HotelComparisonRequestDto = {
      location,
      checkInDate,
      checkOutDate,
      guests: guests || 1,
      budget: budget ? Number(budget) : undefined,
    };
    return this.priceComparisonService.compareHotels(request);
  }

  @Get('transportation')
  async getTransportationComparison(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('date') date?: string,
    @Query('passengers') passengers?: number,
    @Query('vehicleType') vehicleType?: 'car' | 'motorcycle' | 'taxi' | 'bus',
    @Query('budget') budget?: number,
  ) {
    const request: TransportationComparisonRequestDto = {
      from,
      to,
      date,
      passengers: passengers ? Number(passengers) : undefined,
      vehicleType,
      budget: budget ? Number(budget) : undefined,
    };
    return this.priceComparisonService.compareTransportation(request);
  }

  @Get('dining')
  async getDiningComparison(
    @Query('location') location: string,
    @Query('cuisine') cuisine?: string,
    @Query('priceRange') priceRange?: 'budget' | 'moderate' | 'premium',
    @Query('guests') guests?: number,
    @Query('budget') budget?: number,
  ) {
    const request: DiningComparisonRequestDto = {
      location,
      cuisine,
      priceRange,
      guests: guests ? Number(guests) : undefined,
      budget: budget ? Number(budget) : undefined,
    };
    return this.priceComparisonService.compareDining(request);
  }
}