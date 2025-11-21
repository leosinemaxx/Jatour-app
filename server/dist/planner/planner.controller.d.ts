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
}
