import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateStockEntryDto {
  @ApiProperty({ example: 'uuid-of-product', format: 'uuid' })
  @IsNotEmpty()
  @IsUUID()
  productId!: string;

  @ApiProperty({ example: 10.5, description: 'Quantity received' })
  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  quantity!: number;

  @ApiProperty({ example: 150.0, description: 'Unit cost (purchase price per unit)' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitCost!: number;

  @ApiPropertyOptional({ example: 'uuid-of-supplier', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional({ example: 'INV-2026-001' })
  @IsOptional()
  @IsString()
  invoiceNo?: string;

  @ApiPropertyOptional({ example: '2026-03-21T00:00:00.000Z', description: 'Entry date (defaults to now)' })
  @IsOptional()
  @IsDateString()
  date?: Date;

  @ApiPropertyOptional({ example: 'Regular monthly stock replenishment' })
  @IsOptional()
  @IsString()
  notes?: string;
}
