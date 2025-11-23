import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { AccommodationsService } from './accommodations.service';
import { CreateAccommodationDto } from './dto/create-accommodation.dto';
import { UpdateAccommodationDto } from './dto/update-accommodation.dto';

@Controller('accommodations')
export class AccommodationsController {
  constructor(private readonly accommodationsService: AccommodationsService) {}

  @Post()
  create(@Body() createAccommodationDto: CreateAccommodationDto) {
    return this.accommodationsService.create(createAccommodationDto);
  }

  @Get()
  findAll(
    @Query('city') city?: string,
    @Query('category') category?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    return this.accommodationsService.findAll({
      city,
      category,
      type,
      search,
    });
  }

  @Get('city/:city/category/:category')
  findByCityAndCategory(@Param('city') city: string, @Param('category') category: string) {
    return this.accommodationsService.findByCityAndCategory(city, category);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accommodationsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAccommodationDto: UpdateAccommodationDto) {
    return this.accommodationsService.update(id, updateAccommodationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accommodationsService.remove(id);
  }
}
