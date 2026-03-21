import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class QueryTenantDto {
  @ApiPropertyOptional({ description: 'Ad veya slug ile ara', example: 'oto' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['active', 'inactive', 'suspended', 'deleted'] })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'suspended', 'deleted'])
  status?: string;

  @ApiPropertyOptional({ enum: ['free', 'pro', 'enterprise'] })
  @IsOptional()
  @IsEnum(['free', 'pro', 'enterprise'])
  plan?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
