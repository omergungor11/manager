import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export type CashRegisterType = 'cash' | 'bank';

export const CASH_REGISTER_TYPES: CashRegisterType[] = ['cash', 'bank'];

export class CreateCashRegisterDto {
  @ApiProperty({ example: 'Ana Kasa', description: 'Cash register name' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({
    enum: CASH_REGISTER_TYPES,
    example: 'cash',
    description: 'Register type: cash (physical) or bank (bank account)',
  })
  @IsNotEmpty()
  @IsEnum(CASH_REGISTER_TYPES)
  type!: CashRegisterType;

  @ApiPropertyOptional({
    example: 'TR12 0000 1234 5678 9012 34',
    description: 'Bank account number (relevant for bank type)',
  })
  @IsOptional()
  @IsString()
  accountNo?: string;

  @ApiPropertyOptional({
    example: 'Akbank',
    description: 'Bank name (relevant for bank type)',
  })
  @IsOptional()
  @IsString()
  bankName?: string;
}
