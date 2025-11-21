import { PrismaService } from '../prisma/prisma.service';
export declare class PlannerService {
    private prisma;
    constructor(prisma: PrismaService);
    getRecommendations(userId: string, filters?: {
        budget?: number;
        days?: number;
        interests?: string[];
        city?: string;
    }): Promise<{
        recommendationScore: number;
        reviews: {
            rating: number;
        }[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        city: string;
        province: string;
        category: string;
        description: string;
        image: string;
        images: string | null;
        rating: number | null;
        priceRange: string | null;
        coordinates: string;
        address: string | null;
        openingHours: string | null;
        contact: string | null;
        website: string | null;
        featured: boolean;
        disabledFriendly: boolean;
    }[]>;
    calculateOptimalRoute(destinationIds: string[], startLocation?: {
        lat: number;
        lng: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        city: string;
        province: string;
        category: string;
        description: string;
        image: string;
        images: string | null;
        rating: number | null;
        priceRange: string | null;
        coordinates: string;
        address: string | null;
        openingHours: string | null;
        contact: string | null;
        website: string | null;
        featured: boolean;
        disabledFriendly: boolean;
    }[]>;
    private findNearestDestination;
    private calculateDistance;
    private calculatePriceMatch;
}
