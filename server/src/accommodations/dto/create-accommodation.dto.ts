import { IsString, IsNumber, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class CreateAccommodationDto {
  @IsString()
  name: string;

  @IsString()
  city: string;

  @IsString()
  province: string;

  @IsString()
  type: string; // hotel, hostel, villa, resort, homestay, budget-lodge

  @IsString()
  category: string; // luxury, moderate, budget

  @IsString()
  description: string;

  @IsString()
  image: string;

  @IsString()
  images: string; // JSON string

  @IsOptional()
  @IsNumber()
  rating?: number;

  @IsString()
  priceRange: string; // budget, moderate, luxury

  @IsString()
  coordinates: string; // JSON string

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsString()
  amenities: string; // JSON string

  @IsOptional()
  @IsNumber()
  capacity?: number;

  @IsOptional()
  @IsBoolean()
  breakfast?: boolean;

  @IsOptional()
  @IsString()
  checkInTime?: string;

  @IsOptional()
  @IsString()
  checkOutTime?: string;

  @IsOptional()
  @IsString()
  cancellationPolicy?: string;

  @IsOptional()
  @IsNumber()
  totalRooms?: number;

  @IsString()
  availability: string; // JSON string

  @IsOptional()
  @IsString()
  bookingUrl?: string;
}
