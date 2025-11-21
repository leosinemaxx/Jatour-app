import { IsString, IsNumber, IsBoolean, IsOptional, IsArray, IsObject } from 'class-validator';

export class CreateDestinationDto {
  @IsString()
  name: string;

  @IsString()
  city: string;

  @IsString()
  @IsOptional()
  province?: string;

  @IsString()
  category: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  description: string;

  @IsString()
  image: string;

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsNumber()
  @IsOptional()
  rating?: number;

  @IsString()
  @IsOptional()
  priceRange?: string;

  @IsObject()
  coordinates: { lat: number; lng: number };

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  openingHours?: string;

  @IsString()
  @IsOptional()
  contact?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsBoolean()
  @IsOptional()
  featured?: boolean;
}

