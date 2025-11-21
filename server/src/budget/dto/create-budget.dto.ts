import { IsString, IsNumber, IsOptional, IsObject } from 'class-validator';

export class CreateBudgetDto {
  @IsString()
  userId: string;

  @IsString()
  @IsOptional()
  itineraryId?: string;

  @IsNumber()
  totalBudget: number;

  @IsNumber()
  @IsOptional()
  spent?: number;

  @IsObject()
  @IsOptional()
  categories?: {
    accommodation?: number;
    food?: number;
    transport?: number;
    activities?: number;
    miscellaneous?: number;
  };
}

