import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class BulkStockEntryItemDto {
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

  @ApiPropertyOptional({ example: 'Extra unit ordered due to demand' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkStockEntryDto {
  @ApiProperty({
    type: [BulkStockEntryItemDto],
    description: 'Array of stock entry items to create in a single transaction',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkStockEntryItemDto)
  entries!: BulkStockEntryItemDto[];

  @ApiPropertyOptional({
    example: '2026-03-21T00:00:00.000Z',
    description: 'Shared entry date applied to all items (defaults to now)',
  })
  @IsOptional()
  @IsDateString()
  date?: Date;
}
