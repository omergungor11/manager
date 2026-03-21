import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsUUID, Max, Min } from 'class-validator';

export class CreatePayrollDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Employee UUID',
  })
  @IsNotEmpty()
  @IsUUID()
  employeeId!: string;

  @ApiProperty({ example: 3, description: 'Month (1–12)', minimum: 1, maximum: 12 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @ApiProperty({ example: 2026, description: 'Year (e.g. 2026)' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  year!: number;
}
