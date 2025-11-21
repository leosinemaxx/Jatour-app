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
                { province: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        const destinations = await this.prisma.destination.findMany({
            where,
            orderBy: { rating: 'desc' },
        });
        return destinations.map(destination => ({
            ...destination,
            coordinates: destination.coordinates ? JSON.parse(destination.coordinates) : null,
            images: destination.images ? JSON.parse(destination.images || '[]') : [],
        }));
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
                coordinates: destination.coordinates ? JSON.parse(destination.coordinates) : null,
                images: destination.images ? JSON.parse(destination.images || '[]') : [],
                rating: Math.round(avgRating * 10) / 10,
            };
        }
        return destination ? {
            ...destination,
            coordinates: destination.coordinates ? JSON.parse(destination.coordinates) : null,
            images: destination.images ? JSON.parse(destination.images || '[]') : [],
        } : null;
    }
    update(id, updateDestinationDto) {
        const updateData = {
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
            }
            else {
                updateData.coordinates = updateDestinationDto.coordinates;
            }
        }
        return this.prisma.destination.update({
            where: { id },
            data: updateData,
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