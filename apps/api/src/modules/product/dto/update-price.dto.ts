import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min, ValidateIf } from 'class-validator';

export class UpdatePriceDto {
  @ApiPropertyOptional({ example: 150.0, description: 'Cost price (purchase price)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  costPrice?: number;

  @ApiPropertyOptional({ example: 220.0, description: 'Sale price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  salePrice?: number;

  @ValidateIf((o: UpdatePriceDto) => o.costPrice === undefined && o.salePrice === undefined)
  @IsNumber({}, { message: 'At least one of costPrice or salePrice must be provided' })
  _atLeastOne?: never;
}
