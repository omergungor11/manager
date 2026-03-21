import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';

export type IncomeCategory = 'service' | 'product_sale' | 'other';

export const INCOME_CATEGORIES: IncomeCategory[] = [
  'service',
  'product_sale',
  'other',
];

export class QueryIncomeDto {
  @ApiPropertyOptional({
    enum: INCOME_CATEGORIES,
    description: 'Filter by income category',
  })
  @IsOptional()
  @IsEnum(INCOME_CATEGORIES)
  category?: IncomeCategory;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    example: '2026-01-01T00:00:00.000Z',
    description: 'Filter income records on or after this date',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateFrom?: Date;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    example: '2026-12-31T23:59:59.999Z',
    description: 'Filter income records on or before this date',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateTo?: Date;

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
