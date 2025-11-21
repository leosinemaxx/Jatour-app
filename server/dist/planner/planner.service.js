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
exports.PlannerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PlannerService = class PlannerService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getRecommendations(userId, filters) {
        const destinations = await this.prisma.destination.findMany({
            where: {
                ...(filters?.city && { city: filters.city }),
                ...(filters?.interests && filters.interests.length > 0 && {
                    category: { in: filters.interests },
                }),
            },
            include: {
                reviews: {
                    select: {
                        rating: true,
                    },
                },
            },
        });
        const scoredDestinations = destinations.map((dest) => {
            const avgRating = dest.reviews.length > 0
                ? dest.reviews.reduce((sum, r) => sum + r.rating, 0) / dest.reviews.length
                : dest.rating;
            let score = avgRating * 2;
            if (dest.featured) {
                score += 1;
            }
            if (filters?.budget) {
                const priceMatch = this.calculatePriceMatch(dest.priceRange, filters.budget);
                score += priceMatch;
            }
            return {
                ...dest,
                recommendationScore: score,
            };
        });
        return scoredDestinations
            .sort((a, b) => b.recommendationScore - a.recommendationScore)
            .slice(0, 10);
    }
    async calculateOptimalRoute(destinationIds, startLocation) {
        const destinations = await this.prisma.destination.findMany({
            where: {
                id: { in: destinationIds },
            },
        });
        if (destinations.length === 0) {
            return [];
        }
        const route = [];
        const unvisited = [...destinations];
        let current = unvisited[0];
        if (startLocation) {
            current = this.findNearestDestination(startLocation, unvisited);
        }
        route.push(current);
        unvisited.splice(unvisited.indexOf(current), 1);
        while (unvisited.length > 0) {
            const currentCoords = typeof current.coordinates === 'string'
                ? JSON.parse(current.coordinates)
                : current.coordinates;
            const nearest = this.findNearestDestination(currentCoords, unvisited);
            route.push(nearest);
            unvisited.splice(unvisited.indexOf(nearest), 1);
            current = nearest;
        }
        return route;
    }
    findNearestDestination(location, destinations) {
        let nearest = destinations[0];
        let minDistance = this.calculateDistance(location.lat, location.lng, nearest.coordinates.lat, nearest.coordinates.lng);
        for (const dest of destinations) {
            const coords = dest.coordinates;
            const distance = this.calculateDistance(location.lat, location.lng, coords.lat, coords.lng);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = dest;
            }
        }
        return nearest;
    }
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLng = ((lng2 - lng1) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLng / 2) *
                Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    calculatePriceMatch(priceRange, budget) {
        if (!priceRange)
            return 0;
        const priceMap = {
            budget: 500000,
            moderate: 1500000,
            luxury: 5000000,
        };
        const rangePrice = priceMap[priceRange.toLowerCase()] || 1000000;
        const ratio = budget / rangePrice;
        if (ratio >= 1)
            return 1;
        if (ratio >= 0.7)
            return 0.5;
        return 0;
    }
};
exports.PlannerService = PlannerService;
exports.PlannerService = PlannerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PlannerService);
//# sourceMappingURL=planner.service.js.map