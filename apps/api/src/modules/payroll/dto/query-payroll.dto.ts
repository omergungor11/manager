import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class QueryPayrollDto {
  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Filter by employee UUID',
  })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({ example: 3, description: 'Filter by month (1–12)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional({ example: 2026, description: 'Filter by year' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  year?: number;

  @ApiPropertyOptional({
    enum: ['draft', 'approved', 'paid'],
    description: 'Filter by payroll status',
  })
  @IsOptional()
  @IsEnum(['draft', 'approved', 'paid'])
  status?: 'draft' | 'approved' | 'paid';

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
