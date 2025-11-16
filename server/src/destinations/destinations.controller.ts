import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { DestinationsService } from './destinations.service';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';

@Controller('destinations')
export class DestinationsController {
  constructor(private readonly destinationsService: DestinationsService) {}

  @Post()
  create(@Body() createDestinationDto: CreateDestinationDto) {
    return this.destinationsService.create(createDestinationDto);
  }

  @Get()
  findAll(
    @Query('city') city?: string,
    @Query('category') category?: string,
    @Query('featured') featured?: string,
    @Query('search') search?: string,
  ) {
    return this.destinationsService.findAll({ city, category, featured, search });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.destinationsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDestinationDto: UpdateDestinationDto) {
    return this.destinationsService.update(id, updateDestinationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.destinationsService.remove(id);
  }
}

