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
        images: string[];
        rating: number;
        priceRange: string | null;
        coordinates: import("@prisma/client/runtime/library").JsonValue;
        address: string | null;
        openingHours: string | null;
        contact: string | null;
        website: string | null;
        featured: boolean;
        accessibilityFeatures: import("@prisma/client/runtime/library").JsonValue | null;
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
        images: string[];
        rating: number;
        priceRange: string | null;
        coordinates: import("@prisma/client/runtime/library").JsonValue;
        address: string | null;
        openingHours: string | null;
        contact: string | null;
        website: string | null;
        featured: boolean;
        accessibilityFeatures: import("@prisma/client/runtime/library").JsonValue | null;
        disabledFriendly: boolean;
    }[]>;
    private findNearestDestination;
    private calculateDistance;
    private calculatePriceMatch;
}
