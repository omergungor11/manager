import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CalculatePayrollDto {
  @ApiProperty({
    example: 25000,
    description: 'Gross salary amount to calculate payroll for',
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  grossSalary!: number;
}
