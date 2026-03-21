import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVehicleDto {
  @ApiProperty({ example: '34 ABC 123' })
  @IsNotEmpty()
  @IsString()
  licensePlate!: string;

  @ApiPropertyOptional({ example: 'uuid-brand-id' })
  @IsOptional()
  @IsUUID()
  brandId!: string;

  @ApiPropertyOptional({ example: 'uuid-model-id' })
  @IsOptional()
  @IsUUID()
  modelId!: string;

  @ApiPropertyOptional({ example: 'Toyota' })
  @IsOptional()
  @IsString()
  brandName!: string;

  @ApiPropertyOptional({ example: 'Corolla' })
  @IsOptional()
  @IsString()
  modelName!: string;

  @ApiPropertyOptional({ example: 2020 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  year!: number;

  @ApiPropertyOptional({ example: 'Beyaz' })
  @IsOptional()
  @IsString()
  color!: string;

  @ApiPropertyOptional({ example: 'JT2BF22K1W0012345' })
  @IsOptional()
  @IsString()
  vin!: string;

  @ApiPropertyOptional({ example: 75000, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  currentKm!: number;

  @ApiPropertyOptional({ example: 'Son bakımda fren balatası değiştirildi.' })
  @IsOptional()
  @IsString()
  notes!: string;
}
