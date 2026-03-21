import { Module } from '@nestjs/common';
import { WorkOrderService } from './work-order.service';
import { WorkOrderController } from './work-order.controller';

@Module({
  controllers: [WorkOrderController],
  providers: [WorkOrderService],
  exports: [WorkOrderService],
})
export class WorkOrderModule {}
