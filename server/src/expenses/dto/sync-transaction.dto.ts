import { IsNotEmpty, IsString, IsNumber, IsOptional, IsDateString, IsBoolean } from 'class-validator';

export class SyncTransactionDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  source: string; // qris, debit_card, credit_card, e_wallet, bank_transfer

  @IsOptional()
  @IsString()
  externalId?: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string = 'IDR';

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  merchant?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: string = 'completed';

  @IsOptional()
  @IsBoolean()
  consentGiven?: boolean = true;
}