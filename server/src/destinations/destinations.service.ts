import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';

@Injectable()
export class DestinationsService {
  constructor(private prisma: PrismaService) {}

  create(createDestinationDto: CreateDestinationDto) {
    return this.prisma.destination.create({
      data: {
        name: createDestinationDto.name,
        city: createDestinationDto.city,
        province: createDestinationDto.province,
        category: createDestinationDto.category,
        description: createDestinationDto.description,
        image: createDestinationDto.image,
        rating: createDestinationDto.rating,
        priceRange: createDestinationDto.priceRange,
        coordinates: typeof createDestinationDto.coordinates === 'object' 
          ? JSON.stringify(createDestinationDto.coordinates) 
          : createDestinationDto.coordinates,
        address: createDestinationDto.address,
        openingHours: createDestinationDto.openingHours,
        contact: createDestinationDto.contact,
        website: createDestinationDto.website,
        featured: createDestinationDto.featured,
        disabledFriendly: false,
        images: createDestinationDto.images 
          ? JSON.stringify(createDestinationDto.images) 
          : null,
      },
    });
  }

  async findAll(filters: {
    city?: string;
    category?: string;
    featured?: string;
    search?: string;
    tags?: string[];
    themes?: string[];
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
        { province: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const destinations = await this.prisma.destination.findMany({
      where,
      orderBy: { rating: 'desc' },
    });

    // Transform JSON strings to objects for frontend compatibility
    return destinations.map(destination => ({
      ...destination,
      coordinates: destination.coordinates ? JSON.parse(destination.coordinates as string) : null,
      images: destination.images ? JSON.parse(destination.images as unknown as string || '[]') : [],
    }));
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
        coordinates: destination.coordinates ? JSON.parse(destination.coordinates as string) : null,
        images: destination.images ? JSON.parse(destination.images as string || '[]') : [],
        rating: Math.round(avgRating * 10) / 10,
      };
    }

    // Transform JSON strings to objects for frontend compatibility
    return destination ? {
      ...destination,
      coordinates: destination.coordinates ? JSON.parse(destination.coordinates as string) : null,
      images: destination.images ? JSON.parse(destination.images as string || '[]') : [],
    } : null;
  }

  update(id: string, updateDestinationDto: UpdateDestinationDto) {
    const updateData: any = {
      name: updateDestinationDto.name,
      city: updateDestinationDto.city,
      province: updateDestinationDto.province,
      category: updateDestinationDto.category,
      description: updateDestinationDto.description,
      image: updateDestinationDto.image,
      rating: updateDestinationDto.rating,
      priceRange: updateDestinationDto.priceRange,
      address: updateDestinationDto.address,
      openingHours: updateDestinationDto.openingHours,
      contact: updateDestinationDto.contact,
      website: updateDestinationDto.website,
      featured: updateDestinationDto.featured,
    };

    if (updateDestinationDto.images) {
      updateData.images = JSON.stringify(updateDestinationDto.images);
    }

    if (updateDestinationDto.coordinates) {
      if (typeof updateDestinationDto.coordinates === 'object') {
        updateData.coordinates = JSON.stringify(updateDestinationDto.coordinates);
      } else {
        updateData.coordinates = updateDestinationDto.coordinates;
      }
    }

    return this.prisma.destination.update({
      where: { id },
      data: updateData,
    });
  }

  remove(id: string) {
    return this.prisma.destination.delete({
      where: { id },
    });
  }
}
