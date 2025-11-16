import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';

@Injectable()
export class DestinationsService {
  constructor(private prisma: PrismaService) {}

  create(createDestinationDto: CreateDestinationDto) {
    return this.prisma.destination.create({
      data: createDestinationDto,
    });
  }

  async findAll(filters: {
    city?: string;
    category?: string;
    featured?: string;
    search?: string;
  }) {
    const where: any = {};

    if (filters.city) {
      where.city = filters.city;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.featured === 'true') {
      where.featured = true;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { city: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.destination.findMany({
      where,
      orderBy: { rating: 'desc' },
    });
  }

  async findOne(id: string) {
    const destination = await this.prisma.destination.findUnique({
      where: { id },
      include: {
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                profilePicture: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    // Calculate average rating from reviews if exists
    if (destination && destination.reviews.length > 0) {
      const avgRating = destination.reviews.reduce((sum, r) => sum + r.rating, 0) / destination.reviews.length;
      return {
        ...destination,
        rating: Math.round(avgRating * 10) / 10,
      };
    }

    return destination;
  }

  update(id: string, updateDestinationDto: UpdateDestinationDto) {
    return this.prisma.destination.update({
      where: { id },
      data: updateDestinationDto,
    });
  }

  remove(id: string) {
    return this.prisma.destination.delete({
      where: { id },
    });
  }
}

