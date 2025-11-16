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
exports.DestinationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DestinationsService = class DestinationsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(createDestinationDto) {
        return this.prisma.destination.create({
            data: createDestinationDto,
        });
    }
    async findAll(filters) {
        const where = {};
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
    async findOne(id) {
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
        if (destination && destination.reviews.length > 0) {
            const avgRating = destination.reviews.reduce((sum, r) => sum + r.rating, 0) / destination.reviews.length;
            return {
                ...destination,
                rating: Math.round(avgRating * 10) / 10,
            };
        }
        return destination;
    }
    update(id, updateDestinationDto) {
        return this.prisma.destination.update({
            where: { id },
            data: updateDestinationDto,
        });
    }
    remove(id) {
        return this.prisma.destination.delete({
            where: { id },
        });
    }
};
exports.DestinationsService = DestinationsService;
exports.DestinationsService = DestinationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DestinationsService);
//# sourceMappingURL=destinations.service.js.map