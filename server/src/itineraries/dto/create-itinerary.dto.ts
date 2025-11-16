import { IsString, IsDateString, IsOptional, IsNumber } from 'class-validator';

export class CreateItineraryDto {
  @IsString()
  userId: string;

  @IsString()
  title: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsNumber()
  @IsOptional()
  budget?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  thumbnail?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

