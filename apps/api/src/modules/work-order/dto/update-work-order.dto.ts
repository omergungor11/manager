import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class UpdateWorkOrderDto {
  @ApiPropertyOptional({ example: 'uuid-of-technician' })
  @IsOptional()
  @IsUUID()
  technicianId?: string;

  @ApiPropertyOptional({ example: 87500, description: 'Vehicle odometer reading in km' })
  @IsOptional()
  @IsInt()
  @Min(0)
  currentKm?: number;

  @ApiPropertyOptional({ example: 20, description: 'Tax rate as percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @ApiPropertyOptional({ example: 'Customer also requested tire rotation' })
  @IsOptional()
  @IsString()
  notes?: string;
}
