import { Module } from '@nestjs/common';
import { VehicleBrandService } from './vehicle-brand.service';
import { VehicleBrandController } from './vehicle-brand.controller';

@Module({
  controllers: [VehicleBrandController],
  providers: [VehicleBrandService],
  exports: [VehicleBrandService],
})
export class VehicleBrandModule {}
