import { IsNotEmpty, IsNumber, IsString, IsOptional, IsBoolean, IsDateString, IsArray } from 'class-validator';

export class CreateExpenseDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  budgetId?: string;

  @IsOptional()
  @IsString()
  itineraryId?: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string = 'IDR';

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  subcategory?: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsNotEmpty()
  @IsString()
  paymentMethod: string;

  @IsOptional()
  @IsString()
  merchant?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  receiptImage?: string;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean = false;

  @IsOptional()
  @IsString()
  recurringFrequency?: string;

  @IsOptional()
  @IsBoolean()
  isManuallyCategorized?: boolean = false;

  @IsOptional()
  @IsBoolean()
  consentGiven?: boolean = true;
}
