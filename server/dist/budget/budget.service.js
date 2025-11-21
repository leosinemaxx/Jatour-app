"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BudgetService = class BudgetService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async calculateBudgetBreakdown(itineraryId) {
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
        const days = Math.ceil((itinerary.endDate.getTime() - itinerary.startDate.getTime()) / (1000 * 60 * 60 * 24));
        const estimatedCosts = {
            accommodation: days * 300000,
            food: days * 150000,
            transport: 500000,
            activities: itinerary.destinations.length * 100000,
            miscellaneous: days * 50000,
        };
        const totalEstimated = Object.values(estimatedCosts).reduce((sum, cost) => sum + cost, 0);
        return {
            estimated: estimatedCosts,
            totalEstimated,
            actual: itinerary.budgetPlan || null,
            days,
        };
    }
    create(createBudgetDto) {
        return this.prisma.budget.create({
            data: {
                userId: createBudgetDto.userId,
                itineraryId: createBudgetDto.itineraryId,
                totalBudget: createBudgetDto.totalBudget,
                spent: createBudgetDto.spent || 0,
                categories: JSON.stringify(createBudgetDto.categories || {}),
            },
        });
    }
    findAll(userId) {
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
    findOne(id) {
        return this.prisma.budget.findUnique({
            where: { id },
            include: {
                itinerary: true,
            },
        });
    }
    update(id, updateBudgetDto) {
        const data = {};
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
    remove(id) {
        return this.prisma.budget.delete({
            where: { id },
        });
    }
};
exports.BudgetService = BudgetService;
exports.BudgetService = BudgetService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BudgetService);
//# sourceMappingURL=budget.service.js.map