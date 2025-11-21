import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
export declare class BudgetController {
    private readonly budgetService;
    constructor(budgetService: BudgetService);
    calculateBreakdown(itineraryId: string): Promise<{
        estimated: {
            accommodation: number;
            food: number;
            transport: number;
            activities: number;
            miscellaneous: number;
        };
        totalEstimated: number;
        actual: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            itineraryId: string | null;
            totalBudget: number;
            spent: number;
            categories: string;
        };
        days: number;
    }>;
    create(createBudgetDto: CreateBudgetDto): import(".prisma/client").Prisma.Prisma__BudgetClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        itineraryId: string | null;
        totalBudget: number;
        spent: number;
        categories: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    findAll(userId: string): import(".prisma/client").Prisma.PrismaPromise<({
        itinerary: {
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
            notes: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        itineraryId: string | null;
        totalBudget: number;
        spent: number;
        categories: string;
    })[]>;
    findOne(id: string): import(".prisma/client").Prisma.Prisma__BudgetClient<{
        itinerary: {
            budget: number | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            title: string;
            startDate: Date;
            endDate: Date;
            status: string;
            notes: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        itineraryId: string | null;
        totalBudget: number;
        spent: number;
        categories: string;
    }, null, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, updateBudgetDto: UpdateBudgetDto): import(".prisma/client").Prisma.Prisma__BudgetClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        itineraryId: string | null;
        totalBudget: number;
        spent: number;
        categories: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__BudgetClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        itineraryId: string | null;
        totalBudget: number;
        spent: number;
        categories: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
