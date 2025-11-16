import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetService {
  constructor(private prisma: PrismaService) {}

  // Calculate budget breakdown for an itinerary
  async calculateBudgetBreakdown(itineraryId: string) {
    const itinerary = await this.prisma.itinerary.findUnique({
      where: { id: itineraryId },
      include: {
        destinations: {
          include: {
            destination: true,
          },
        },
        budgetPlan: true,
      },
    });

    if (!itinerary) {
      throw new Error('Itinerary not found');
    }

    const days = Math.ceil(
      (itinerary.endDate.getTime() - itinerary.startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Estimate costs based on destinations
    const estimatedCosts = {
      accommodation: days * 300000, // Average 300k per night
      food: days * 150000, // Average 150k per day
      transport: 500000, // Base transport cost
      activities: itinerary.destinations.length * 100000, // Average 100k per destination
      miscellaneous: days * 50000, // 50k per day for misc
    };

    const totalEstimated = Object.values(estimatedCosts).reduce((sum, cost) => sum + cost, 0);

    return {
      estimated: estimatedCosts,
      totalEstimated,
      actual: itinerary.budgetPlan || null,
      days,
    };
  }

  create(createBudgetDto: CreateBudgetDto) {
    return this.prisma.budget.create({
      data: {
        userId: createBudgetDto.userId,
        itineraryId: createBudgetDto.itineraryId,
        totalBudget: createBudgetDto.totalBudget,
        spent: createBudgetDto.spent || 0,
        categories: createBudgetDto.categories || {},
      },
    });
  }

  findAll(userId: string) {
    return this.prisma.budget.findMany({
      where: { userId },
      include: {
        itinerary: {
          include: {
            destinations: {
              include: {
                destination: true,
              },
            },
          },
        },
      },
    });
  }

  findOne(id: string) {
    return this.prisma.budget.findUnique({
      where: { id },
      include: {
        itinerary: true,
      },
    });
  }

  update(id: string, updateBudgetDto: UpdateBudgetDto) {
    const data: any = {};
    
    if (updateBudgetDto.totalBudget !== undefined) {
      data.totalBudget = updateBudgetDto.totalBudget;
    }
    if (updateBudgetDto.spent !== undefined) {
      data.spent = updateBudgetDto.spent;
    }
    if (updateBudgetDto.categories !== undefined) {
      data.categories = updateBudgetDto.categories;
    }
    if (updateBudgetDto.itineraryId !== undefined) {
      data.itineraryId = updateBudgetDto.itineraryId;
    }

    return this.prisma.budget.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.budget.delete({
      where: { id },
    });
  }
}

