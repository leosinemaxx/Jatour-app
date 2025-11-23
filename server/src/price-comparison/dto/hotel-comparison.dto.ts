import { IsString, IsDateString, IsNumber, IsOptional, IsArray, Min, Max } from 'class-validator';

export class HotelComparisonRequestDto {
  @IsString()
  location: string;

  @IsDateString()
  checkInDate: string;

  @IsDateString()
  checkOutDate: string;

  @IsNumber()
  @Min(1)
  guests: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  rooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @IsOptional()
  preferences?: {
    amenities?: string[];
    rating?: number;
    propertyType?: string[];
  };
}

export class HotelComparisonResultDto {
  id: string;
  name: string;
  provider: 'Agoda' | 'Booking.com' | 'Mock';
  price: number;
  originalPrice?: number;
  currency: string;
  rating: number;
  reviewCount: number;
  image: string;
  address: string;
  amenities: string[];
  roomType: string;
  cancellationPolicy: string;
  breakfastIncluded: boolean;
  distanceFromCenter?: number;
  bookingUrl?: string;
  score: number;
}