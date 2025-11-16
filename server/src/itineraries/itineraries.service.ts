import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';

@Injectable()
export class ItinerariesService {
  constructor(private prisma: PrismaService) {}

  create(createItineraryDto: CreateItineraryDto) {
    return this.prisma.itinerary.create({
      data: {
        ...createItineraryDto,
        startDate: new Date(createItineraryDto.startDate),
        endDate: new Date(createItineraryDto.endDate),
      },
      include: {
        destinations: {
          include: {
            destination: true,
          },
        },
      },
    });
  }

  findAll(userId?: string) {
    return this.prisma.itinerary.findMany({
      where: userId ? { userId } : undefined,
      include: {
        destinations: {
          include: {
            destination: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.itinerary.findUnique({
      where: { id },
      include: {
        destinations: {
          include: {
            destination: true,
          },
          orderBy: { order: 'asc' },
        },
        days: {
          orderBy: { dayNumber: 'asc' },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        budgetPlan: true,
      },
    });
  }

  update(id: string, updateItineraryDto: UpdateItineraryDto) {
    const data: any = { ...updateItineraryDto };
    
    if (updateItineraryDto.startDate) {
      data.startDate = new Date(updateItineraryDto.startDate);
    }
    if (updateItineraryDto.endDate) {
      data.endDate = new Date(updateItineraryDto.endDate);
    }

    return this.prisma.itinerary.update({
      where: { id },
      data,
      include: {
        destinations: {
          include: {
            destination: true,
          },
        },
      },
    });
  }

  remove(id: string) {
    return this.prisma.itinerary.delete({
      where: { id },
    });
  }
}

