import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdatePayrollParamDto {
  @ApiProperty({
    example: 0.06,
    description: 'New numeric value for the payroll parameter',
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  value!: number;
}
