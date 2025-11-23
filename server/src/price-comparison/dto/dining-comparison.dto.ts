import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class DiningComparisonRequestDto {
  @IsString()
  location: string;

  @IsOptional()
  @IsString()
  cuisine?: string;

  @IsOptional()
  priceRange?: 'budget' | 'moderate' | 'premium';

  @IsOptional()
  @IsNumber()
  @Min(1)
  guests?: number;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  time?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @IsOptional()
  preferences?: {
    dietaryRestrictions?: string[];
    ambiance?: string[];
    features?: string[];
  };
}

export class DiningComparisonResultDto {
  id: string;
  name: string;
  provider: 'Restaurant' | 'Mock';
  cuisine: string;
  priceRange: 'budget' | 'moderate' | 'premium';
  averagePrice: number;
  currency: string;
  rating: number;
  reviewCount: number;
  image: string;
  address: string;
  phone?: string;
  website?: string;
  specialties: string[];
  features: string[];
  operatingHours: { [key: string]: string };
  reservationRequired: boolean;
  bookingUrl?: string;
  score: number;
}