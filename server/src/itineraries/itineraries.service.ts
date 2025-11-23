import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';
import { budgetAlignedItineraryEngine, BudgetOptimizationRequest, OptimizedItinerary } from '../../../lib/ml/budget-aligned-itinerary-engine';
import { smartItineraryEngine, SmartItineraryResult } from '../../../lib/ml/smart-itinerary-engine';

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

  async optimizeBudget(budgetOptimizationRequest: BudgetOptimizationRequest): Promise<OptimizedItinerary> {
    try {
      // Get the existing itinerary from database
      const existingItinerary = await this.prisma.itinerary.findUnique({
        where: { id: budgetOptimizationRequest.itineraryId },
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
          user: true,
          budgetPlan: true,
        },
      });

      if (!existingItinerary) {
        throw new Error(`Itinerary with ID ${budgetOptimizationRequest.itineraryId} not found`);
      }

      // Convert database itinerary to SmartItineraryResult format
      const originalItinerary = this.convertToSmartItineraryResult(existingItinerary);

      // Use the budget-aligned engine to optimize
      const optimizedResult = await budgetAlignedItineraryEngine.optimizeBudgetItinerary(budgetOptimizationRequest, originalItinerary);

      return optimizedResult;
    } catch (error) {
      console.error('Error optimizing budget:', error);
      throw new Error(`Budget optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private convertToSmartItineraryResult(dbItinerary: any): SmartItineraryResult {
    // Convert database format to SmartItineraryResult
    // This is a simplified conversion - in real implementation would be more comprehensive
    const days: any[] = dbItinerary.days || [];

    return {
      itinerary: days.map(day => ({
        day: day.dayNumber,
        date: day.date,
        destinations: day.destinations || [],
        totalCost: day.totalCost || 0,
        totalTime: day.totalTime || 0,
        mlConfidence: 0.5,
        optimizationReasons: []
      })),
      totalCost: days.reduce((sum, day) => sum + (day.totalCost || 0), 0),
      totalDuration: days.length,
      budgetBreakdown: dbItinerary.budgetPlan || {
        totalBudget: 0,
        categoryBreakdown: {
          accommodation: { allocated: 0, recommended: 0, savings: 0 },
          transportation: { allocated: 0, recommended: 0, savings: 0 },
          food: { allocated: 0, recommended: 0, savings: 0 },
          activities: { allocated: 0, recommended: 0, savings: 0 },
          miscellaneous: { allocated: 0, recommended: 0, savings: 0 }
        },
        optimizations: [],
        confidence: 0.5,
        reasoning: []
      },
      mlInsights: {
        personalizationScore: 0.5,
        predictedUserSatisfaction: 0.7,
        riskFactors: [],
        recommendations: []
      },
      optimization: {
        timeOptimization: 50,
        costOptimization: 30,
        satisfactionOptimization: 70,
        reasoning: ['Converted from database format']
      },
      costVariability: {
        seasonalAdjustments: [],
        demandFactors: [],
        currencyRates: [],
        appliedDiscounts: [],
        realTimeUpdates: []
      }
    };
  }
}

