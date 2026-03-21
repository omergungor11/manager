import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, IsUUID, Min } from 'class-validator';

export class StockAdjustmentDto {
  @ApiProperty({ example: 'uuid-of-product', format: 'uuid', description: 'Product to adjust' })
  @IsNotEmpty()
  @IsUUID()
  productId!: string;

  @ApiProperty({ example: 42, description: 'Physical count result — the actual quantity on the shelf' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  actualQuantity!: number;

  @ApiProperty({ example: 'Annual physical stock count', description: 'Reason for the adjustment' })
  @IsNotEmpty()
  @IsString()
  reason!: string;
}
