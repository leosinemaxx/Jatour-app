import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlannerService {
  constructor(private prisma: PrismaService) {}

  // Smart recommendation algorithm based on user preferences and destination data
  async getRecommendations(userId: string, filters?: {
    budget?: number;
    days?: number;
    interests?: string[];
    city?: string;
  }) {
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

    // Calculate recommendation scores
    const scoredDestinations = destinations.map((dest) => {
      const avgRating = dest.reviews.length > 0
        ? dest.reviews.reduce((sum, r) => sum + r.rating, 0) / dest.reviews.length
        : dest.rating;

      let score = avgRating * 2; // Base score from rating

      // Boost featured destinations
      if (dest.featured) {
        score += 1;
      }

      // Budget consideration (if provided)
      if (filters?.budget) {
        const priceMatch = this.calculatePriceMatch(dest.priceRange, filters.budget);
        score += priceMatch;
      }

      return {
        ...dest,
        recommendationScore: score,
      };
    });

    // Sort by recommendation score
    return scoredDestinations
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, 10); // Top 10 recommendations
  }

  // Calculate optimal route between destinations
  async calculateOptimalRoute(destinationIds: string[], startLocation?: { lat: number; lng: number }) {
    const destinations = await this.prisma.destination.findMany({
      where: {
        id: { in: destinationIds },
      },
    });

    if (destinations.length === 0) {
      return [];
    }

    // Simple nearest neighbor algorithm for route optimization
    const route: typeof destinations = [];
    const unvisited = [...destinations];

    // Start from first destination or nearest to start location
    let current = unvisited[0];
    if (startLocation) {
      current = this.findNearestDestination(startLocation, unvisited);
    }

    route.push(current);
    unvisited.splice(unvisited.indexOf(current), 1);

    // Greedy algorithm: always go to nearest unvisited destination
    while (unvisited.length > 0) {
      const currentCoords = current.coordinates as { lat: number; lng: number };
      const nearest = this.findNearestDestination(currentCoords, unvisited);
      route.push(nearest);
      unvisited.splice(unvisited.indexOf(nearest), 1);
      current = nearest;
    }

    return route;
  }

  private findNearestDestination(
    location: { lat: number; lng: number },
    destinations: any[],
  ) {
    let nearest = destinations[0];
    let minDistance = this.calculateDistance(
      location.lat,
      location.lng,
      (nearest.coordinates as { lat: number; lng: number }).lat,
      (nearest.coordinates as { lat: number; lng: number }).lng,
    );

    for (const dest of destinations) {
      const coords = dest.coordinates as { lat: number; lng: number };
      const distance = this.calculateDistance(
        location.lat,
        location.lng,
        coords.lat,
        coords.lng,
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = dest;
      }
    }

    return nearest;
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private calculatePriceMatch(priceRange: string | null | undefined, budget: number): number {
    if (!priceRange) return 0;

    const priceMap: Record<string, number> = {
      budget: 500000,
      moderate: 1500000,
      luxury: 5000000,
    };

    const rangePrice = priceMap[priceRange.toLowerCase()] || 1000000;
    const ratio = budget / rangePrice;

    if (ratio >= 1) return 1; // Budget is sufficient
    if (ratio >= 0.7) return 0.5; // Budget is close
    return 0; // Budget is too low
  }
}

