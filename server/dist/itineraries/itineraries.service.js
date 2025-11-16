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
exports.ItinerariesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ItinerariesService = class ItinerariesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(createItineraryDto) {
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
    findAll(userId) {
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
    findOne(id) {
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
    update(id, updateItineraryDto) {
        const data = { ...updateItineraryDto };
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
    remove(id) {
        return this.prisma.itinerary.delete({
            where: { id },
        });
    }
};
exports.ItinerariesService = ItinerariesService;
exports.ItinerariesService = ItinerariesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ItinerariesService);
//# sourceMappingURL=itineraries.service.js.map