import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Ahmet Yılmaz' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ enum: ['individual', 'company'], default: 'individual' })
  @IsOptional()
  @IsEnum(['individual', 'company'])
  type?: 'individual' | 'company' = 'individual';

  @ApiPropertyOptional({ example: '+90 533 123 45 67' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'ahmet@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Lefkoşa, Kıbrıs' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '12345678901' })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({ example: 'VIP müşteri' })
  @IsOptional()
  @IsString()
  notes?: string;
}
