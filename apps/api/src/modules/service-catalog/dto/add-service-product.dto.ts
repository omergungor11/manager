import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsUUID, Min } from 'class-validator';

export class AddServiceProductDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'Product UUID to link to the service' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ example: 1, description: 'Default quantity of this product consumed per service (min 0.001)' })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  defaultQuantity!: number;
}
