import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { StockAdjustmentDto } from './stock-adjustment.dto';

export class BulkStockAdjustmentDto {
  @ApiProperty({
    type: [StockAdjustmentDto],
    description: 'Array of stock adjustments to apply in a single transaction',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockAdjustmentDto)
  items!: StockAdjustmentDto[];
}
