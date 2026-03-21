import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAccountDto {
  @ApiProperty({ example: 'Ahmet Oto Yedek Parça Ltd.' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ enum: ['customer', 'supplier', 'other'], example: 'customer' })
  @IsNotEmpty()
  @IsEnum(['customer', 'supplier', 'other'])
  type!: 'customer' | 'supplier' | 'other';

  @ApiPropertyOptional({ example: '+90 533 123 45 67' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'info@ahmetoto.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Lefkoşa, KKTC' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '12345678901' })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({ example: 'Tedarikçi — vade 30 gün' })
  @IsOptional()
  @IsString()
  notes?: string;
}
