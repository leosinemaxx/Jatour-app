export declare class CreateDestinationDto {
    name: string;
    city: string;
    province?: string;
    category: string;
    tags?: string[];
    description: string;
    image: string;
    images?: string[];
    rating?: number;
    priceRange?: string;
    coordinates: {
        lat: number;
        lng: number;
    };
    address?: string;
    openingHours?: string;
    contact?: string;
    website?: string;
    featured?: boolean;
}
