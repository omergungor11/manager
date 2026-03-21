import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class AddWorkOrderItemDto {
  @ApiProperty({ enum: ['service', 'product'], example: 'product' })
  @IsEnum(['service', 'product'])
  type!: 'service' | 'product';

  @ApiPropertyOptional({
    description: 'Required when type is service',
    example: 'uuid-of-service-definition',
  })
  @IsOptional()
  @IsUUID()
  serviceDefinitionId?: string;

  @ApiPropertyOptional({
    description: 'Required when type is product',
    example: 'uuid-of-product',
  })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty({ example: 'Air filter replacement' })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiProperty({ example: 1, minimum: 0 })
  @IsNumber()
  @Min(0)
  quantity!: number;

  @ApiProperty({ example: 75.0, minimum: 0 })
  @IsNumber()
  @Min(0)
  unitPrice!: number;
}
