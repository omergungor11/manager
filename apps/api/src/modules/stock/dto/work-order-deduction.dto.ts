import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

class WorkOrderDeductionItemDto {
  @ApiProperty({ example: 'uuid-of-product', format: 'uuid', description: 'Product used in the work order' })
  @IsNotEmpty()
  @IsUUID()
  productId!: string;

  @ApiProperty({ example: 1.0, description: 'Quantity used (must be greater than 0)' })
  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  quantity!: number;
}

export class WorkOrderDeductionDto {
  @ApiProperty({ example: 'uuid-of-work-order', format: 'uuid', description: 'Work order this deduction belongs to' })
  @IsNotEmpty()
  @IsUUID()
  workOrderId!: string;

  @ApiProperty({
    type: [WorkOrderDeductionItemDto],
    description: 'List of products and quantities used in this work order',
    example: [
      { productId: 'uuid-of-product-1', quantity: 2 },
      { productId: 'uuid-of-product-2', quantity: 0.5 },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => WorkOrderDeductionItemDto)
  items!: WorkOrderDeductionItemDto[];
}
