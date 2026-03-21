import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class StockDeductionDto {
  @ApiProperty({ example: 'uuid-of-product', format: 'uuid', description: 'Product to deduct from stock' })
  @IsNotEmpty()
  @IsUUID()
  productId!: string;

  @ApiProperty({ example: 2.5, description: 'Quantity to deduct (must be greater than 0)' })
  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  quantity!: number;

  @ApiPropertyOptional({ example: 'Used during brake pad replacement', description: 'Reason for manual deduction' })
  @IsOptional()
  @IsString()
  reason?: string;
}
