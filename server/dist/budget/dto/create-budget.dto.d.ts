export declare class CreateBudgetDto {
    userId: string;
    itineraryId?: string;
    totalBudget: number;
    spent?: number;
    categories?: {
        accommodation?: number;
        food?: number;
        transport?: number;
        activities?: number;
        miscellaneous?: number;
    };
}
