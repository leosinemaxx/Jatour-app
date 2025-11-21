import { ItinerariesService } from './itineraries.service';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';
export declare class ItinerariesController {
    private readonly itinerariesService;
    constructor(itinerariesService: ItinerariesService);
    create(createItineraryDto: CreateItineraryDto): import(".prisma/client").Prisma.Prisma__ItineraryClient<{
        destinations: ({
            destination: {
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
            };
        } & {
            id: string;
            destinationId: string;
            notes: string | null;
            order: number;
            itineraryId: string;
            visitDate: Date | null;
        })[];
    } & {
        budget: number | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        startDate: Date;
        endDate: Date;
        status: string;
        thumbnail: string | null;
        notes: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    findAll(userId?: string): import(".prisma/client").Prisma.PrismaPromise<({
        user: {
            email: string;
            fullName: string;
            id: string;
        };
        destinations: ({
            destination: {
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
            };
        } & {
            id: string;
            destinationId: string;
            notes: string | null;
            order: number;
            itineraryId: string;
            visitDate: Date | null;
        })[];
    } & {
        budget: number | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        startDate: Date;
        endDate: Date;
        status: string;
        thumbnail: string | null;
        notes: string | null;
    })[]>;
    findOne(id: string): import(".prisma/client").Prisma.Prisma__ItineraryClient<{
        user: {
            email: string;
            fullName: string;
            id: string;
        };
        destinations: ({
            destination: {
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
            };
        } & {
            id: string;
            destinationId: string;
            notes: string | null;
            order: number;
            itineraryId: string;
            visitDate: Date | null;
        })[];
        days: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            activities: import("@prisma/client/runtime/library").JsonValue;
            itineraryId: string;
            dayNumber: number;
            date: Date;
        }[];
        budgetPlan: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            itineraryId: string | null;
            totalBudget: number;
            spent: number;
            categories: import("@prisma/client/runtime/library").JsonValue;
        };
    } & {
        budget: number | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        startDate: Date;
        endDate: Date;
        status: string;
        thumbnail: string | null;
        notes: string | null;
    }, null, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, updateItineraryDto: UpdateItineraryDto): import(".prisma/client").Prisma.Prisma__ItineraryClient<{
        destinations: ({
            destination: {
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
            };
        } & {
            id: string;
            destinationId: string;
            notes: string | null;
            order: number;
            itineraryId: string;
            visitDate: Date | null;
        })[];
    } & {
        budget: number | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        startDate: Date;
        endDate: Date;
        status: string;
        thumbnail: string | null;
        notes: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__ItineraryClient<{
        budget: number | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        startDate: Date;
        endDate: Date;
        status: string;
        thumbnail: string | null;
        notes: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
