import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

const MOVEMENT_TYPES = ['IN', 'OUT', 'ADJUST'] as const;
type MovementType = (typeof MOVEMENT_TYPES)[number];

export class QueryStockDto {
  @ApiPropertyOptional({ description: 'Filter by product ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({
    description: 'Filter movements by type',
    enum: MOVEMENT_TYPES,
  })
  @IsOptional()
  @IsEnum(MOVEMENT_TYPES)
  type?: MovementType;

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
