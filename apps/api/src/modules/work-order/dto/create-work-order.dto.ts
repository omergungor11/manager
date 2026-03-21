import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateWorkOrderItemDto {
  @ApiProperty({ enum: ['service', 'product'], example: 'service' })
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

  @ApiProperty({ example: 'Oil change — 5W-30 synthetic' })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiProperty({ example: 1, minimum: 0 })
  @IsNumber()
  @Min(0)
  quantity!: number;

  @ApiProperty({ example: 250.0, minimum: 0 })
  @IsNumber()
  @Min(0)
  unitPrice!: number;
}

export class CreateWorkOrderDto {
  @ApiProperty({ example: 'uuid-of-customer' })
  @IsUUID()
  customerId!: string;

  @ApiProperty({ example: 'uuid-of-vehicle' })
  @IsUUID()
  vehicleId!: string;

  @ApiPropertyOptional({ example: 'uuid-of-technician' })
  @IsOptional()
  @IsUUID()
  technicianId?: string;

  @ApiPropertyOptional({ example: 87500, description: 'Vehicle odometer reading in km' })
  @IsOptional()
  @IsInt()
  @Min(0)
  currentKm?: number;

  @ApiPropertyOptional({ example: 20, default: 0, description: 'Tax rate as percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number = 0;

  @ApiPropertyOptional({ example: 'Brake pads also need replacement' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreateWorkOrderItemDto], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateWorkOrderItemDto)
  items!: CreateWorkOrderItemDto[];
}
