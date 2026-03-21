import { Module } from '@nestjs/common';
import { CustomerVehicleService } from './customer-vehicle.service';
import { CustomerVehicleController } from './customer-vehicle.controller';

@Module({
  controllers: [CustomerVehicleController],
  providers: [CustomerVehicleService],
  exports: [CustomerVehicleService],
})
export class CustomerVehicleModule {}
