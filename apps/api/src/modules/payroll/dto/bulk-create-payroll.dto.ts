import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, Max, Min } from 'class-validator';

export class BulkCreatePayrollDto {
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
