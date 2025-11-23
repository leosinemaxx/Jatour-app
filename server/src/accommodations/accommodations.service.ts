import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccommodationDto } from './dto/create-accommodation.dto';
import { UpdateAccommodationDto } from './dto/update-accommodation.dto';

@Injectable()
export class AccommodationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createAccommodationDto: CreateAccommodationDto) {
    return this.prisma.accommodation.create({
      data: createAccommodationDto,
    });
  }

  findAll(filters?: {
    city?: string;
    category?: string;
    type?: string;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.city) {
      where.city = filters.city;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { city: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.accommodation.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.accommodation.findUnique({
      where: { id },
    });
  }

  findByCityAndCategory(city: string, category: string) {
    return this.prisma.accommodation.findMany({
      where: {
        city,
        category,
      },
      orderBy: { rating: 'desc' },
    });
  }

  update(id: string, updateAccommodationDto: UpdateAccommodationDto) {
    return this.prisma.accommodation.update({
      where: { id },
      data: updateAccommodationDto,
    });
  }

  remove(id: string) {
    return this.prisma.accommodation.delete({
      where: { id },
    });
  }
}
