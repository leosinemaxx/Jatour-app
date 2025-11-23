import { Module } from '@nestjs/common';
import { GeospatialDealEngineService } from './geospatial-deal-engine.service';

@Module({
  providers: [GeospatialDealEngineService],
  exports: [GeospatialDealEngineService],
})
export class GeospatialDealEngineModule {}