import { IsString, IsOptional, IsNumber, IsDateString, Min } from 'class-validator';

export class TransportationComparisonRequestDto {
  @IsString()
  from: string;

  @IsString()
  to: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  passengers?: number;

  @IsOptional()
  vehicleType?: 'car' | 'motorcycle' | 'taxi' | 'bus';

  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @IsOptional()
  preferences?: {
    maxDuration?: number;
    preferredProviders?: string[];
  };
}

export class TransportationComparisonResultDto {
  id: string;
  provider: 'Gojek' | 'Grab' | 'Bluebird' | 'Traveloka' | 'RedBus' | 'Mock';
  type: 'ride-hail' | 'taxi' | 'bus' | 'train' | 'plane';
  price: number;
  currency: string;
  duration: string;
  distance: number;
  vehicleType?: string;
  schedule?: string[];
  bookingUrl?: string;
  score: number;
}