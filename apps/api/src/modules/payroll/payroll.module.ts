import { Module } from '@nestjs/common';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';
import { PayrollCalculationService } from './payroll-calculation.service';
import { PayrollParamsService } from './payroll-params.service';

@Module({
  controllers: [PayrollController],
  providers: [PayrollService, PayrollCalculationService, PayrollParamsService],
  exports: [PayrollService, PayrollCalculationService, PayrollParamsService],
})
export class PayrollModule {}
