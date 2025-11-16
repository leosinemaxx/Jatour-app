import { PlannerService } from './planner.service';
export declare class PlannerController {
    private readonly plannerService;
    constructor(plannerService: PlannerService);
    getRecommendations(userId: string, budget?: string, days?: string, interests?: string, city?: string): Promise<{
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
    calculateRoute(destinationIds: string, startLat?: string, startLng?: string): Promise<{
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
}
